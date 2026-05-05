"use client";

import { useState } from "react";

const CITIES = ["Paris", "Lyon", "Caen", "Marseille", "Nice", "Bordeaux"];
const STATUSES: { value: "pending" | "validated" | "rejected"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "validated", label: "Validé" },
  { value: "rejected", label: "Rejeté" },
];

type Props = {
  driverId: string;
  initial: {
    firstName: string;
    lastName: string;
    phone?: string;
    city: string;
    status: string;
  };
  onClose: () => void;
  onSaved: () => void;
};

export function DriverEditModal({ driverId, initial, onClose, onSaved }: Props) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [city, setCity] = useState(initial.city);
  const [status, setStatus] = useState(initial.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() !== initial.firstName ? firstName.trim() : undefined,
          lastName: lastName.trim() !== initial.lastName ? lastName.trim() : undefined,
          phone: phone.trim() !== (initial.phone ?? "") ? phone.trim() : undefined,
          city: city !== initial.city ? city : undefined,
          status: status !== initial.status ? status : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Modifier le chauffeur</h3>

        {error && (
          <div
            style={{
              padding: 10,
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <Field label="Prénom">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Nom">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Téléphone">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Ville">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={inputStyle}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={inputStyle}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Envoi…" : "Enregistrer"}
          </button>
        </div>
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
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
