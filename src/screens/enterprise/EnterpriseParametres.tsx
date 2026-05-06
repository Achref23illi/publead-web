"use client";

/**
 * EnterpriseParametres — advertiser account settings, wired to /api/me/company.
 * Tabs: Profil · Identité de marque · Légal · Notifications.
 */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type Tab = "profile" | "brand" | "legal";

const TABS: { id: Tab; label: string; icon: "user" | "image" | "file-text" }[] =
  [
    { id: "profile", label: "Profil entreprise", icon: "user" },
    { id: "brand", label: "Identité de marque", icon: "image" },
    { id: "legal", label: "Informations légales", icon: "file-text" },
  ];

const LEGAL_FORMS = [
  "SARL",
  "SAS",
  "SA",
  "EURL",
  "Auto-entrepreneur",
  "Autre",
] as const;
const SECTORS = [
  "Mode & Sport",
  "Alimentation & Boissons",
  "Automobile",
  "Technologie",
  "Divertissement",
  "Restauration",
  "Autre",
];

type CompanyDTO = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  domain: string;
  sector: string;
  city: string;
  website?: string;
  description?: string;
  founded?: string;
  headquarters?: string;
  employees?: string;
  brandColor?: string;
  logo?: { publicId: string; url: string; bytes: number };
  logoUrl?: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
  legalForm?: (typeof LEGAL_FORMS)[number];
  status: "pending" | "validated" | "rejected";
};

type SignedUploadParams = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

async function uploadCompanyLogo(file: File): Promise<{
  publicId: string;
  url: string;
  bytes: number;
}> {
  // 1. Sign
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "company_logo" }),
  });
  if (!signRes.ok) throw new Error(`sign failed (${signRes.status})`);
  const sig = (await signRes.json()) as SignedUploadParams;

  // 2. Upload to Cloudinary
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!upRes.ok) {
    throw new Error(`cloudinary upload failed (${upRes.status})`);
  }
  const body = (await upRes.json()) as {
    public_id: string;
    secure_url: string;
    bytes: number;
  };
  return {
    publicId: body.public_id,
    url: body.secure_url,
    bytes: body.bytes,
  };
}

