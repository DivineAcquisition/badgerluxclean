import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
  }
  return _supabase;
}

export const supabase: SupabaseClient = new Proxy(
  {} as SupabaseClient,
  {
    get(_, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getSupabase() as any)[prop];
    },
  }
);

export interface Booking {
  id: number;
  booking_id: string;
  booking_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  frequency: string;
  conversion_status: string;
  charge_amount: number;
  job_cost: number;
  margin: number;
  status: string;
  acquisition_source: string;
  provider_assigned: string;
  va_setter: string;
  booking_source: string;
  address: string;
  synced_at: string;
  data_source: string;
  created_at: string;
}

export interface Customer {
  id: number;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  date_created: string;
  acquisition_source: string;
  customer_type: string;
  data_source: string;
  created_at: string;
}

export interface Cancellation {
  id: number;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  cancel_date: string;
  frequency: string;
  revenue_lost: number;
  booking_source: string;
  acquisition_source: string;
  provider: string;
  va_setter: string;
  data_source: string;
  created_at: string;
}

export interface Charge {
  id: number;
  charge_id: string;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  charge_date: string;
  charge_amount: number;
  frequency: string;
  payment_status: string;
  tips: number;
  extras: number;
  provider: string;
  job_cost: number;
  margin: number;
  data_source: string;
  created_at: string;
}

export interface Lead {
  id: number;
  lead_date: string;
  name: string;
  phone: string;
  email: string;
  va_assigned: string;
  brand: string;
  source: string;
  type_of_clean: string;
  client_type: string;
  status: string;
  objection: string;
  luxe_routine_seed: string;
  follow_up: string;
  final_result: string;
  cleaning_date: string;
  revenue: number;
  provider_pay: number;
  region: string;
  notes: string;
  archived_month: string;
  data_source: string;
  created_at: string;
}

export interface KPIs {
  total_bookings: number;
  total_revenue: number;
  total_cost: number;
  gross_margin: number;
  margin_pct: number;
  avg_job: number;
  active_recurring: number;
  mrr: number;
  total_customers: number;
  customer_ltv: number;
}

export interface MonthlyRow {
  month: string;
  bookings: number;
  revenue: number;
  cost: number;
  margin: number;
  ot_jobs: number;
  recur_jobs: number;
  ot_revenue: number;
  recur_revenue: number;
  unique_customers: number;
  recur_customers: number;
}

export interface SourceRow {
  source: string;
  total_leads: number;
  booked: number;
  close_rate: number;
  pending: number;
  lost: number;
  ghosted: number;
  invalid: number;
  revenue: number;
  luxe_seeds: number;
  recur_booked: number;
}

export interface VARow {
  va_assigned: string;
  total_leads: number;
  booked: number;
  close_rate: number;
  pending: number;
  lost: number;
  ghosted: number;
  revenue: number;
  margin: number;
  luxe_seeds: number;
  recur_conversions: number;
}

export interface RetentionData {
  active_recurring: number;
  churned: number;
  total_ever_recurring: number;
  retention_pct: number;
}

export interface ObjectionRow {
  objection: string;
  count: number;
  booked_after: number;
}
