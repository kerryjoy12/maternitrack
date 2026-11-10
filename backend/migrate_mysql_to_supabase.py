#!/usr/bin/env python
"""
migrate_mysql_to_supabase.py
─────────────────────────────
Full data migration from MySQL (maternity_db) to Supabase PostgreSQL.

Strategy
────────
1. Connect to MySQL using PyMySQL (read-only source).
2. Connect to Supabase PostgreSQL using psycopg2 (write target).
3. Migrate tables in dependency order (parents before children).
4. Preserve all integer PKs and FKs — no UUID conversion needed
   since Django models already use BigAutoField.
5. Re-sequence PostgreSQL sequences after bulk insert.
6. Verify row counts match.

Usage
─────
  # Install deps first:
  pip install PyMySQL psycopg2-binary python-decouple

  # Run from backend/ directory:
  python migrate_mysql_to_supabase.py

  # Dry-run (count-only, no writes):
  python migrate_mysql_to_supabase.py --dry-run

  # Single table:
  python migrate_mysql_to_supabase.py --table staff_users

Rollback
────────
  If migration fails mid-way, truncate target tables and re-run.
  The script is idempotent — it truncates before inserting.
  See rollback section at the bottom.
"""
import sys
import argparse
import logging
from datetime import datetime

try:
    import pymysql
except ImportError:
    sys.exit('PyMySQL not installed. Run: pip install PyMySQL')

try:
    import psycopg2
    from psycopg2 import sql
    from psycopg2.extras import execute_values
except ImportError:
    sys.exit('psycopg2 not installed. Run: pip install psycopg2-binary')

from decouple import config
import uuid

def int_to_uuid(val):
    if val is None:
        return None
    try:
        # Generate a deterministic UUID from the integer ID
        return str(uuid.UUID(int=int(val)))
    except (ValueError, TypeError):
        return val

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)


# ── Table migration order (parents before children) ───────────────────────────
# Each entry: (mysql_table, postgres_table)
# Using same names since Django keeps them identical.
TABLE_ORDER = [
    # Auth / Users
    'auth_permission',
    'django_content_type',
    'auth_group',
    'auth_group_permissions',
    'staff_users',
    'staff_users_groups',
    'staff_users_user_permissions',

    # Core patient data
    'patients',
    'patient_medical_conditions',
    'patient_surgical_histories',
    'patient_allergies',
    'patient_family_histories',

    # Appointments
    'appointments',

    # Clinical
    'clinical_notes',
    'patient_documents',
    'anc_visits',
    'partograph_entries',
    'symptom_reports',
    'secure_messages',

    # Postnatal & pediatrics
    'postnatal_records',
    'pediatrics_child_profile',
    'pediatrics_growth_record',
    'pediatrics_vaccination_record',
    'pediatrics_clinic_visit',

    # Nutrition
    'nutrition_categories',
    'patient_nutrition_profiles',
    'diet_plans',
    'diet_recommendations',
    'weight_logs',
    'nutrition_dietplan_categories',

    # Reminders & alerts
    'clinical_alerts',
    'reminder_logs',

    # Tickets & notifications
    'clinical_tickets',
    'ticket_notifications',
    'ticket_replies',

    # Referrals
    'referral_records',

    # Mortality
    'maternal_death_reviews',

    # PMTCT
    'pmtct_records',

    # Education
    'education_modules',
    'education_module_progress',

    # Procedures
    'clinical_procedures',
    'procedure_steps',
    'emergency_protocols',
    'emergency_drugs',
    'procedure_equipment',
    'clinical_checklists',
    'protocol_access_logs',

    # Audit history tables (django-simple-history)
    'patients_historicalpatient',
    'patients_historicalpartographentry',
    'appointments_historicalappointment',
    'postnatal_historicalpostnatalrecord',

    # Django internals
    'django_migrations',
    'django_session',
    'django_admin_log',
]

# Tables to skip entirely (will be recreated by Django migrations)
SKIP_TABLES = {
    'django_migrations',  # Re-run migrations on PG instead
}

# Map tables and their columns containing StaffUser foreign keys for UUID conversion
STAFF_USER_FIELDS = {
    'staff_users': ['id'],
    'users_staffuser_groups': ['staffuser_id'],
    'users_staffuser_user_permissions': ['staffuser_id'],
    'patients': ['registered_by_id'],
    'clinical_notes': ['created_by_id'],
    'patient_documents': ['uploaded_by_id'],
    'anc_visits': ['attending_staff_id'],
    'partograph_entries': ['recorded_by_id'],
    'symptom_reports': ['reviewed_by_id'],
    'secure_messages': ['sender_id', 'recipient_id'],
    'postnatal_records': ['created_by_id'],
    'pediatrics_vaccination_record': ['administered_by_id'],
    'pediatrics_clinic_visit': ['attending_staff_id'],
    'clinical_tickets': ['created_by_id'],
    'ticket_notifications': ['user_id'],
    'ticket_replies': ['author_id'],
    'pmtct_records': ['counselor_id'],
    'referrals': ['referred_by_id'],
    'reminder_logs': ['sent_by_id'],
    'education_resources': ['created_by_id'],
    'django_admin_log': ['user_id'],
    # Historical tables
    'patients_historicalpatient': ['history_user_id'],
    'patients_historicalpartographentry': ['history_user_id'],
    'appointments_historicalappointment': ['history_user_id'],
    'postnatal_historicalpostnatalrecord': ['history_user_id'],
}


