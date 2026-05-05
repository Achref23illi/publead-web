import { NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db";
import { Collections, type DriverDoc } from "./schemas";
import { ObjectId } from "mongodb";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  driverId?: string;
  companyId?: string;
  partnerId?: string;
};

export async function requireSession(headers: Headers): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }
  const user = session.user as SessionUser;
  return { ok: true, user };
}

export async function requireDriver(
  headers: Headers,
): Promise<
  | { ok: true; user: SessionUser; driver: DriverDoc }
  | { ok: false; response: NextResponse }
> {
  const s = await requireSession(headers);
  if (!s.ok) return s;
  if (s.user.role !== "driver") {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  if (!s.user.driverId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "driver profile missing" },
        { status: 409 },
      ),
    };
  }
  const driver = (await db
    .collection(Collections.drivers)
    .findOne({ _id: new ObjectId(s.user.driverId) })) as DriverDoc | null;
  if (!driver) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "driver not found" },
        { status: 404 },
      ),
    };
  }
  return { ok: true, user: s.user, driver };
}

export async function requireAdmin(
  headers: Headers,
): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const s = await requireSession(headers);
  if (!s.ok) return s;
  if (s.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return s;
}
