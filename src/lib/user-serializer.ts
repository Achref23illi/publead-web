// Shape returned by Better-auth admin.listUsers, with our additional fields
// (role, status, driverId, companyId, partnerId, phone) projected on top.
// We don't import the SDK type directly to keep the API DTO stable.
export type AdminUserDTO = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: string | null;
  status: string | null;
  phone?: string | null;
  driverId?: string | null;
  companyId?: string | null;
  partnerId?: string | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | null; // ISO
  createdAt: string;
  updatedAt: string;
};

type RawUser = {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean | null;
  role?: string | null;
  status?: string | null;
  phone?: string | null;
  driverId?: string | null;
  companyId?: string | null;
  partnerId?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function iso(v: Date | string): string {
  return typeof v === "string" ? v : v.toISOString();
}

export function serializeAdminUser(u: RawUser): AdminUserDTO {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: !!u.emailVerified,
    role: u.role ?? null,
    status: u.status ?? null,
    phone: u.phone ?? null,
    driverId: u.driverId ?? null,
    companyId: u.companyId ?? null,
    partnerId: u.partnerId ?? null,
    banned: !!u.banned,
    banReason: u.banReason ?? null,
    banExpires: u.banExpires
      ? typeof u.banExpires === "string"
        ? u.banExpires
        : u.banExpires.toISOString()
      : null,
    createdAt: iso(u.createdAt),
    updatedAt: iso(u.updatedAt),
  };
}