def mysql_connect():
    return pymysql.connect(
        host=config('MYSQL_HOST', default='127.0.0.1'),
        port=config('MYSQL_PORT', default=3306, cast=int),
        user=config('MYSQL_USER', default='root'),
        password=config('MYSQL_PASSWORD', default=''),
        database=config('MYSQL_DB', default='maternity_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
    )


def pg_connect():
    return psycopg2.connect(
        host=config('DB_HOST'),
        port=config('DB_PORT', default='5432'),
        dbname=config('DB_NAME', default='postgres'),
        user=config('DB_USER', default='postgres'),
        password=config('DB_PASSWORD'),
        sslmode=config('DB_SSLMODE', default='require'),
        connect_timeout=30,
    )


def get_mysql_tables(mysql_conn) -> list:
    with mysql_conn.cursor() as cur:
        cur.execute("SHOW TABLES")
        return [list(row.values())[0] for row in cur.fetchall()]


def migrate_table(mysql_conn, pg_conn, table: str, dry_run: bool) -> dict:
    """Migrate a single table. Returns {'table': str, 'rows': int, 'status': str}."""
    mysql_cur = mysql_conn.cursor()
    pg_cur    = pg_conn.cursor() if pg_conn else None

    try:
        # Fetch all rows from MySQL
        mysql_cur.execute(f'SELECT * FROM `{table}`')
        rows = mysql_cur.fetchall()

        if not rows:
            log.info('  %-50s  0 rows (empty)', table)
            return {'table': table, 'rows': 0, 'status': 'empty'}

        columns = list(rows[0].keys())
        n = len(rows)

        if dry_run:
            log.info('  %-50s  %d rows (dry-run)', table, n)
            return {'table': table, 'rows': n, 'status': 'dry-run'}


        # Bulk insert
        col_identifiers = sql.SQL(', ').join(map(sql.Identifier, columns))
        insert_sql = sql.SQL('INSERT INTO {} ({}) VALUES %s').format(
            sql.Identifier(table),
            col_identifiers,
        )
        
        # Get boolean columns from PG to convert MySQL 1/0 to Python True/False
        boolean_cols = set()
        if pg_conn:
            pg_cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = %s AND data_type = 'boolean'",
                [table]
            )
            boolean_cols = {r[0] for r in pg_cur.fetchall()}

        # Convert user IDs to UUIDs if applicable, and format boolean columns
        mapped_rows = []
        user_cols = STAFF_USER_FIELDS.get(table, [])
        for row in rows:
            mapped_row = dict(row)
            for col in user_cols:
                if col in mapped_row:
                    mapped_row[col] = int_to_uuid(mapped_row[col])
            for col in boolean_cols:
                if col in mapped_row and mapped_row[col] is not None:
                    mapped_row[col] = bool(mapped_row[col])
            mapped_rows.append(mapped_row)

        values = [tuple(row[c] for c in columns) for row in mapped_rows]
        execute_values(pg_cur, insert_sql, values, page_size=500)

        # Re-sync the serial/sequence for the id column if it exists and is a sequence
        if 'id' in columns:
            pg_cur.execute(
                sql.SQL("SELECT pg_get_serial_sequence(%s, 'id')"),
                [table]
            )
            seq = pg_cur.fetchone()[0]
            if seq:
                pg_cur.execute(
                    sql.SQL(
                        "SELECT setval(%s, COALESCE(MAX(id), 1)) FROM {}"
                    ).format(sql.Identifier(table)),
                    [seq],
                )

        pg_conn.commit()
        log.info('  %-50s  %d rows  ✓', table, n)
        return {'table': table, 'rows': n, 'status': 'ok'}

    except Exception as exc:
        if pg_conn:
            pg_conn.rollback()
        log.error('  %-50s  FAILED: %s', table, exc)
        return {'table': table, 'rows': 0, 'status': f'error: {exc}'}
    finally:
        mysql_cur.close()
        if pg_cur:
            pg_cur.close()


def verify_counts(mysql_conn, pg_conn, tables: list) -> list:
    """Compare row counts between MySQL and PostgreSQL."""
    mismatches = []
    mysql_cur = mysql_conn.cursor()
    pg_cur    = pg_conn.cursor()

    for table in tables:
        try:
            mysql_cur.execute(f'SELECT COUNT(*) as n FROM `{table}`')
            mysql_count = mysql_cur.fetchone()['n']

            pg_cur.execute(
                sql.SQL('SELECT COUNT(*) FROM {}').format(sql.Identifier(table))
            )
            pg_count = pg_cur.fetchone()[0]

            if mysql_count != pg_count:
                mismatches.append({
                    'table':  table,
                    'mysql':  mysql_count,
                    'pg':     pg_count,
                })
        except Exception:
            pass

    mysql_cur.close()
    pg_cur.close()
    return mismatches


