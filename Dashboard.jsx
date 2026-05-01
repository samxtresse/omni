import { NextResponse } from "next/server";
import { getDashboardData } from "../../../lib/windsor.js";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const datePreset = searchParams.get("preset") || "last_2years";
  const dateFrom = searchParams.get("from") || undefined;
  const dateTo = searchParams.get("to") || undefined;

  try {
    const data = await getDashboardData({ datePreset, dateFrom, dateTo });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/dashboard] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
