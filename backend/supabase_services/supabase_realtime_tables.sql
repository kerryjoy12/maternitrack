-- ============================================================================
-- supabase_realtime_tables.sql
-- Run this in Supabase Dashboard → SQL Editor ONCE before first deployment.
-- These tables are watched by Supabase Realtime (CDC).
-- ============================================================================

-- 1. Staff Notifications (doctor / nurse alerts)
CREATE TABLE IF NOT EXISTS realtime_staff_notifications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             UUID         NOT NULL,
    title               TEXT         NOT NULL,
    message             TEXT         NOT NULL,
    notification_type   TEXT         NOT NULL DEFAULT 'INFO',
    patient_id          BIGINT,
    metadata            JSONB,
    is_read             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE realtime_staff_notifications ENABLE ROW LEVEL SECURITY;

-- Staff can only read their own notifications
CREATE POLICY "staff_own_notifications" ON realtime_staff_notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can insert (Django writes via service key — bypasses RLS)
CREATE POLICY "service_insert_notifications" ON realtime_staff_notifications
    FOR INSERT WITH CHECK (TRUE);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_realtime_notif_user
    ON realtime_staff_notifications (user_id, is_read, created_at DESC);


-- 2. Clinical Alert Broadcasts
CREATE TABLE IF NOT EXISTS realtime_clinical_alerts (
    id               BIGSERIAL PRIMARY KEY,
    alert_type       TEXT        NOT NULL,
    severity         TEXT        NOT NULL DEFAULT 'WARNING',
    patient_id       BIGINT      NOT NULL,
    message          TEXT        NOT NULL,
    recipient_roles  TEXT[]      NOT NULL DEFAULT '{ADMIN,NURSE,DOCTOR}',
    acknowledged     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE realtime_clinical_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert_alerts" ON realtime_clinical_alerts
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "authenticated_read_alerts" ON realtime_clinical_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_realtime_alerts_patient
    ON realtime_clinical_alerts (patient_id, acknowledged, created_at DESC);


-- 3. Patient Messages (secure patient-staff messaging)
CREATE TABLE IF NOT EXISTS realtime_patient_messages (
    id            BIGSERIAL PRIMARY KEY,
    sender_id     UUID         NOT NULL,
    recipient_id  UUID,
    patient_id    BIGINT       NOT NULL,
    message       TEXT         NOT NULL,
    message_type  TEXT         NOT NULL DEFAULT 'GENERAL',
    is_read       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE realtime_patient_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert_messages" ON realtime_patient_messages
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "authenticated_read_messages" ON realtime_patient_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_realtime_messages_patient
    ON realtime_patient_messages (patient_id, is_read, created_at);


-- 4. Appointment Events (real-time calendar updates)
CREATE TABLE IF NOT EXISTS realtime_appointment_events (
    id               BIGSERIAL PRIMARY KEY,
    appointment_id   BIGINT       NOT NULL,
    patient_id       BIGINT       NOT NULL,
    new_status       TEXT         NOT NULL,
    scheduled_date   DATE         NOT NULL,
    appointment_type TEXT         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE realtime_appointment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert_appt_events" ON realtime_appointment_events
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "authenticated_read_appt_events" ON realtime_appointment_events
    FOR SELECT USING (auth.role() = 'authenticated');


-- ============================================================================
-- Enable Realtime publication for all four tables
-- Run in Supabase Dashboard → Database → Replication
-- Or run this SQL:
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE
    realtime_staff_notifications,
    realtime_clinical_alerts,
    realtime_patient_messages,
    realtime_appointment_events;