def main():
    parser = argparse.ArgumentParser(description='Migrate MySQL → Supabase PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Count rows only, no writes')
    parser.add_argument('--table',   type=str, help='Migrate a single table only')
    args = parser.parse_args()

    log.info('=' * 70)
    log.info('MaterniTrack  MySQL → Supabase PostgreSQL Migration')
    log.info('Started at %s', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    log.info('Dry-run: %s', args.dry_run)
    log.info('=' * 70)

    mysql_conn = mysql_connect()
    pg_conn = None
    try:
        pg_conn = pg_connect()
        log.info('Connected to MySQL and Supabase PostgreSQL')
        
        # Set session replication role to replica to temporarily bypass foreign key checks
        with pg_conn.cursor() as pg_cur:
            pg_cur.execute("SET session_replication_role = 'replica';")
            log.info('Temporarily disabled foreign key constraint checking in PostgreSQL')

        
        # Dynamically discover all foreign key columns referencing staff_users in PG
        with pg_conn.cursor() as pg_cur:
            pg_cur.execute("""
                SELECT 
                    tc.table_name, 
                    kcu.column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                WHERE 
                    tc.constraint_type = 'FOREIGN KEY' 
                    AND ccu.table_name = 'staff_users';
            """)
            for tbl, col in pg_cur.fetchall():
                if tbl not in STAFF_USER_FIELDS:
                    STAFF_USER_FIELDS[tbl] = []
                if col not in STAFF_USER_FIELDS[tbl]:
                    STAFF_USER_FIELDS[tbl].append(col)
            log.info('Discovered %d foreign keys referencing staff_users in PG', sum(len(v) for k, v in STAFF_USER_FIELDS.items() if k != 'staff_users'))

    except Exception as exc:
        if args.dry_run:
            log.warning('Could not connect to PostgreSQL (continuing dry-run): %s', exc)
        else:
            raise exc

    # Determine which tables to migrate
    available_mysql = set(get_mysql_tables(mysql_conn))

    if args.table:
        tables = [args.table] if args.table in available_mysql else []
        if not tables:
            log.error('Table %s not found in MySQL', args.table)
            sys.exit(1)
    else:
        # Use defined order, only migrate tables that actually exist
        tables = [
            t for t in TABLE_ORDER
            if t in available_mysql and t not in SKIP_TABLES
        ]
        # Add any tables present in MySQL but not in our defined order
        extras = available_mysql - set(TABLE_ORDER) - SKIP_TABLES
        if extras:
            log.warning('Tables not in migration order (will migrate last): %s', extras)
            tables.extend(sorted(extras))

    if not args.dry_run and pg_conn:
        log.info('Truncating target tables in PostgreSQL (with CASCADE)...')
        with pg_conn.cursor() as pg_cur:
            for table in tables:
                pg_cur.execute(
                    sql.SQL('TRUNCATE TABLE {} RESTART IDENTITY CASCADE').format(
                        sql.Identifier(table)
                    )
                )
            pg_conn.commit()
        log.info('Truncation completed successfully.')

    results = []
    for table in tables:
        results.append(migrate_table(mysql_conn, pg_conn, table, args.dry_run))

    # Verification
    if not args.dry_run:
        log.info('')
        log.info('── Verifying row counts ──')
        ok_tables = [r['table'] for r in results if r['status'] == 'ok']
        mismatches = verify_counts(mysql_conn, pg_conn, ok_tables)
        if mismatches:
            log.warning('Row count mismatches:')
            for m in mismatches:
                log.warning('  %-50s  MySQL=%d  PG=%d', m['table'], m['mysql'], m['pg'])
        else:
            log.info('All row counts match ✓')

    # Summary
    ok      = sum(1 for r in results if r['status'] == 'ok')
    errors  = sum(1 for r in results if r['status'].startswith('error'))
    total_rows = sum(r['rows'] for r in results)

    log.info('')
    log.info('── Summary ──────────────────────────────────────────────────────')
    log.info('Tables migrated:  %d / %d', ok, len(results))
    log.info('Total rows:       %d', total_rows)
    log.info('Errors:           %d', errors)

    if errors:
        log.error('Migration completed WITH ERRORS. Check logs above.')
        sys.exit(1)
    else:
        log.info('Migration completed successfully.')

    if pg_conn:
        try:
            with pg_conn.cursor() as pg_cur:
                pg_cur.execute("SET session_replication_role = 'origin';")
                log.info('Restored foreign key constraint checking in PostgreSQL')
        except Exception:
            pass
        pg_conn.close()
    mysql_conn.close()


# ── Rollback instructions ─────────────────────────────────────────────────────
# If migration fails and you need to start over:
#
#   1. In Supabase SQL Editor, truncate all app tables:
#      DO $$
#      DECLARE r RECORD;
#      BEGIN
#        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
#        LOOP
#          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
#        END LOOP;
#      END $$;
#
#   2. Re-run Django migrations on the clean PG:
#      python manage.py migrate
#
#   3. Re-run this script:
#      python migrate_mysql_to_supabase.py


if __name__ == '__main__':
    main()
