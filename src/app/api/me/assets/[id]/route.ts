import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  AssetServiceError,
  deleteAssetById,
  getAsset,
  updateAsset,
} from "@/lib/asset-service";

const STATUS_BY_CODE: Record<string, number> = {
  invalid_type: 400,
  invalid_name: 400,
  resource_type_mismatch: 400,
  forbidden: 403,
  not_found: 404,
  in_use: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  const { id } = await ctx.params;
  try {
    const asset = await getAsset(auth.company._id.toString(), id);
    return NextResponse.json({ asset });
  } catch (e) {
    if (e instanceof AssetServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[GET /api/me/assets/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  const { id } = await ctx.params;
  let body: { name?: string; type?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const asset = await updateAsset(auth.company._id.toString(), id, {
      name: body.name,
      type: body.type,
    });
    return NextResponse.json({ asset });
  } catch (e) {
    if (e instanceof AssetServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[PATCH /api/me/assets/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  const { id } = await ctx.params;
  try {
    await deleteAssetById(auth.company._id.toString(), id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AssetServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message, meta: e.meta },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[DELETE /api/me/assets/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