export function EnterpriseParametres() {
  const [tab, setTab] = useState<Tab>("profile");
  const [company, setCompany] = useState<CompanyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CompanyDTO>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/company", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { company: CompanyDTO };
      setCompany(body.company);
      setDraft({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = <K extends keyof CompanyDTO>(key: K, value: CompanyDTO[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const value = <K extends keyof CompanyDTO>(key: K): CompanyDTO[K] | undefined =>
    (draft[key] as CompanyDTO[K] | undefined) ?? company?.[key];

  const isDirty = Object.keys(draft).length > 0;

  const save = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/company", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { company: CompanyDTO };
      setCompany(body.company);
      setDraft({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo too large (max 5MB)");
      return;
    }
    setLogoUploading(true);
    setError(null);
    try {
      const uploaded = await uploadCompanyLogo(file);
      const res = await fetch("/api/me/company/logo", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploaded),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    setLogoUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/company/logo", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading && !company) {
    return (
      <div className="glass-page">
        <div className="glass-pagehead">
          <h1 style={{ fontSize: 28 }}>Paramètres</h1>
        </div>
        <p style={{ color: "var(--gray-500)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Paramètres
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {company?.companyName ?? "Votre compte"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="glass-btn ghost"
            onClick={() => setDraft({})}
            disabled={!isDirty || saving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="glass-btn"
            onClick={save}
            disabled={!isDirty || saving}
          >
            <Icon name="check" size={14} /> {saving ? "Envoi…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="glass-split">
        <aside className="glass-sidenav">
          <div className="glass-sidenav-head">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-500)" }}>
              Sections
            </div>
          </div>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`glass-sidenav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </aside>

        <main style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {tab === "profile" && (
            <Section title="Profil entreprise">
              <Row>
                <Field label="Nom de l'entreprise">
                  <input
                    type="text"
                    style={inputStyle}
                    value={value("companyName") ?? ""}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />
                </Field>
                <Field label="Contact principal">
                  <input
                    type="text"
                    style={inputStyle}
                    value={value("contactName") ?? ""}
                    onChange={(e) => setField("contactName", e.target.value)}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Téléphone">
                  <input
                    type="tel"
                    style={inputStyle}
                    value={value("phone") ?? ""}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </Field>
                <Field label="Site web">
                  <input
                    type="url"
                    style={inputStyle}
                    placeholder="https://example.com"
                    value={value("website") ?? ""}
                    onChange={(e) => setField("website", e.target.value)}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Secteur d'activité">
                  <select
                    style={inputStyle}
                    value={value("sector") ?? ""}
                    onChange={(e) => setField("sector", e.target.value)}
                  >
                    <option value="">— choisir —</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ville">
                  <input
                    type="text"
                    style={inputStyle}
                    value={value("city") ?? ""}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Année de création">
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="ex: 2018"
                    value={value("founded") ?? ""}
                    onChange={(e) => setField("founded", e.target.value)}
                  />
                </Field>
                <Field label="Effectif">
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="ex: 50-100"
                    value={value("employees") ?? ""}
                    onChange={(e) => setField("employees", e.target.value)}
                  />
                </Field>
              </Row>
              <Field label="Siège social">
                <input
                  type="text"
                  style={inputStyle}
                  value={value("headquarters") ?? ""}
                  onChange={(e) => setField("headquarters", e.target.value)}
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  value={value("description") ?? ""}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </Field>
            </Section>
          )}

          {tab === "brand" && (
            <Section title="Identité de marque">
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 16,
                    background: company?.brandColor
                      ? `${company.brandColor}1A`
                      : "var(--gray-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--gray-200)",
                    overflow: "hidden",
                  }}
                >
                  {company?.logo?.url || company?.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={company.logo?.url ?? company.logoUrl!}
                      alt="logo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Icon name="image" size={32} />
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>Logo</strong>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--gray-500)",
                        margin: "4px 0 8px",
                      }}
                    >
                      PNG, JPG ou WebP. Maximum 5 Mo.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoFile(f);
                          if (fileInput.current) fileInput.current.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className="glass-btn"
                        onClick={() => fileInput.current?.click()}
                        disabled={logoUploading}
                      >
                        <Icon name="upload-cloud" size={14} />{" "}
                        {logoUploading ? "Envoi…" : "Téléverser"}
                      </button>
                      {(company?.logo?.url || company?.logoUrl) && (
                        <button
                          type="button"
                          className="glass-btn ghost"
                          onClick={removeLogo}
                          disabled={logoUploading}
                        >
                          <Icon name="trash" size={14} /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: "var(--gray-200)", margin: "16px 0" }} />

              <Field label="Couleur de marque">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    type="color"
                    value={value("brandColor") ?? "#000000"}
                    onChange={(e) => setField("brandColor", e.target.value)}
                    style={{
                      width: 56,
                      height: 40,
                      border: "1px solid var(--gray-200)",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: "monospace", maxWidth: 160 }}
                    placeholder="#FF5733"
                    value={value("brandColor") ?? ""}
                    onChange={(e) => setField("brandColor", e.target.value)}
                  />
                  <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    Apparaît derrière votre logo et sur vos campagnes.
                  </span>
                </div>
              </Field>
            </Section>
          )}

          {tab === "legal" && (
            <Section title="Informations légales">
              <p style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 12 }}>
                Ces informations apparaîtront sur les factures et contrats.
              </p>
              <Row>
                <Field label="Raison sociale">
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Nova Cosmétique SAS"
                    value={value("legalName") ?? ""}
                    onChange={(e) => setField("legalName", e.target.value)}
                  />
                </Field>
                <Field label="Forme juridique">
                  <select
                    style={inputStyle}
                    value={value("legalForm") ?? ""}
                    onChange={(e) =>
                      setField(
                        "legalForm",
                        e.target.value as CompanyDTO["legalForm"],
                      )
                    }
                  >
                    <option value="">— choisir —</option>
                    {LEGAL_FORMS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="SIRET">
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                    placeholder="14 chiffres"
                    value={value("siret") ?? ""}
                    onChange={(e) => setField("siret", e.target.value)}
                  />
                </Field>
                <Field label="Numéro TVA">
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                    placeholder="FR12345678901"
                    value={value("vatNumber") ?? ""}
                    onChange={(e) => setField("vatNumber", e.target.value)}
                  />
                </Field>
              </Row>
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid var(--gray-200)",
  borderRadius: 6,
  fontSize: 14,
  background: "white",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 16, marginBottom: 16, fontWeight: 700 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: "var(--gray-600)",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
