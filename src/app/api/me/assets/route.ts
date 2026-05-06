import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  AssetServiceError,
  createAsset,
  listAssets,
} from "@/lib/asset-service";

const STATUS_BY_CODE: Record<string, number> = {
  invalid_type: 400,
  invalid_name: 400,
  invalid_file: 400,
  file_too_large: 413,
  resource_type_mismatch: 400,
  forbidden: 403,
  not_found: 404,
  in_use: 409,
};

export async function GET(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  try {
    const assets = await listAssets(auth.company._id.toString());
    return NextResponse.json({ assets });
  } catch (e) {
    console.error("[GET /api/me/assets]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  let body: {
    type?: string;
    name?: string;
    file?: {
      publicId?: string;
      url?: string;
      resourceType?: string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
      duration?: number;
    };
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const asset = await createAsset({
      companyId: auth.company._id.toString(),
      uploadedBy: auth.user.id,
      type: String(body.type ?? ""),
      name: String(body.name ?? ""),
      file: {
        publicId: String(body.file?.publicId ?? ""),
        url: String(body.file?.url ?? ""),
        resourceType: String(body.file?.resourceType ?? ""),
        format: body.file?.format,
        bytes: Number(body.file?.bytes ?? 0),
        width: body.file?.width,
        height: body.file?.height,
        duration: body.file?.duration,
      },
    });
    return NextResponse.json({ asset });
  } catch (e) {
    if (e instanceof AssetServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message, meta: e.meta },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[POST /api/me/assets]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
