import { db } from "../../db";
import { RETENTION_POLICY, type RetentionEntry } from "../../retention-policy";
import {
  createReportDoc,
  drawHeader,
  drawSectionTitle,
  drawTable,
  fmtDate,
  fmtNumber,
} from "../pdf-utils";
import {
  formatPeriodSlug,
  type ReportBuilder,
  type ReportPeriod,
} from "../types";

async function countAll(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  await Promise.all(
    RETENTION_POLICY.map(async (e) => {
      // user collection name uses better-auth's literal "user"; entry stores
      // the longer label "user (better-auth)". Fall back to "user".
      const name = e.collection.startsWith("user") ? "user" : e.collection;
      try {
        const n = await db.collection(name).countDocuments({});
        out.set(e.collection, n);
      } catch {
        out.set(e.collection, 0);
      }
    }),
  );
  return out;
}

async function buildGdprAudit(period: ReportPeriod): Promise<Buffer> {
  const counts = await countAll();
  const { doc, finish } = createReportDoc();
  drawHeader(doc, "Audit RGPD — Inventaire & rétention", period);

  doc
    .fontSize(10)
    .fillColor("#444")
    .text(
      `Snapshot généré le ${fmtDate(new Date())}. Sources : RETENTION_POLICY (lib/retention-policy.ts) + counts MongoDB. Document destiné au registre des traitements.`,
      50,
      doc.y,
      { width: 495 },
    );
  doc.moveDown(1);

  const groups: Record<RetentionEntry["category"], string> = {
    user: "Données personnelles",
    operational: "Données opérationnelles",
    financial: "Données financières",
    telemetry: "Télémétrie / agrégats",
  };

  (Object.keys(groups) as RetentionEntry["category"][]).forEach((cat) => {
    const rows = RETENTION_POLICY.filter((e) => e.category === cat);
    if (rows.length === 0) return;
    drawSectionTitle(doc, groups[cat]);
    drawTable(
      doc,
      [
        { header: "Collection", width: 110, render: (r: RetentionEntry) => r.collection },
        {
          header: "Champs PII",
          width: 165,
          render: (r: RetentionEntry) => r.piiFields,
        },
        {
          header: "Base légale",
          width: 90,
          render: (r: RetentionEntry) => r.legalBasis,
        },
        {
          header: "Rétention",
          width: 90,
          render: (r: RetentionEntry) => r.retentionLabel,
        },
        {
          header: "Lignes",
          width: 40,
          render: (r: RetentionEntry) => fmtNumber(counts.get(r.collection) ?? 0),
          align: "right",
        },
      ],
      rows,
    );
    doc.moveDown(0.5);
  });

  return finish();
}

export const gdprAuditBuilder: ReportBuilder = {
  type: "gdpr_audit",
  async build(period) {
    const buffer = await buildGdprAudit(period);
    return {
      buffer,
      filename: `audit-rgpd-${formatPeriodSlug(period)}.pdf`,
      contentType: "application/pdf",
      format: "pdf",
    };
  },
};
