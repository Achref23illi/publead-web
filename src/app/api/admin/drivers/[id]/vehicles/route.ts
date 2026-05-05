import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/session";
import { listVehiclesForDriver, serializeVehicle } from "@/lib/vehicles";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const list = await listVehiclesForDriver(id);
  return NextResponse.json({ vehicles: list.map(serializeVehicle) });
}
