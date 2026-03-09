import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
    );
  }
  return _admin;
}

function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const creds = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "";

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
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

type Row = Record<string, string>;

function sheetToRows(values: string[][], headerRowIdx: number): Row[] {
  if (!values || values.length <= headerRowIdx) return [];
  const headers = values[headerRowIdx].map((h) => h.trim());
  const rows: Row[] = [];
  for (let i = headerRowIdx + 1; i < values.length; i++) {
    const row: Row = {};
    const vals = values[i];
    if (!vals || vals.every((v) => !v || !v.trim())) continue;
    headers.forEach((h, ci) => {
      row[h] = vals[ci] !== undefined ? String(vals[ci]).trim() : "";
    });
    rows.push(row);
  }
  return rows;
}

function get(r: Row, k: string): string { return clean(r[k]); }
function getNum(r: Row, k: string): number { return parseNum(r[k]); }
function getDate(r: Row, k: string): string | null { return parseDate(r[k]); }

// ─── Mappers ────────────────────────────────────────

function mapBooking(r: Row) {
  return {
    booking_id: get(r, "Booking ID"),
    booking_date: getDate(r, "Booking Date"),
    customer_name: get(r, "Customer Name"),
    customer_email: get(r, "Customer Email"),
    customer_phone: get(r, "Customer Phone"),
    service_type: get(r, "Service Type"),
    frequency: get(r, "Frequency"),
    conversion_status: get(r, "Conversion Status"),
    charge_amount: getNum(r, "Charge Amount"),
    job_cost: getNum(r, "Job Cost"),
    status: get(r, "Status") || "Active",
    acquisition_source: get(r, "Acquisition Source"),
    provider_assigned: get(r, "Provider Assigned"),
    va_setter: get(r, "VA / Setter"),
    booking_source: get(r, "Booking Source"),
    address: get(r, "Address"),
    data_source: get(r, "Data Source") || "sync",
    synced_at: new Date().toISOString(),
  };
}

function mapCustomer(r: Row) {
  return {
    customer_id: get(r, "Customer ID"),
    first_name: get(r, "First Name"),
    last_name: get(r, "Last Name"),
    email: get(r, "Email"),
    phone: get(r, "Phone"),
    address: get(r, "Address"),
    city: get(r, "City"),
    date_created: getDate(r, "Date Created"),
    acquisition_source: get(r, "Acquisition Source"),
    customer_type: get(r, "Customer Type"),
    data_source: get(r, "Data Source") || "sync",
  };
}

function mapCancellation(r: Row) {
  return {
    booking_id: get(r, "Booking ID"),
    customer_name: get(r, "Customer Name"),
    customer_email: get(r, "Customer Email"),
    cancel_date: getDate(r, "Cancel Date"),
    frequency: get(r, "Frequency"),
    revenue_lost: getNum(r, "Revenue Lost"),
    booking_source: get(r, "Booking Source"),
    acquisition_source: get(r, "Acquisition Source"),
    provider: get(r, "Provider"),
    va_setter: get(r, "VA / Setter"),
    data_source: get(r, "Data Source") || "sync",
  };
}

function mapCharge(r: Row) {
  return {
    charge_id: get(r, "Charge ID"),
    booking_id: get(r, "Booking ID"),
    customer_name: get(r, "Customer Name"),
    customer_email: get(r, "Customer Email"),
    charge_date: getDate(r, "Charge Date"),
    charge_amount: getNum(r, "Charge Amount"),
    frequency: get(r, "Frequency"),
    payment_status: get(r, "Payment Status") || "Paid",
    tips: getNum(r, "Tips"),
    extras: getNum(r, "Extras"),
    provider: get(r, "Provider"),
    job_cost: getNum(r, "Job Cost"),
    data_source: get(r, "Data Source") || "sync",
  };
}

function mapLead(r: Row) {
  return {
    lead_date: getDate(r, "Date"),
    name: get(r, "Name"),
    phone: get(r, "Phone"),
    email: get(r, "Email"),
    va_assigned: get(r, "VA Assigned"),
    brand: get(r, "Tundra or Badger"),
    source: get(r, "Source"),
    type_of_clean: get(r, "Type of Clean"),
    client_type: get(r, "Client Type"),
    status: get(r, "Where Are We At?"),
    objection: get(r, "Objection"),
    luxe_routine_seed: get(r, "Luxe Routine Seed?"),
    follow_up: get(r, "Follow Up?"),
    final_result: get(r, "Final Result"),
    cleaning_date: getDate(r, "Date of Cleaning"),
    revenue: getNum(r, "Revenue"),
    provider_pay: getNum(r, "Provider Pay"),
    region: get(r, "Region"),
    notes: get(r, "Notes"),
    data_source: "sync",
  };
}

