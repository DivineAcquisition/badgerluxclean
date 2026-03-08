import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_DOMAINS = ["badgerluxecleaning.com", "divineacquisition.io"];
const SHARED_PASSWORD = "Badgerdcc2026!";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Access restricted to authorized domains" },
        { status: 403 }
      );
    }

    if (password !== SHARED_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const admin = getAdmin();

    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      const { error: createError } = await admin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: SHARED_PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        console.error("User creation error:", createError.message);
        return NextResponse.json(
          { error: "Failed to provision account" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Login route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
