import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import { listInvoices } from "@/lib/invoice-service";
import { serializeInvoice } from "@/lib/finance-serializer";
import type { InvoiceStatus } from "@/lib/schemas";

const VALID_STATUSES: InvoiceStatus[] = [
  "brouillon",
  "envoyee",
  "payee",
  "en_retard",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as InvoiceStatus)
      ? (statusParam as InvoiceStatus)
      : undefined;

  // Drafts are admin-only; advertisers never see them.
  const invoices = (
    await listInvoices({ status, companyId: auth.user.companyId })
  ).filter((i) => i.storedStatus !== "brouillon");

  return NextResponse.json({
    invoices: invoices.map((i) => serializeInvoice(i, auth.company.companyName)),
  });
}
