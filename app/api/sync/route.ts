import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );
  }
  return _admin;
}

// ─── Helpers ────────────────────────────────────────

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/[$,\s]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: unknown): string | null {
  if (!v || String(v).trim() === "") return null;
  const s = String(v).trim();

  // ISO: 2025-06-15
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  // Try native parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

type SheetRow = Record<string, unknown>;

function get(row: SheetRow, key: string): string {
  return clean(row[key]);
}

function getNum(row: SheetRow, key: string): number {
  return parseNum(row[key]);
}

function getDate(row: SheetRow, key: string): string | null {
  return parseDate(row[key]);
}

// ─── Row Mappers ────────────────────────────────────

function mapBooking(row: SheetRow) {
  return {
    booking_id: get(row, "Booking ID"),
    booking_date: getDate(row, "Booking Date"),
    customer_name: get(row, "Customer Name"),
    customer_email: get(row, "Customer Email"),
    customer_phone: get(row, "Customer Phone"),
    service_type: get(row, "Service Type"),
    frequency: get(row, "Frequency"),
    conversion_status: get(row, "Conversion Status"),
    charge_amount: getNum(row, "Charge Amount"),
    job_cost: getNum(row, "Job Cost"),
    status: get(row, "Status") || "Active",
    acquisition_source: get(row, "Acquisition Source"),
    provider_assigned: get(row, "Provider Assigned"),
    va_setter: get(row, "VA / Setter"),
    booking_source: get(row, "Booking Source"),
    address: get(row, "Address"),
    data_source: get(row, "Data Source") || "sync",
    synced_at: new Date().toISOString(),
  };
}

function mapCustomer(row: SheetRow) {
  return {
    customer_id: get(row, "Customer ID"),
    first_name: get(row, "First Name"),
    last_name: get(row, "Last Name"),
    email: get(row, "Email"),
    phone: get(row, "Phone"),
    address: get(row, "Address"),
    city: get(row, "City"),
    date_created: getDate(row, "Date Created"),
    acquisition_source: get(row, "Acquisition Source"),
    customer_type: get(row, "Customer Type"),
    data_source: get(row, "Data Source") || "sync",
  };
}

function mapCancellation(row: SheetRow) {
  return {
    booking_id: get(row, "Booking ID"),
    customer_name: get(row, "Customer Name"),
    customer_email: get(row, "Customer Email"),
    cancel_date: getDate(row, "Cancel Date"),
    frequency: get(row, "Frequency"),
    revenue_lost: getNum(row, "Revenue Lost"),
    booking_source: get(row, "Booking Source"),
    acquisition_source: get(row, "Acquisition Source"),
    provider: get(row, "Provider"),
    va_setter: get(row, "VA / Setter"),
    data_source: get(row, "Data Source") || "sync",
  };
}

function mapCharge(row: SheetRow) {
  return {
    charge_id: get(row, "Charge ID"),
    booking_id: get(row, "Booking ID"),
    customer_name: get(row, "Customer Name"),
    customer_email: get(row, "Customer Email"),
    charge_date: getDate(row, "Charge Date"),
    charge_amount: getNum(row, "Charge Amount"),
    frequency: get(row, "Frequency"),
    payment_status: get(row, "Payment Status") || "Paid",
    tips: getNum(row, "Tips"),
    extras: getNum(row, "Extras"),
    provider: get(row, "Provider"),
    job_cost: getNum(row, "Job Cost"),
    data_source: get(row, "Data Source") || "sync",
  };
}

function mapLead(row: SheetRow) {
  return {
    lead_date: getDate(row, "Date"),
    name: get(row, "Name"),
    phone: get(row, "Phone"),
    email: get(row, "Email"),
    va_assigned: get(row, "VA Assigned"),
    brand: get(row, "Tundra or Badger"),
    source: get(row, "Source"),
    type_of_clean: get(row, "Type of Clean"),
    client_type: get(row, "Client Type"),
    status: get(row, "Where Are We At?"),
    objection: get(row, "Objection"),
    luxe_routine_seed: get(row, "Luxe Routine Seed?"),
    follow_up: get(row, "Follow Up?"),
    final_result: get(row, "Final Result"),
    cleaning_date: getDate(row, "Date of Cleaning"),
    revenue: getNum(row, "Revenue"),
    provider_pay: getNum(row, "Provider Pay"),
    region: get(row, "Region"),
    notes: get(row, "Notes"),
    data_source: "sync",
  };
}

// ─── Batch Upsert ───────────────────────────────────

async function batchUpsert(
  table: string,
  rows: Record<string, unknown>[],
  conflictKey: string,
  batchSize = 500
): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await getAdmin()
      .from(table)
      .upsert(batch, { onConflict: conflictKey });
    if (error) {
      console.error(`Upsert error on ${table} batch ${i}:`, error.message);
    } else {
      count += batch.length;
    }
  }
  return count;
}

