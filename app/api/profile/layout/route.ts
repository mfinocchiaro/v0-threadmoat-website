import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`SELECT dashboard_layout FROM profiles WHERE id = ${session.user.id}`;
    const layout = (rows[0] as { dashboard_layout?: unknown } | undefined)?.dashboard_layout ?? null;
    return NextResponse.json({ layout });
  } catch (err) {
    console.error("[layout GET]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { layout: Record<string, string[]> };
  try {
    body = await req.json();
    if (!body.layout || typeof body.layout !== "object") throw new Error("bad shape");
    // Validate: each value must be a string array
    for (const [, v] of Object.entries(body.layout)) {
      if (!Array.isArray(v) || v.some(x => typeof x !== "string")) throw new Error("bad shape");
    }
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE profiles
      SET dashboard_layout = ${JSON.stringify(body.layout)}::jsonb
      WHERE id = ${session.user.id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[layout POST]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
