import PDFDocument from "pdfkit";
import type {
  PartnerDoc,
  RevenueMonthlyDoc,
  RevenueMonthlyTerminalLine,
} from "./schemas";

const eur = (cents: number) =>
  `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function monthLabel(month: string): string {
  // "2026-04" -> "avril 2026"
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return `${FR_MONTHS[m - 1]} ${y}`;
}

export type PartnerStatementInput = {
  partner: PartnerDoc;
  monthly: RevenueMonthlyDoc;
};

export async function buildPartnerStatementPDF(
  input: PartnerStatementInput,
): Promise<Buffer> {
  const { partner, monthly } = input;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(20)
      .fillColor("#0F1B3F")
      .text("Publeader", { continued: true })
      .fillColor("#666")
      .fontSize(10)
      .text("  ·  Relevé partenaire", { align: "left" });

    doc.moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor("#000")
      .text(`Relevé ${monthLabel(monthly.month)}`);
    doc
      .fontSize(11)
      .fillColor("#666")
      .text(partner.businessName);
    doc.fontSize(9).fillColor("#888").text(partner.address);

    doc.moveDown(1);

    // Summary box
    const summaryY = doc.y;
    doc
      .roundedRect(50, summaryY, 495, 80, 8)
      .fillAndStroke("#F4F6FA", "#E0E5EE");
    doc.fillColor("#0F1B3F");

    doc.fontSize(10).text("Sprays", 70, summaryY + 14);
    doc
      .fontSize(14)
      .text(
        `${monthly.totalSprays.toLocaleString("fr-FR")} (${eur(monthly.sprayCents)})`,
        70,
        summaryY + 30,
      );

    doc.fontSize(10).text("Vues écran", 250, summaryY + 14);
    doc
      .fontSize(14)
      .text(
        `${monthly.totalImpressions.toLocaleString("fr-FR")} (${eur(monthly.adCents)})`,
        250,
        summaryY + 30,
      );

    doc.fontSize(10).text("Total", 430, summaryY + 14);
    doc.fontSize(16).text(eur(monthly.totalCents), 430, summaryY + 30);

    doc.moveDown(6);

    // Per-terminal table
    doc.fontSize(12).fillColor("#000").text("Détail par borne");
    doc.moveDown(0.5);

    const cols = [
      { x: 50, w: 200, label: "Borne" },
      { x: 250, w: 80, label: "Sprays" },
      { x: 330, w: 80, label: "Vues" },
      { x: 410, w: 130, label: "Total", align: "right" as const },
    ];

    // Header row
    doc.fontSize(9).fillColor("#666");
    for (const c of cols) {
      doc.text(c.label, c.x, doc.y, { width: c.w, align: c.align ?? "left" });
    }
    const headerY = doc.y;
    doc
      .moveTo(50, headerY + 12)
      .lineTo(545, headerY + 12)
      .strokeColor("#E0E5EE")
      .stroke();
    doc.moveDown(0.6);

    doc.fontSize(10).fillColor("#000");
    for (const line of monthly.perTerminal) {
      const y = doc.y;
      doc.text(
        `${line.terminalName ?? line.terminalId}\n${line.terminalCode ?? ""}`,
        cols[0].x,
        y,
        { width: cols[0].w },
      );
      doc.text(
        line.spraysCount.toLocaleString("fr-FR"),
        cols[1].x,
        y,
        { width: cols[1].w },
      );
      doc.text(
        line.impressions.toLocaleString("fr-FR"),
        cols[2].x,
        y,
        { width: cols[2].w },
      );
      doc.text(eur(line.totalCents), cols[3].x, y, {
        width: cols[3].w,
        align: "right",
      });
      doc.moveDown(0.8);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#999")
      .text(
        `Tarifs appliqués : ${eur(monthly.sprayRateCents)} par spray · ${eur(monthly.cpmCents)} par 1000 vues. Document généré automatiquement.`,
        50,
        doc.y,
        { width: 495 },
      );

    doc.end();
  });
}

/**
 * CSV statement: one row per terminal plus a totals row. Useful for spreadsheet
 * import. UTF-8 with BOM so Excel renders accents correctly.
 */
export function buildPartnerStatementCSV(
  input: PartnerStatementInput,
): string {
  const { monthly } = input;
  const rows: string[][] = [];
  rows.push([
    "terminal_code",
    "terminal_name",
    "sprays",
    "spray_cents",
    "impressions",
    "ad_cents",
    "total_cents",
  ]);
  for (const line of monthly.perTerminal) {
    rows.push([
      line.terminalCode ?? "",
      line.terminalName ?? line.terminalId,
      String(line.spraysCount),
      String(line.sprayCents),
      String(line.impressions),
      String(line.adCents),
      String(line.totalCents),
    ]);
  }
  rows.push([
    "TOTAL",
    "",
    String(monthly.totalSprays),
    String(monthly.sprayCents),
    String(monthly.totalImpressions),
    String(monthly.adCents),
    String(monthly.totalCents),
  ]);
  const body = rows
    .map((r) => r.map(csvEscape).join(","))
    .join("\r\n");
  return `﻿${body}\r\n`;
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// Optional re-export for callers that want to compute lines themselves.
export type { RevenueMonthlyTerminalLine };
