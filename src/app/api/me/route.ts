import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Collections } from "@/lib/schemas";
import { ObjectId } from "mongodb";
import { computePeriodStats } from "@/lib/driver-stats";
import { recomputeWallet } from "@/lib/wallet";
import { buildDocumentSummary } from "@/lib/documents";
import { listVehiclesForDriver, serializeVehicle } from "@/lib/vehicles";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const user = session.user as typeof session.user & {
    role?: string;
    status?: string;
    phone?: string;
    driverId?: string;
    companyId?: string;
    partnerId?: string;
  };

  let driver = null;
  let company = null;
  let partner = null;
  let driverStats = null;
  let documentsSummary = null;
  let vehicles = null;

  if (user.driverId) {
    driver = await db
      .collection(Collections.drivers)
      .findOne({ _id: new ObjectId(user.driverId) });
    if (driver) {
      // Settle pending → available + refresh balances on each /me hit so
      // home/payment screens see accurate wallet state.
      await recomputeWallet(user.driverId);
      driver = await db
        .collection(Collections.drivers)
        .findOne({ _id: new ObjectId(user.driverId) });

      const month = await computePeriodStats(user.driverId, "month");
      driverStats = {
        monthlyEarningsCents: month.monthlyEarningsCents,
        growthPercent: month.growthPercent,
        activeCampaigns: month.activeCampaigns,
      };

      documentsSummary = await buildDocumentSummary(user.driverId);

      const vehicleDocs = await listVehiclesForDriver(user.driverId);
      vehicles = vehicleDocs.map(serializeVehicle);
    }
  }
  if (user.companyId) {
    company = await db
      .collection(Collections.companies)
      .findOne({ _id: new ObjectId(user.companyId) });
  }
  if (user.partnerId) {
    partner = await db
      .collection(Collections.partners)
      .findOne({ _id: new ObjectId(user.partnerId) });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? "driver",
      status: user.status ?? "pending",
      phone: user.phone,
      emailVerified: user.emailVerified,
    },
    driver,
    driverStats,
    documents: documentsSummary,
    vehicles,
    company,
    partner,
  });
}
