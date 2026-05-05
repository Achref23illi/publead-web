import { NextResponse } from "next/server";
import { getPaymentsConfig } from "@/lib/wallet";

// Public read so mobile/web UIs can show min withdrawal + hold info.
export async function GET() {
  const payments = await getPaymentsConfig();
  return NextResponse.json({ payments });
}
