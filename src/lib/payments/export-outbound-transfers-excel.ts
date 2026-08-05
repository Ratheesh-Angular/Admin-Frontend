import ExcelJS from "exceljs";
import type { OutboundTransferListRow } from "./outbound-transfer-types";
import {
  beneficiaryName,
  fmtDateTime,
  labelEnum,
  payoutBankOrProvider,
  payoutDestination,
} from "./transfer-format";

export type OutboundExportFilters = {
  fromDate?: string;
  toDate?: string;
  status?: string;
  statusLabel?: string;
  search?: string;
  corporateCustomerName?: string;
};

type ExportParams = {
  rows: OutboundTransferListRow[];
  role: "INDIVIDUAL" | "CORPORATE";
  filters: OutboundExportFilters;
};

const COLUMNS = [
  { header: "Transaction ID", key: "referenceCode", width: 18 },
  { header: "Internal ID", key: "internalId", width: 38 },
  { header: "Status", key: "status", width: 18 },
  { header: "Created", key: "created", width: 20 },
  { header: "Completed", key: "completed", width: 20 },
  { header: "Customer", key: "customer", width: 24 },
  { header: "Customer email", key: "customerEmail", width: 28 },
  { header: "Sender country", key: "senderCountry", width: 14 },
  { header: "Recipient country", key: "recipientCountry", width: 18 },
  { header: "Beneficiary", key: "beneficiary", width: 22 },
  { header: "Delivery channel", key: "deliveryChannel", width: 16 },
  { header: "Payout destination", key: "payoutDestination", width: 22 },
  { header: "Bank / provider", key: "bankOrProvider", width: 20 },
  { header: "Pay amount", key: "payAmount", width: 14 },
  { header: "Pay currency", key: "payCurrency", width: 12 },
  { header: "Receive amount", key: "receiveAmount", width: 14 },
  { header: "Receive currency", key: "receiveCurrency", width: 14 },
  { header: "Fee", key: "fee", width: 12 },
  { header: "Fee currency", key: "feeCurrency", width: 12 },
  { header: "FX rate", key: "fxRate", width: 12 },
  { header: "Pay-in method", key: "payInMethod", width: 16 },
  { header: "Pay-in pipeline", key: "payInPipeline", width: 16 },
  { header: "STK status", key: "stkStatus", width: 14 },
  { header: "Failure reason", key: "failureReason", width: 28 },
] as const;

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A5F" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: { argb: "FF1E3A5F" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

function buildFilterSummary(filters: OutboundExportFilters): string {
  const parts: string[] = [];
  if (filters.fromDate || filters.toDate) {
    parts.push(
      `Date range: ${filters.fromDate || "…"} to ${filters.toDate || "…"}`,
    );
  }
  if (filters.status && filters.status !== "ALL") {
    parts.push(`Status: ${filters.statusLabel || filters.status}`);
  }
  if (filters.search?.trim()) {
    parts.push(`Search: "${filters.search.trim()}"`);
  }
  if (filters.corporateCustomerName) {
    parts.push(`Corporate: ${filters.corporateCustomerName}`);
  }
  return parts.length > 0 ? parts.join("  |  ") : "No filters applied";
}

function buildFilename(
  role: "INDIVIDUAL" | "CORPORATE",
  filters: OutboundExportFilters,
): string {
  const segment = role === "INDIVIDUAL" ? "individuals" : "corporates";
  const today = new Date().toISOString().slice(0, 10);
  let name = `outbound-${segment}-transactions-${today}`;
  if (filters.fromDate || filters.toDate) {
    name += `_${filters.fromDate || "start"}-to-${filters.toDate || "end"}`;
  }
  return `${name}.xlsx`;
}

function rowToRecord(row: OutboundTransferListRow): Record<string, string | number> {
  return {
    referenceCode: row.referenceCode,
    internalId: row.id,
    status: labelEnum(row.status),
    created: fmtDateTime(row.createdAt),
    completed: row.completedAt ? fmtDateTime(row.completedAt) : "—",
    customer: row.user.name || row.user.email || "—",
    customerEmail: row.user.email || "—",
    senderCountry: row.senderCountryIso2 || "—",
    recipientCountry:
      row.recipientCountryLabel || row.recipientCountryIso2 || "—",
    beneficiary: beneficiaryName(row.beneficiary),
    deliveryChannel: labelEnum(row.beneficiary?.deliveryChannel ?? null),
    payoutDestination: payoutDestination(row.beneficiary),
    bankOrProvider: payoutBankOrProvider(row.beneficiary),
    payAmount: row.payAmount ?? "",
    payCurrency: row.payCurrency || "—",
    receiveAmount: row.receiveAmount ?? "",
    receiveCurrency: row.receiveCurrency || "—",
    fee: row.feeAmount ?? "",
    feeCurrency: row.payCurrency || "—",
    fxRate: row.fxRateSnapshot ?? "",
    payInMethod: labelEnum(row.payInMethod),
    payInPipeline: row.flexPayoutStatus || "—",
    stkStatus: row.flexStkStatus || "—",
    failureReason: row.failureReason || "—",
  };
}

export async function exportOutboundTransfersExcel({
  rows,
  role,
  filters,
}: ExportParams): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Remit2Globe Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transactions", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  const colCount = COLUMNS.length;
  const roleLabel = role === "INDIVIDUAL" ? "Individuals" : "Corporates";
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Outbound Transfers — ${roleLabel}`;
  titleCell.font = TITLE_FONT;

  sheet.mergeCells(2, 1, 2, colCount);
  sheet.getCell(2, 1).value = `Generated: ${generatedAt}`;

  sheet.mergeCells(3, 1, 3, colCount);
  sheet.getCell(3, 1).value = buildFilterSummary(filters);

  sheet.mergeCells(4, 1, 4, colCount);
  sheet.getCell(4, 1).value = `Total records: ${rows.length.toLocaleString()}`;

  sheet.getRow(5).height = 8;

  const headerRowIndex = 6;
  const headerRow = sheet.getRow(headerRowIndex);
  COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    sheet.getColumn(i + 1).width = col.width;
  });
  headerRow.height = 22;

  const numericKeys = new Set([
    "payAmount",
    "receiveAmount",
    "fee",
    "fxRate",
  ]);

  rows.forEach((row, rowIdx) => {
    const dataRowIndex = headerRowIndex + 1 + rowIdx;
    const record = rowToRecord(row);
    const dataRow = sheet.getRow(dataRowIndex);

    COLUMNS.forEach((col, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      const value = record[col.key];
      cell.value = value;
      cell.border = THIN_BORDER;
      cell.alignment = {
        vertical: "middle",
        horizontal: numericKeys.has(col.key) ? "right" : "left",
        wrapText: col.key === "failureReason",
      };
      if (rowIdx % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
      if (numericKeys.has(col.key) && typeof value === "number") {
        cell.numFmt = "#,##0.00";
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildFilename(role, filters);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