// ─── Batch Operations ───────────────────────────────

async function batchUpsert(table: string, rows: Record<string, unknown>[], conflictKey: string, batchSize = 500): Promise<number> {
  const admin = getAdmin();
  let count = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from(table).upsert(batch, { onConflict: conflictKey });
    if (error) console.error(`Upsert error on ${table} batch ${i}:`, error.message);
    else count += batch.length;
  }
  return count;
}

async function batchInsert(table: string, rows: Record<string, unknown>[], batchSize = 500): Promise<number> {
  const admin = getAdmin();
  let count = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from(table).insert(batch);
    if (error) console.error(`Insert error on ${table} batch ${i}:`, error.message);
    else count += batch.length;
  }
  return count;
}

// ─── Auth ───────────────────────────────────────────

function authorize(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET ?? "";
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7) === secret) return true;
  try { if (new URL(req.url).searchParams.get("secret") === secret) return true; } catch {}
  return false;
}

async function authorizeBody(req: NextRequest): Promise<boolean> {
  const secret = process.env.SYNC_SECRET ?? "";
  try { const body = await req.clone().json(); if (body?.secret === secret) return true; } catch {}
  return false;
}

// ─── Tab config: tab name → header row index (0-based) ─

const TABS: Record<string, { range: string; headerRow: number }> = {
  Bookings_Raw: { range: "Bookings_Raw", headerRow: 0 },
  Customers_Raw: { range: "Customers_Raw", headerRow: 0 },
  Cancellations_Raw: { range: "Cancellations_Raw", headerRow: 0 },
  Charges_Raw: { range: "Charges_Raw", headerRow: 0 },
  Leads_Archive: { range: "Leads_Archive", headerRow: 2 },
};

// ─── POST Handler ───────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();

  if (!authorize(req) && !(await authorizeBody(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sheets = getSheets();
    const admin = getAdmin();
    const results: Record<string, number> = {};

    const ranges = Object.values(TABS).map((t) => t.range);
    const resp = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges,
    });

    const valueRanges = resp.data.valueRanges || [];
    const tabData: Record<string, string[][]> = {};
    valueRanges.forEach((vr) => {
      const name = vr.range?.split("!")[0].replace(/'/g, "") || "";
      tabData[name] = (vr.values as string[][]) || [];
    });

    // Bookings
    if (tabData.Bookings_Raw) {
      const rows = sheetToRows(tabData.Bookings_Raw, TABS.Bookings_Raw.headerRow);
      const mapped = rows.map(mapBooking).filter((r) => r.booking_id);
      if (mapped.length > 0) results.bookings = await batchUpsert("bookings", mapped, "booking_id");
    }

    // Customers
    if (tabData.Customers_Raw) {
      const rows = sheetToRows(tabData.Customers_Raw, TABS.Customers_Raw.headerRow);
      const mapped = rows.map(mapCustomer).filter((r) => r.email);
      if (mapped.length > 0) results.customers = await batchUpsert("customers", mapped, "email");
    }

    // Cancellations
    if (tabData.Cancellations_Raw) {
      const rows = sheetToRows(tabData.Cancellations_Raw, TABS.Cancellations_Raw.headerRow);
      const mapped = rows.map(mapCancellation).filter((r) => r.booking_id);
      if (mapped.length > 0) results.cancellations = await batchUpsert("cancellations", mapped, "booking_id");
    }

    // Charges
    if (tabData.Charges_Raw) {
      const rows = sheetToRows(tabData.Charges_Raw, TABS.Charges_Raw.headerRow);
      const mapped = rows.map(mapCharge).filter((r) => r.charge_id);
      if (mapped.length > 0) results.charges = await batchUpsert("charges", mapped, "charge_id");
    }

    // Leads — full replace
    if (tabData.Leads_Archive) {
      const rows = sheetToRows(tabData.Leads_Archive, TABS.Leads_Archive.headerRow);
      const mapped = rows.map(mapLead).filter((r) => r.name || r.email);
      if (mapped.length > 0) {
        await admin.from("leads").delete().neq("id", 0);
        results.leads = await batchInsert("leads", mapped);
      }
    }

    // Refresh materialized views
    await admin.rpc("refresh_dashboard_views");

    return NextResponse.json({ success: true, results, duration_ms: Date.now() - start });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Sync error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── GET Handler (Health) ───────────────────────────

export async function GET() {
  try {
    const sheets = getSheets();
    const resp = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: "sheets.properties.title" });
    const tabNames = resp.data.sheets?.map((s) => s.properties?.title) || [];
    return NextResponse.json({ status: "ok", sheet_id: SHEET_ID, tabs: tabNames });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", error: message });
  }
}
