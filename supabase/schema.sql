-- =====================================================
-- BadgerLuxClean Data Command Center — Supabase Schema
-- Paste this into the Supabase SQL Editor and run it.
-- =====================================================

-- ─── TABLES ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id    TEXT UNIQUE NOT NULL,
  booking_date  DATE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  service_type  TEXT,
  frequency     TEXT,
  conversion_status TEXT DEFAULT '',
  charge_amount NUMERIC(10,2) DEFAULT 0,
  job_cost      NUMERIC(10,2) DEFAULT 0,
  margin        NUMERIC(10,2) GENERATED ALWAYS AS (charge_amount - job_cost) STORED,
  status        TEXT DEFAULT 'Active',
  acquisition_source TEXT,
  provider_assigned TEXT,
  va_setter     TEXT,
  booking_source TEXT,
  address       TEXT,
  synced_at     TIMESTAMPTZ DEFAULT now(),
  data_source   TEXT DEFAULT 'sync',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id        TEXT,
  first_name         TEXT,
  last_name          TEXT,
  email              TEXT UNIQUE NOT NULL,
  phone              TEXT,
  address            TEXT,
  city               TEXT,
  date_created       DATE,
  acquisition_source TEXT,
  customer_type      TEXT,
  data_source        TEXT DEFAULT 'sync',
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cancellations (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id         TEXT UNIQUE NOT NULL,
  customer_name      TEXT,
  customer_email     TEXT,
  cancel_date        DATE,
  frequency          TEXT,
  revenue_lost       NUMERIC(10,2) DEFAULT 0,
  booking_source     TEXT,
  acquisition_source TEXT,
  provider           TEXT,
  va_setter          TEXT,
  data_source        TEXT DEFAULT 'sync',
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charges (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  charge_id       TEXT UNIQUE NOT NULL,
  booking_id      TEXT,
  customer_name   TEXT,
  customer_email  TEXT,
  charge_date     DATE,
  charge_amount   NUMERIC(10,2) DEFAULT 0,
  frequency       TEXT,
  payment_status  TEXT DEFAULT 'Paid',
  tips            NUMERIC(10,2) DEFAULT 0,
  extras          NUMERIC(10,2) DEFAULT 0,
  provider        TEXT,
  job_cost        NUMERIC(10,2) DEFAULT 0,
  margin          NUMERIC(10,2) GENERATED ALWAYS AS (charge_amount - job_cost) STORED,
  data_source     TEXT DEFAULT 'sync',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_date         DATE,
  name              TEXT,
  phone             TEXT,
  email             TEXT,
  va_assigned       TEXT,
  brand             TEXT,
  source            TEXT,
  type_of_clean     TEXT,
  client_type       TEXT,
  status            TEXT,
  objection         TEXT,
  luxe_routine_seed TEXT,
  follow_up         TEXT,
  final_result      TEXT,
  cleaning_date     DATE,
  revenue           NUMERIC(10,2) DEFAULT 0,
  provider_pay      NUMERIC(10,2) DEFAULT 0,
  region            TEXT,
  notes             TEXT,
  archived_month    TEXT,
  data_source       TEXT DEFAULT 'sync',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_frequency ON bookings(frequency);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);
CREATE INDEX IF NOT EXISTS idx_bookings_va ON bookings(va_setter);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_date ON customers(date_created);

CREATE INDEX IF NOT EXISTS idx_cancellations_email ON cancellations(customer_email);
CREATE INDEX IF NOT EXISTS idx_cancellations_date ON cancellations(cancel_date);
CREATE INDEX IF NOT EXISTS idx_cancellations_booking ON cancellations(booking_id);

CREATE INDEX IF NOT EXISTS idx_charges_email ON charges(customer_email);
CREATE INDEX IF NOT EXISTS idx_charges_date ON charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(payment_status);
CREATE INDEX IF NOT EXISTS idx_charges_booking ON charges(booking_id);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_date ON leads(lead_date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_va ON leads(va_assigned);
CREATE INDEX IF NOT EXISTS idx_leads_result ON leads(final_result);

-- ─── RLS ────────────────────────────────────────────

ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authenticated" ON bookings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service_role" ON bookings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow select for authenticated" ON customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service_role" ON customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow select for authenticated" ON cancellations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service_role" ON cancellations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow select for authenticated" ON charges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service_role" ON charges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow select for authenticated" ON leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service_role" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── MATERIALIZED VIEWS ─────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpis AS
SELECT
  COUNT(*)::INT                                         AS total_bookings,
  COALESCE(SUM(charge_amount), 0)::NUMERIC(12,2)       AS total_revenue,
  COALESCE(SUM(job_cost), 0)::NUMERIC(12,2)            AS total_cost,
  COALESCE(SUM(margin), 0)::NUMERIC(12,2)              AS gross_margin,
  CASE WHEN SUM(charge_amount) > 0
    THEN ROUND(SUM(margin) / SUM(charge_amount) * 100, 1)
    ELSE 0 END::NUMERIC(5,1)                            AS margin_pct,
  CASE WHEN COUNT(*) > 0
    THEN ROUND(SUM(charge_amount) / COUNT(*), 2)
    ELSE 0 END::NUMERIC(10,2)                           AS avg_job,
  COUNT(*) FILTER (
    WHERE status = 'Active'
      AND frequency NOT IN ('One-Time', '')
      AND frequency IS NOT NULL
  )::INT                                                AS active_recurring,
  COALESCE(SUM(
    CASE
      WHEN status = 'Active' AND frequency = 'Weekly'          THEN charge_amount * 4
      WHEN status = 'Active' AND frequency = 'Every Other Week' THEN charge_amount * 2
      WHEN status = 'Active' AND frequency = 'Monthly'         THEN charge_amount
      WHEN status = 'Active' AND frequency = 'Quarterly'       THEN charge_amount / 3.0
      WHEN status = 'Active' AND frequency = 'Every Other Month' THEN charge_amount / 2.0
      ELSE 0
    END
  ), 0)::NUMERIC(12,2)                                  AS mrr,
  (SELECT COUNT(*) FROM customers)::INT                  AS total_customers,
  CASE WHEN (SELECT COUNT(*) FROM customers) > 0
    THEN ROUND(SUM(charge_amount) / (SELECT COUNT(*) FROM customers), 2)
    ELSE 0 END::NUMERIC(10,2)                            AS customer_ltv
FROM bookings;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly AS
SELECT
  TO_CHAR(booking_date, 'YYYY-MM') AS month,
  COUNT(*)::INT AS bookings,
  COALESCE(SUM(charge_amount), 0)::NUMERIC(12,2) AS revenue,
  COALESCE(SUM(job_cost), 0)::NUMERIC(12,2) AS cost,
  COALESCE(SUM(margin), 0)::NUMERIC(12,2) AS margin,
  COUNT(*) FILTER (WHERE frequency = 'One-Time' OR frequency IS NULL OR frequency = '')::INT AS ot_jobs,
  COUNT(*) FILTER (WHERE frequency NOT IN ('One-Time', '') AND frequency IS NOT NULL)::INT AS recur_jobs,
  COALESCE(SUM(charge_amount) FILTER (WHERE frequency = 'One-Time' OR frequency IS NULL OR frequency = ''), 0)::NUMERIC(12,2) AS ot_revenue,
  COALESCE(SUM(charge_amount) FILTER (WHERE frequency NOT IN ('One-Time', '') AND frequency IS NOT NULL), 0)::NUMERIC(12,2) AS recur_revenue,
  COUNT(DISTINCT customer_email)::INT AS unique_customers,
  COUNT(DISTINCT customer_email) FILTER (WHERE frequency NOT IN ('One-Time', '') AND frequency IS NOT NULL)::INT AS recur_customers
FROM bookings
WHERE booking_date IS NOT NULL
GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
ORDER BY month;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sources AS
SELECT
  source,
  COUNT(*)::INT AS total_leads,
  COUNT(*) FILTER (WHERE final_result = 'Booked')::INT AS booked,
  CASE WHEN COUNT(*) > 0
    THEN ROUND(COUNT(*) FILTER (WHERE final_result = 'Booked')::NUMERIC / COUNT(*) * 100, 1)
    ELSE 0 END::NUMERIC(5,1) AS close_rate,
  COUNT(*) FILTER (WHERE final_result = 'Pending')::INT AS pending,
  COUNT(*) FILTER (WHERE final_result = 'Not booked')::INT AS lost,
  COUNT(*) FILTER (WHERE status = 'Ghosted')::INT AS ghosted,
  COUNT(*) FILTER (WHERE status = 'Invalid')::INT AS invalid,
  COALESCE(SUM(revenue), 0)::NUMERIC(12,2) AS revenue,
  COUNT(*) FILTER (WHERE luxe_routine_seed IN ('Yes', 'Recurring booked first call'))::INT AS luxe_seeds,
  COUNT(*) FILTER (WHERE final_result = 'Booked' AND type_of_clean = 'Recurring')::INT AS recur_booked
FROM leads
WHERE source IS NOT NULL AND source != ''
GROUP BY source
ORDER BY total_leads DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_va_performance AS
SELECT
  va_assigned,
  COUNT(*)::INT AS total_leads,
  COUNT(*) FILTER (WHERE final_result = 'Booked')::INT AS booked,
  CASE WHEN COUNT(*) > 0
    THEN ROUND(COUNT(*) FILTER (WHERE final_result = 'Booked')::NUMERIC / COUNT(*) * 100, 1)
    ELSE 0 END::NUMERIC(5,1) AS close_rate,
  COUNT(*) FILTER (WHERE final_result = 'Pending')::INT AS pending,
  COUNT(*) FILTER (WHERE final_result = 'Not booked')::INT AS lost,
  COUNT(*) FILTER (WHERE status = 'Ghosted')::INT AS ghosted,
  COALESCE(SUM(revenue), 0)::NUMERIC(12,2) AS revenue,
  COALESCE(SUM(revenue) - SUM(provider_pay), 0)::NUMERIC(12,2) AS margin,
  COUNT(*) FILTER (WHERE luxe_routine_seed IN ('Yes', 'Recurring booked first call'))::INT AS luxe_seeds,
  COUNT(*) FILTER (WHERE final_result = 'Booked' AND type_of_clean = 'Recurring')::INT AS recur_conversions
FROM leads
WHERE va_assigned IS NOT NULL AND va_assigned != ''
GROUP BY va_assigned
ORDER BY total_leads DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_objections AS
SELECT
  objection,
  COUNT(*)::INT AS count,
  COUNT(*) FILTER (WHERE final_result = 'Booked')::INT AS booked_after
FROM leads
WHERE objection IS NOT NULL AND objection != ''
GROUP BY objection
ORDER BY count DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_retention AS
SELECT
  COUNT(*) FILTER (
    WHERE customer_type = 'Active Recurring'
  )::INT AS active_recurring,
  COUNT(*) FILTER (
    WHERE customer_type = 'Churned (Cancelled)'
  )::INT AS churned,
  COUNT(*) FILTER (
    WHERE customer_type IN ('Active Recurring', 'Churned (Cancelled)')
  )::INT AS total_ever_recurring,
  CASE WHEN COUNT(*) FILTER (WHERE customer_type IN ('Active Recurring', 'Churned (Cancelled)')) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE customer_type = 'Active Recurring')::NUMERIC
      / COUNT(*) FILTER (WHERE customer_type IN ('Active Recurring', 'Churned (Cancelled)')) * 100, 1
    )
    ELSE 0 END::NUMERIC(5,1) AS retention_pct
FROM customers;

-- ─── REFRESH FUNCTION ───────────────────────────────

CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_kpis;
  REFRESH MATERIALIZED VIEW mv_monthly;
  REFRESH MATERIALIZED VIEW mv_sources;
  REFRESH MATERIALIZED VIEW mv_va_performance;
  REFRESH MATERIALIZED VIEW mv_objections;
  REFRESH MATERIALIZED VIEW mv_retention;
END;
$$;
