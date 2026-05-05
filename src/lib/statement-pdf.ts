import PDFDocument from "pdfkit";
import type { TransactionDoc, DriverDoc } from "./schemas";

const eur = (cents: number) =>
  `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export type StatementInput = {
  driver: DriverDoc;
  monthStart: Date;
  monthEnd: Date;
  monthLabel: string; // "avril 2026"
  transactions: TransactionDoc[];
};

export async function buildStatementPDF(input: StatementInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let income = 0;
    let withdrawn = 0;
    for (const t of input.transactions) {
      if (t.amountCents > 0) income += t.amountCents;
      else withdrawn += -t.amountCents;
    }
    const net = income - withdrawn;

    // Header
    doc
      .fontSize(20)
      .fillColor("#0F1B3F")
      .text("Publeader", { continued: true })
      .fillColor("#666")
      .fontSize(10)
      .text("  ·  Relevé de compte", { align: "left" });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor("#000")
      .text(
        `${input.driver.firstName} ${input.driver.lastName} — ${input.driver.city}`,
      );
    doc
      .fontSize(9)
      .fillColor("#666")
      .text(`Période · ${input.monthLabel}`);
    doc
      .fontSize(9)
      .fillColor("#666")
      .text(`Généré le ${fmtDate(new Date())}`);

    doc.moveDown(1.5);

    // Summary block
    doc.fontSize(11).fillColor("#0F1B3F").text("Résumé", { underline: false });
    doc.moveDown(0.3);
    const summaryY = doc.y;
    const colW = 165;
    const drawSummaryCell = (
      x: number,
      label: string,
      value: string,
      valueColor: string,
    ) => {
      doc
        .roundedRect(x, summaryY, colW, 60, 6)
        .fillColor("#F2F4FB")
        .fill();
      doc
        .fillColor("#666")
        .fontSize(9)
        .text(label, x + 12, summaryY + 12);
      doc
        .fillColor(valueColor)
        .fontSize(16)
        .text(value, x + 12, summaryY + 28);
    };
    drawSummaryCell(50, "Revenus", eur(income), "#16A34A");
    drawSummaryCell(50 + colW + 10, "Retraits", `-${eur(withdrawn)}`, "#DC2626");
    drawSummaryCell(50 + (colW + 10) * 2, "Solde net", eur(net), "#0F1B3F");

    doc.y = summaryY + 80;
    doc.moveDown(1);

    // Table
    doc.fontSize(11).fillColor("#0F1B3F").text("Transactions");
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const cols = [
      { label: "Date", x: 50, w: 70 },
      { label: "Type", x: 120, w: 90 },
      { label: "Description", x: 210, w: 240 },
      { label: "Montant", x: 450, w: 100, align: "right" as const },
    ];

    doc.fontSize(9).fillColor("#666");
    for (const c of cols) {
      doc.text(c.label, c.x, tableTop, { width: c.w, align: c.align ?? "left" });
    }
    doc
      .moveTo(50, tableTop + 14)
      .lineTo(545, tableTop + 14)
      .strokeColor("#E5E7EB")
      .stroke();

    let y = tableTop + 22;
    doc.fontSize(10).fillColor("#000");

    if (input.transactions.length === 0) {
      doc
        .fillColor("#999")
        .fontSize(10)
        .text("Aucune transaction sur cette période.", 50, y);
    } else {
      for (const t of input.transactions) {
        if (y > 740) {
          doc.addPage();
          y = 60;
        }
        const isCredit = t.amountCents > 0;
        const typeLabel =
          t.type === "campaign_completion"
            ? "Campagne"
            : t.type === "withdrawal_debit"
              ? "Retrait"
              : t.type === "withdrawal_refund"
                ? "Remboursement"
                : "Ajustement";
        doc.fillColor("#000").fontSize(10);
        doc.text(fmtDate(t.createdAt), cols[0].x, y, { width: cols[0].w });
        doc.text(typeLabel, cols[1].x, y, { width: cols[1].w });
        doc.text(t.description, cols[2].x, y, { width: cols[2].w });
        doc
          .fillColor(isCredit ? "#16A34A" : "#DC2626")
          .text(
            (isCredit ? "+" : "") + eur(t.amountCents),
            cols[3].x,
            y,
            { width: cols[3].w, align: "right" },
          );
        y += 18;
      }
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("#999")
      .text(
        "Publeader · Relevé indicatif. Pour toute question : contact@publeader.com",
        50,
        780,
        { width: 495, align: "center" },
      );

    doc.end();
  });
}
