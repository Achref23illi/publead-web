import { v2 as cloudinary } from "cloudinary";
import { createHash } from "crypto";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error(
      "Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET",
    );
  }
  cloudinary.config({
    cloud_name: cloud,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
  configured = true;
}

export type SignedUploadParams = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
  // Hints for the client; not part of the signature when omitted there.
};

/**
 * Generates a Cloudinary upload signature for direct (client-side) uploads.
 *
 * The signature MUST cover exactly the params the client sends back to
 * Cloudinary. We pin: folder, timestamp, and (optionally) public_id.
 * Resource type is determined client-side based on file kind and not signed.
 */
export function signUpload(args: {
  folder: string;
  publicId?: string;
}): SignedUploadParams {
  ensureConfigured();
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const key = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder: args.folder,
    timestamp,
  };
  if (args.publicId) paramsToSign.public_id = args.publicId;

  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign = sortedKeys
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");
  const signature = createHash("sha1")
    .update(stringToSign + secret)
    .digest("hex");

  return {
    cloudName: cloud,
    apiKey: key,
    timestamp,
    signature,
    folder: args.folder,
    publicId: args.publicId,
  };
}

/**
 * Deletes assets by publicId. Required when a driver re-uploads a doc type:
 * we replace the old file references and remove the underlying assets.
 *
 * resourceType must match what was uploaded ('image' | 'raw' | 'video').
 */
export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image",
): Promise<void> {
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (e) {
    // Best-effort: log but don't crash the calling flow.
    console.warn(`[cloudinary] destroy failed for ${publicId}`, e);
  }
}

export async function deleteAssets(
  files: { publicId: string; resourceType: "image" | "raw" | "video" }[],
): Promise<void> {
  await Promise.all(
    files.map((f) => deleteAsset(f.publicId, f.resourceType)),
  );
}
