import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/session";
import {
  ProfileUpdateError,
  updateDriverProfile,
} from "@/lib/profile-service";
import type { ValidationStatus } from "@/lib/schemas";

type Body = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  status?: ValidationStatus;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  try {
    const updated = await updateDriverProfile(
      id,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        city: body.city,
        status: body.status,
      },
      {
        bypassCityCooldown: true,
        allowNameChange: true,
        allowStatusChange: true,
      },
    );
    return NextResponse.json({
      driver: {
        id: updated._id!.toString(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        city: updated.city,
        status: updated.status,
        cityChangedAt: updated.cityChangedAt?.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof ProfileUpdateError) {
      return NextResponse.json(
        { error: e.message, code: e.code, meta: e.meta },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
