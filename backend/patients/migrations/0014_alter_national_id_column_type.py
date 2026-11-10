# Manual migration to fix national_id and nhif_number column sizes for encrypted values
from django.db import migrations

_WIDEN_SQL = [
    "ALTER TABLE patients MODIFY COLUMN national_id LONGTEXT",
    "ALTER TABLE patients MODIFY COLUMN nhif_number LONGTEXT",
    "ALTER TABLE patients MODIFY COLUMN phone_number LONGTEXT",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN national_id LONGTEXT",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN nhif_number LONGTEXT",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN phone_number LONGTEXT",
]

_NARROW_SQL = [
    "ALTER TABLE patients MODIFY COLUMN national_id VARCHAR(20)",
    "ALTER TABLE patients MODIFY COLUMN nhif_number VARCHAR(50)",
    "ALTER TABLE patients MODIFY COLUMN phone_number VARCHAR(15)",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN national_id VARCHAR(20)",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN nhif_number VARCHAR(50)",
    "ALTER TABLE patients_historicalpatient MODIFY COLUMN phone_number VARCHAR(15)",
]


def _run_sql(statements, schema_editor):
    if schema_editor.connection.vendor != 'mysql':
        return
    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)


def widen_encrypted_columns(apps, schema_editor):
    _run_sql(_WIDEN_SQL, schema_editor)


def narrow_encrypted_columns(apps, schema_editor):
    _run_sql(_NARROW_SQL, schema_editor)


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0013_alter_historicalpatient_national_id_and_more'),
    ]

    operations = [
        migrations.RunPython(widen_encrypted_columns, narrow_encrypted_columns),
    ]
