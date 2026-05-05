import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/session";
import {
  ProfileUpdateError,
  updateDriverProfile,
} from "@/lib/profile-service";

type Body = {
  phone?: string;
  city?: string;
};

export async function PATCH(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Body;

  try {
    const updated = await updateDriverProfile(
      auth.driver._id!.toString(),
      { phone: body.phone, city: body.city },
      {
        bypassCityCooldown: false,
        allowNameChange: false,
        allowStatusChange: false,
      },
    );
    return NextResponse.json({
      driver: {
        id: updated._id!.toString(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        city: updated.city,
        cityChangedAt: updated.cityChangedAt?.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof ProfileUpdateError) {
      const status = e.code === "city_cooldown" ? 409 : 400;
      return NextResponse.json(
        { error: e.message, code: e.code, meta: e.meta },
        { status },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