async function batchInsert(
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 500
): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await getAdmin().from(table).insert(batch);
    if (error) {
      console.error(`Insert error on ${table} batch ${i}:`, error.message);
    } else {
      count += batch.length;
    }
  }
  return count;
}

// ─── Auth Check ─────────────────────────────────────

function authorize(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET ?? "";
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7) === secret) return true;

  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
  } catch { /* ignore */ }

  return false;
}

async function authorizeBody(req: NextRequest): Promise<boolean> {
  const secret = process.env.SYNC_SECRET ?? "";
  try {
    const body = await req.clone().json();
    if (body?.secret === secret) return true;
  } catch { /* ignore */ }
  return false;
}

// ─── POST Handler (Sync) ───────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();

  if (!authorize(req) && !(await authorizeBody(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sheetApiUrl = process.env.SHEET_API_URL ?? "";
    const sheetApiSecret = process.env.SHEET_API_SECRET ?? "";
    const sheetUrl = `${sheetApiUrl}?action=readAll&secret=${sheetApiSecret}`;
    const res = await fetch(sheetUrl, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Apps Script fetch failed", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();

    const results: Record<string, number> = {};

    // Bookings
    if (data.Bookings_Raw?.rows) {
      const mapped = (data.Bookings_Raw.rows as SheetRow[])
        .map(mapBooking)
        .filter((r) => r.booking_id);
      results.bookings = await batchUpsert("bookings", mapped, "booking_id");
    }

    // Customers
    if (data.Customers_Raw?.rows) {
      const mapped = (data.Customers_Raw.rows as SheetRow[])
        .map(mapCustomer)
        .filter((r) => r.email);
      results.customers = await batchUpsert("customers", mapped, "email");
    }

    // Cancellations
    if (data.Cancellations_Raw?.rows) {
      const mapped = (data.Cancellations_Raw.rows as SheetRow[])
        .map(mapCancellation)
        .filter((r) => r.booking_id);
      results.cancellations = await batchUpsert(
        "cancellations",
        mapped,
        "booking_id"
      );
    }

    // Charges
    if (data.Charges_Raw?.rows) {
      const mapped = (data.Charges_Raw.rows as SheetRow[])
        .map(mapCharge)
        .filter((r) => r.charge_id);
      results.charges = await batchUpsert("charges", mapped, "charge_id");
    }

    // Leads — full replace
    if (data.Leads_Archive?.rows) {
      const mapped = (data.Leads_Archive.rows as SheetRow[])
        .map(mapLead)
        .filter((r) => r.name || r.email);
      await getAdmin().from("leads").delete().neq("id", 0);
      results.leads = await batchInsert("leads", mapped);
    }

    // Refresh materialized views
    await getAdmin().rpc("refresh_dashboard_views");

    return NextResponse.json({
      success: true,
      results,
      duration_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Sync error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── GET Handler (Health) ───────────────────────────

export async function GET() {
  try {
    const sheetApiUrl = process.env.SHEET_API_URL ?? "";
    const sheetApiSecret = process.env.SHEET_API_SECRET ?? "";
    const pingUrl = `${sheetApiUrl}?action=ping&secret=${sheetApiSecret}`;
    const res = await fetch(pingUrl, { cache: "no-store" });
    const body = await res.text();
    return NextResponse.json({
      status: "ok",
      apps_script: res.ok ? "reachable" : "unreachable",
      response: body,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", error: message });
  }
}
