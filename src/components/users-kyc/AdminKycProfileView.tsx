"use client";

import { useState } from "react";
import { ClipboardCheck, Download, ExternalLink, FileText, FolderOpen, User } from "lucide-react";
import { documentTypeLabel } from "@/lib/kyc/documentLabels";
import { fmtDateTime } from "@/lib/payments/transfer-format";
import { KycReviewPanel, type KycHistoryEntry } from "./KycReviewPanel";
import {
  DetailRow,
  DocStatusBadge,
  fmtDate,
  formatCorporateBusinessAddress,
  KycBadge,
  normalizeSubmittedProfileArray,
  residenceDetailRows,
  SectionCard,
} from "./kyc-ui";

type TabId = "account" | "verification" | "documents" | "review";

export type AdminKycUser = Record<string, unknown>;

type AdminKycProfileViewProps = {
  user: AdminKycUser;
  userId: string;
  acting?: "APPROVED" | "REJECTED" | null;
  onApprove?: (message: string) => void;
  onReject?: (message: string) => void;
};

function CorporateKeyPersonnelList({ value }: { value: unknown }) {
  const items = normalizeSubmittedProfileArray(value);
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 py-2">Not provided</p>;
  }
  return (
    <ul className="space-y-3 list-none m-0 p-0 pt-1">
      {items.map((entry, idx) => {
        const o = (entry ?? {}) as Record<string, unknown>;
        const fullName = String(o.fullName ?? "").trim() || "—";
        const docUrl = String(
          o.documentFileUrl ?? o.passportOrNationalIdDocumentUrl ?? "",
        ).trim();
        const docName = String(o.documentFileName ?? "").trim();
        return (
          <li
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 border-l-[3px] border-l-indigo-600"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Full name
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{fullName}</p>
            {docName ? (
              <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                {docName}
              </p>
            ) : null}
            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-2 items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
              >
                View document
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function CorporateShareholdersList({ value }: { value: unknown }) {
  const items = normalizeSubmittedProfileArray(value);
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 py-2">Not provided</p>;
  }
  return (
    <ul className="space-y-3 list-none m-0 p-0 pt-1">
      {items.map((entry, idx) => {
        const o = (entry ?? {}) as Record<string, unknown>;
        const isCorporate = o.kind === "CORPORATE";
        const fullName = String(
          o.fullName ?? o.entityName ?? o.businessName ?? "",
        ).trim();
        const registeredAddress = String(
          o.registeredAddress ?? o.address ?? "",
        ).trim();
        const docUrl = String(
          o.documentFileUrl ?? o.passportOrNationalIdDocumentUrl ?? "",
        ).trim();
        const docName = String(o.documentFileName ?? "").trim();
        return (
          <li
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 border-l-[3px] border-l-indigo-600"
          >
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset bg-slate-100 text-slate-800 ring-slate-200">
              {isCorporate ? "Corporate" : "Individual"}
            </span>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-3">
              {isCorporate ? "Entity name" : "Full name"}
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {fullName || "—"}
            </p>
            {isCorporate && registeredAddress ? (
              <p className="text-sm text-slate-800 mt-2 whitespace-pre-wrap break-words">
                {registeredAddress}
              </p>
            ) : null}
            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-2 items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
              >
                View document
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {docName && !docUrl ? (
              <p className="text-xs text-slate-600 mt-2">{docName}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function AdminKycProfileView({
  user,
  userId,
  acting = null,
  onApprove,
  onReject,
}: AdminKycProfileViewProps) {
  const [tab, setTab] = useState<TabId>("account");
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const role = String(user.role ?? "");
  const kycStatus = String(user.kycStatus ?? "");
  const individual = user.individualProfile as Record<string, unknown> | null;
  const corporate = user.corporateProfile as Record<string, unknown> | null;
  const documents = (user.documents as Array<Record<string, unknown>>) ?? [];
  const kycHistory = (user.kycHistory as KycHistoryEntry[] | undefined) ?? [];
  const recipientName =
    (role === "CORPORATE"
      ? String(corporate?.businessName ?? "")
      : String(individual?.fullName ?? "")) ||
    String(user.email ?? "").trim() ||
    "Customer";

  async function handleDownloadAll() {
    setDownloadingZip(true);
    setDownloadError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/kyc-documents/zip`,
        { credentials: "same-origin" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDownloadError(
          (data?.error as string) || "Could not download documents.",
        );
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `kyc-${userId}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Network error while downloading documents.");
    } finally {
      setDownloadingZip(false);
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "verification", label: "Verification", icon: FileText },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "review", label: "KYC review", icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="KYC sections">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "account" && (
        <SectionCard
          title="Account overview"
          description="How this account appears in the system"
        >
          <dl>
            <DetailRow label="Email" value={user.email as string} />
            <DetailRow label="Phone" value={user.phone as string} />
            <DetailRow label="Registration country" value={user.country as string} />
            <DetailRow
              label="Account type"
              value={role === "INDIVIDUAL" ? "Individual" : "Corporate"}
            />
            <DetailRow
              label="KYC status"
              value={<KycBadge status={String(user.kycStatus ?? "")} />}
            />
            <DetailRow
              label="Email verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
            <DetailRow
              label="Phone verified"
              value={user.phoneVerified ? "Yes" : "No"}
            />
            <DetailRow
              label="Member since"
              value={fmtDateTime(user.createdAt as string | undefined)}
            />
          </dl>
        </SectionCard>
      )}

      {tab === "verification" && (
        <div className="space-y-6">
          {role === "CORPORATE" ? (
            <>
              <SectionCard title="Business information" description="Registered business details">
                <dl>
                  <DetailRow label="Business name" value={corporate?.businessName as string} />
                  <DetailRow label="Nature of business" value={corporate?.natureOfBusiness as string} />
                  <DetailRow
                    label="Business address"
                    value={formatCorporateBusinessAddress(corporate?.businessAddress)}
                    wide
                  />
                  <DetailRow label="Registration number" value={corporate?.registrationNumber as string} />
                  <DetailRow
                    label="Incorporation date"
                    value={fmtDate(corporate?.incorporationDate as string | undefined)}
                  />
                </dl>
              </SectionCard>
              <SectionCard title="Licenses & registration" description="Trading and regulatory licenses">
                <dl>
                  <DetailRow label="Trading license number" value={corporate?.tradingLicenseNumber as string} />
                  <DetailRow
                    label="Trading license issued"
                    value={fmtDate(corporate?.tradingLicenseIssue as string | undefined)}
                  />
                  <DetailRow
                    label="Trading license expires"
                    value={fmtDate(corporate?.tradingLicenseExpiry as string | undefined)}
                  />
                  <DetailRow label="Regulatory license number" value={corporate?.regulatoryLicenseNumber as string} />
                  <DetailRow
                    label="Regulatory license issued"
                    value={fmtDate(corporate?.regulatoryLicenseIssue as string | undefined)}
                  />
                  <DetailRow
                    label="Regulatory license expires"
                    value={fmtDate(corporate?.regulatoryLicenseExpiry as string | undefined)}
                  />
                </dl>
              </SectionCard>
              <SectionCard title="Key personnel" description="Directors and officers">
                <CorporateKeyPersonnelList value={corporate?.keyPersonnel} />
              </SectionCard>
              <SectionCard title="Shareholders" description="Shareholding structure">
                <CorporateShareholdersList value={corporate?.shareholders} />
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard title="Personal information" description="Name and basic details">
                <dl>
                  <DetailRow
                    label="Full name"
                    value={
                      (individual?.fullName as string) ||
                      [individual?.firstName, individual?.middleName, individual?.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      ""
                    }
                  />
                  <DetailRow label="First name" value={individual?.firstName as string} />
                  <DetailRow label="Middle name" value={individual?.middleName as string} />
                  <DetailRow label="Last name" value={individual?.lastName as string} />
                  <DetailRow
                    label="Date of birth"
                    value={fmtDate(individual?.dateOfBirth as string | undefined)}
                  />
                  <DetailRow label="Nationality" value={individual?.nationality as string} />
                  <DetailRow
                    label="National / foreign"
                    value={
                      individual?.isNational
                        ? "National"
                        : individual?.isNational === false
                          ? "Foreign national"
                          : ""
                    }
                  />
                </dl>
              </SectionCard>
              <SectionCard title="Identity documents" description="Passport, national ID, and work permit">
                <dl>
                  {individual?.isNational ? (
                    <DetailRow
                      label="Primary document (citizen)"
                      value={
                        individual?.citizenPrimaryDocumentType === "PASSPORT"
                          ? "Passport"
                          : individual?.citizenPrimaryDocumentType === "NATIONAL_ID"
                            ? "National ID"
                            : "—"
                      }
                    />
                  ) : null}
                  <DetailRow label="Passport number" value={individual?.passportNumber as string} />
                  <DetailRow
                    label="Passport issuing country"
                    value={individual?.passportIssuingCountry as string}
                  />
                  <DetailRow
                    label="Passport issued"
                    value={fmtDate(individual?.passportIssue as string | undefined)}
                  />
                  <DetailRow
                    label="Passport expires"
                    value={fmtDate(individual?.passportExpiry as string | undefined)}
                  />
                  <DetailRow label="National ID number" value={individual?.nationalIdNumber as string} />
                  <DetailRow
                    label="National ID issuing country"
                    value={individual?.nationalIdIssuingCountry as string}
                  />
                  <DetailRow
                    label="National ID issued"
                    value={fmtDate(individual?.nationalIdIssue as string | undefined)}
                  />
                  <DetailRow label="Work permit number" value={individual?.workPermitNumber as string} />
                  <DetailRow
                    label="Work permit issued"
                    value={fmtDate(individual?.workPermitIssue as string | undefined)}
                  />
                  <DetailRow
                    label="Work permit expires"
                    value={fmtDate(individual?.workPermitExpiry as string | undefined)}
                  />
                </dl>
              </SectionCard>
              <SectionCard title="Address, contact & employment" description="Residence and occupation">
                <dl>
                  {residenceDetailRows(individual).map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} wide />
                  ))}
                  <DetailRow label="Country" value={individual?.country as string} />
                  <DetailRow label="Occupation" value={individual?.occupation as string} />
                  <DetailRow label="Employer" value={individual?.employerName as string} />
                </dl>
              </SectionCard>
            </>
          )}
        </div>
      )}

      {tab === "documents" && (
        <SectionCard
          title="Uploaded documents"
          description="Files submitted for verification"
          action={
            documents.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleDownloadAll()}
                disabled={downloadingZip}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingZip ? "Preparing…" : "Download all"}
              </button>
            ) : null
          }
        >
          {downloadError ? (
            <p className="text-sm text-red-600 mb-3">{downloadError}</p>
          ) : null}
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No documents uploaded.</p>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">File</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={String(doc.id)} className="align-top">
                      <td className="py-3 pr-4 text-slate-900">
                        {documentTypeLabel(String(doc.documentType))}
                      </td>
                      <td className="py-3 pr-4">
                        {doc.fileUrl ? (
                          <a
                            href={String(doc.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                          >
                            {String(doc.fileName ?? "View")}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          String(doc.fileName ?? "—")
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <DocStatusBadge status={String(doc.status)} />
                      </td>
                      <td className="py-3 text-slate-600">
                        {fmtDate(doc.uploadedAt as string | undefined)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "review" && onApprove && onReject ? (
        <KycReviewPanel
          kycStatus={kycStatus}
          recipientName={recipientName}
          kycHistory={kycHistory}
          acting={acting}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}
    </div>
  );
}
