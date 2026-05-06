"use client";

/**
 * EnterpriseAssets — creative asset library for an advertiser.
 *
 * Live data wired to /api/me/assets. Upload uses the X2 signed direct
 * Cloudinary upload pattern (sign endpoint + auto resource_type).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type AssetType = "visual" | "video" | "logo" | "brief";
type FilterType = "all" | AssetType;

type AssetDTO = {
  id: string;
  type: AssetType;
  name: string;
  file: {
    publicId: string;
    url: string;
    resourceType: "image" | "video" | "raw";
    format?: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  usageCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

const TYPE_LABEL: Record<AssetType, string> = {
  visual: "Visuel",
  video: "Vidéo",
  logo: "Logo",
  brief: "Brief",
};

const TYPE_CHIP: Record<AssetType, string> = {
  visual: "info",
  video: "paid",
  logo: "draft",
  brief: "warn",
};

const TYPE_GRADIENT: Record<AssetType, string> = {
  visual: "linear-gradient(135deg,#EC407A,#F472B6)",
  video: "linear-gradient(135deg,#3B82F6,#6366F1)",
  logo: "linear-gradient(135deg,#233466,#3A4B8A)",
  brief: "linear-gradient(135deg,#14B8A6,#3B82F6)",
};

const TYPE_MAX_BYTES: Record<AssetType, number> = {
  visual: 10 * 1024 * 1024,
  logo: 5 * 1024 * 1024,
  brief: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const TYPE_ACCEPT: Record<AssetType, string> = {
  visual: "image/*",
  logo: "image/png,image/svg+xml,image/jpeg,image/webp",
  brief: ".pdf,.doc,.docx,.txt,.md,application/pdf",
  video: "video/*",
};

const ERROR_LABEL: Record<string, string> = {
  invalid_type: "Type invalide.",
  invalid_name: "Nom invalide.",
  invalid_file: "Fichier invalide.",
  file_too_large: "Fichier trop volumineux.",
  resource_type_mismatch: "Le type de fichier ne correspond pas à la catégorie choisie.",
  in_use: "Asset utilisé dans une ou plusieurs campagnes — retirez-le des campagnes avant suppression.",
  forbidden: "Action non autorisée.",
};

type SignedUploadParams = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

type UploadResult = {
  publicId: string;
  url: string;
  resourceType: "image" | "video" | "raw";
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
};

async function signedUpload(file: File): Promise<UploadResult> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "asset" }),
  });
  if (!signRes.ok) throw new Error(`sign failed (${signRes.status})`);
  const sig = (await signRes.json()) as SignedUploadParams;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  // resource_type=auto lets Cloudinary route image/video/raw correctly.
  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!upRes.ok) {
    throw new Error(`cloudinary upload failed (${upRes.status})`);
  }
  const body = (await upRes.json()) as {
    public_id: string;
    secure_url: string;
    bytes: number;
    resource_type: "image" | "video" | "raw";
    format?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
  return {
    publicId: body.public_id,
    url: body.secure_url,
    resourceType: body.resource_type,
    format: body.format,
    bytes: body.bytes,
    width: body.width,
    height: body.height,
    duration: body.duration,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function thumbForVideo(publicId: string, cloudName: string): string {
  // Cloudinary auto-thumbnail at 1s mark.
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_1,w_400,h_400,c_fill/${publicId}.jpg`;
}

export function EnterpriseAssets() {
  const [assets, setAssets] = useState<AssetDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<AssetType>("visual");
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/me/assets", { cache: "no-store" });
      const body = (await res.json()) as { assets?: AssetDTO[]; error?: string; message?: string };
      if (!res.ok) {
        setError(body.message ?? body.error ?? "Erreur de chargement");
        return;
      }
      setAssets(body.assets ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a) => {
      const matchType = type === "all" || a.type === type;
      const q = query.trim().toLowerCase();
      return matchType && (!q || a.name.toLowerCase().includes(q));
    });
  }, [assets, type, query]);

  const counts = useMemo(() => {
    const list = assets ?? [];
    return {
      all: list.length,
      visual: list.filter((a) => a.type === "visual").length,
      video: list.filter((a) => a.type === "video").length,
      logo: list.filter((a) => a.type === "logo").length,
      brief: list.filter((a) => a.type === "brief").length,
    };
  }, [assets]);

  const cloudName = useMemo(() => {
    // Pull from a sample file URL so we can build video thumbs without env access.
    const sample = (assets ?? []).find((a) => a.file.url.includes("/res.cloudinary.com/"));
    if (!sample) return "";
    const m = sample.file.url.match(/res\.cloudinary\.com\/([^/]+)\//);
    return m?.[1] ?? "";
  }, [assets]);

  function openUpload(initialType: AssetType = "visual") {
    setUploadType(initialType);
    setUploadName("");
    setUploadFile(null);
    setUploadError(null);
    setUploadOpen(true);
  }

  function chooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setUploadFile(f);
    if (f && !uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submitUpload() {
    if (!uploadFile) {
      setUploadError("Sélectionnez un fichier.");
      return;
    }
    if (!uploadName.trim()) {
      setUploadError("Saisissez un nom.");
      return;
    }
    if (uploadFile.size > TYPE_MAX_BYTES[uploadType]) {
      setUploadError(
        `Fichier trop volumineux (${formatBytes(uploadFile.size)}). Max ${formatBytes(TYPE_MAX_BYTES[uploadType])}.`,
      );
      return;
    }
    setUploadBusy(true);
    setUploadError(null);
    try {
      const uploaded = await signedUpload(uploadFile);
      const res = await fetch("/api/me/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: uploadType,
          name: uploadName.trim(),
          file: uploaded,
        }),
      });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setUploadError(ERROR_LABEL[body.error ?? ""] ?? body.message ?? "Erreur lors de l'enregistrement");
        return;
      }
      setUploadOpen(false);
      setUploadFile(null);
      setUploadName("");
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function deleteAsset(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/me/assets/${id}`, { method: "DELETE" });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        alert(ERROR_LABEL[body.error ?? ""] ?? body.message ?? "Erreur");
        return;
      }
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !assets) {
    return (
      <div className="glass-page">
        <div className="glass-pagehead">
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
              Bibliothèque d&apos;assets
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
              Chargement…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Bibliothèque d&apos;assets
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {counts.all} fichier{counts.all > 1 ? "s" : ""} · visuels, vidéos, logos et briefs
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn" onClick={() => openUpload()}>
            <Icon name="upload-cloud" size={14} /> Téléverser
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(239,68,68,0.08)",
            color: "#b91c1c",
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="glass-panel"
        style={{
          display: "flex",
          gap: 14,
          padding: 16,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div className="ent-seg">
          {(["all", "visual", "video", "logo", "brief"] as FilterType[]).map((t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t === "all" ? "Tous" : TYPE_LABEL[t]}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({counts[t]})</span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(35,52,102,0.1)",
            borderRadius: 999,
            minWidth: 260,
          }}
        >
          <Icon name="search" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un asset…"
            style={{
              flex: 1,
              border: 0,
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#0A0E1F",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div className="ent-asset-grid">
        <button
          type="button"
          className="ent-upload-tile"
          onClick={() => openUpload()}
        >
          <Icon name="upload-cloud" size={24} />
          <span>Téléverser un asset</span>
          <span style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 400 }}>
            PNG, JPG, MP4, PDF · jusqu&apos;à 100 Mo
          </span>
        </button>

        {filtered.map((a) => (
          <div key={a.id} className="ent-asset-card">
            <div className="ent-asset-preview" style={previewStyle(a, cloudName)}>
              <span className={`ent-chip ${TYPE_CHIP[a.type]}`}>{TYPE_LABEL[a.type]}</span>
              {!hasInlinePreview(a) && <span>{initials(a.name)}</span>}
            </div>
            <div className="ent-asset-body">
              <div className="ent-asset-name" title={a.name}>
                {a.name}
              </div>
              <div className="ent-asset-meta">
                <span>
                  {formatBytes(a.file.bytes)} · {formatDate(a.updatedAt)}
                </span>
                <span>
                  · {a.usageCount} campagne{a.usageCount === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a
                  href={a.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn ghost"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  <Icon name="eye" size={12} /> Ouvrir
                </a>
                <button
                  type="button"
                  className="glass-btn ghost"
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    color: "#B91C1C",
                  }}
                  disabled={busyId === a.id}
                  onClick={() => deleteAsset(a.id, a.name)}
                >
                  <Icon name="trash" size={12} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 40,
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
            {query || type !== "all"
              ? "Aucun asset ne correspond."
              : "Aucun asset. Téléversez votre premier fichier."}
          </div>
        )}
      </div>

      {uploadOpen && (
        <div style={modalBackdropStyle} onClick={() => !uploadBusy && setUploadOpen(false)}>
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Nouveau asset</h3>

            <label style={fieldLabel}>Type</label>
            <select
              className="glass-input"
              value={uploadType}
              onChange={(e) => {
                setUploadType(e.target.value as AssetType);
                setUploadFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              disabled={uploadBusy}
              style={{ marginBottom: 12 }}
            >
              <option value="visual">Visuel</option>
              <option value="video">Vidéo</option>
              <option value="logo">Logo</option>
              <option value="brief">Brief</option>
            </select>

            <label style={fieldLabel}>Nom</label>
            <input
              className="glass-input"
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Ex. Flocage Nova — Printemps"
              maxLength={120}
              disabled={uploadBusy}
              style={{ marginBottom: 12 }}
            />

            <label style={fieldLabel}>
              Fichier ·{" "}
              <span style={{ color: "var(--gray-500)", textTransform: "none", letterSpacing: "normal" }}>
                max {formatBytes(TYPE_MAX_BYTES[uploadType])}
              </span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={TYPE_ACCEPT[uploadType]}
              onChange={chooseFile}
              disabled={uploadBusy}
              style={{ marginBottom: 12, fontSize: 13 }}
            />

            {uploadError && (
              <div
                style={{
                  padding: 10,
                  background: "rgba(239,68,68,0.08)",
                  color: "#b91c1c",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {uploadError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="glass-btn ghost"
                onClick={() => setUploadOpen(false)}
                disabled={uploadBusy}
              >
                Annuler
              </button>
              <button
                type="button"
                className="glass-btn"
                onClick={submitUpload}
                disabled={uploadBusy}
              >
                {uploadBusy ? "Téléversement…" : "Téléverser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hasInlinePreview(a: AssetDTO): boolean {
  return a.file.resourceType === "image" || a.file.resourceType === "video";
}

function previewStyle(a: AssetDTO, cloudName: string): React.CSSProperties {
  if (a.file.resourceType === "image") {
    return {
      backgroundImage: `url(${a.file.url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (a.file.resourceType === "video" && cloudName) {
    return {
      backgroundImage: `url(${thumbForVideo(a.file.publicId, cloudName)})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: TYPE_GRADIENT[a.type] };
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--gray-500)",
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 20px 60px rgba(15,23,42,0.25)",
};
