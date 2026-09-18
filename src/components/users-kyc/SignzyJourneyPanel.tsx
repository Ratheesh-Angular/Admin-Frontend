"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import {
  SignzyDocumentGallery,
  galleryItemsFromJourney,
} from "./SignzyDocumentGallery";
import { fmtDateTime } from "@/lib/payments/transfer-format";
import { DetailRow, SectionCard, fmtDate } from "./kyc-ui";

export type AdminKycJourney = {
  id: string;
  journeyId: string;
  journeyStatus: string;
  currentStep: string | null;
  flowId: string;
  country: string | null;
  residencyStatus: string | null;
  expectedDocuments: unknown;
  journeyUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
  kycDecision: string | null;
  kycDecisionReason: string | null;
  kycDecisionReasonHuman: string | null;
  faceMatchScore: number | null;
  livenessScore: number | null;
  documentType: string | null;
  extractedFields: Record<string, unknown> | null;
  journeyDecision: string | null;
  checks: {
    imageQualityPass: boolean | null;
    documentNotExpired: boolean | null;
    livenessPass: boolean | null;
    faceMatchPass: boolean | null;
    amlClear: boolean | null;
  };
  scores: {
    faceMatchPercentage: number | null;
    livenessScore: number | null;
  };
  aml: {
    present: boolean;
    overallStatus: string | null;
    result: string | null;
    pepResult: string | null;
    screenedOn: string | null;
    screenedName: string | null;
    requestId: string | null;
  };
  capturedImages: {
    frontDoc: string | null;
    backDoc: string | null;
    selfie: string | null;
    faceUrl: string | null;
  };
  documentGallery?: Array<{
    id: string;
    label: string;
    url: string;
    kind: string;
  }>;
};

const EXTRACTED_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  middleName: "Middle name",
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  "Date of Birth": "Date of birth",
  documentNumber: "Document number",
  "Document Number": "Document number",
  idNumber: "Document number",
  passportNumber: "Passport number",
  expiryDate: "Expiry date",
  "Date of Expiry": "Expiry date",
  dateOfExpiry: "Expiry date",
  "Expiry Date": "Expiry date",
  issueDate: "Issue date",
  "Date of Issue": "Issue date",
  dateOfIssue: "Issue date",
  "Issue Date": "Issue date",
  nationality: "Nationality",
  country: "Country",
  idType: "Document type",
  "Id Type": "Document type",
  documentType: "Document type",
  gender: "Gender",
  address: "Address",
  issuingState: "Issuing state",
  "Issuing State": "Issuing state",
  issuingCountry: "Issuing country",
  placeOfBirth: "Place of birth",
};

function humanizeKey(key: string): string {
  if (EXTRACTED_FIELD_LABELS[key]) return EXTRACTED_FIELD_LABELS[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const PREFERRED_FIELD_ORDER = [
  "idType",
  "Id Type",
  "documentType",
  "firstName",
  "middleName",
  "lastName",
  "fullName",
  "dateOfBirth",
  "Date of Birth",
  "documentNumber",
  "Document Number",
  "idNumber",
  "passportNumber",
  "issueDate",
  "Date of Issue",
  "dateOfIssue",
  "Issue Date",
  "expiryDate",
  "Date of Expiry",
  "dateOfExpiry",
  "Expiry Date",
  "nationality",
  "country",
  "gender",
  "address",
  "issuingState",
  "Issuing State",
  "issuingCountry",
  "placeOfBirth",
];

function orderedExtractedRows(
  fields: Record<string, unknown> | null,
): { key: string; label: string; value: string }[] {
  if (!fields) return [];
  const keys = Object.keys(fields);
  const ordered: string[] = [];
  for (const pref of PREFERRED_FIELD_ORDER) {
    if (keys.includes(pref) && !ordered.includes(pref)) ordered.push(pref);
  }
  for (const k of keys) {
    if (!ordered.includes(k)) ordered.push(k);
  }
  return ordered
    .map((key) => ({
      key,
      label: humanizeKey(key),
      value: formatFieldValue(fields[key]).trim(),
    }))
    .filter((r) => r.value);
}

function CheckBadge({ value }: { value: boolean | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        N/A
      </span>
    );
  }
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
        <Check className="w-3 h-3" />
        Pass
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
      <X className="w-3 h-3" />
      Fail
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) {
    return <span className="text-slate-400 text-sm">Not decided</span>;
  }
  const upper = decision.toUpperCase();
  const approved = upper.includes("APPROVED");
  const rejected =
    upper.includes("REJECT") || upper.includes("DECLINE");
  const cls = approved
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : rejected
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {decision}
    </span>
  );
}

function formatExpectedDocs(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((d) => {
        if (typeof d === "string") return d;
        if (d && typeof d === "object") {
          const o = d as Record<string, unknown>;
          return String(o.label ?? o.name ?? o.type ?? "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function formatScore(n: number | null | undefined, asPercent?: boolean): string {
  if (n == null || !Number.isFinite(n)) return "";
  if (asPercent) {
    const pct = n <= 1 ? n * 100 : n;
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  }
  return String(n);
}

type SignzyJourneyPanelProps = {
  userId: string;
  journeys: AdminKycJourney[];
  onResynced?: () => void;
};

export function SignzyJourneyPanel({
  userId,
  journeys,
  onResynced,
}: SignzyJourneyPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    journeys[0]?.id ?? null,
  );
  const [resyncing, setResyncing] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!journeys.length) return null;
    return (
      journeys.find((j) => j.id === selectedId) ?? journeys[0] ?? null
    );
  }, [journeys, selectedId]);

  useEffect(() => {
    if (!journeys.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !journeys.some((j) => j.id === selectedId)) {
      setSelectedId(journeys[0].id);
    }
  }, [journeys, selectedId]);

  async function copyJourneyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopyFlash(true);
      window.setTimeout(() => setCopyFlash(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function resync() {
    if (!selected) return;
    setResyncing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/kyc-journeys/${encodeURIComponent(selected.journeyId)}/resync`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data?.error as string) ||
            (data?.message as string) ||
            "Could not refresh journey from Signzy.",
        );
        return;
      }
      onResynced?.();
    } catch {
      setError("Network error while refreshing from Signzy.");
    } finally {
      setResyncing(false);
    }
  }

  if (journeys.length === 0) {
    return (
      <SectionCard
        title="Signzy journey"
        description="Identity verification session from Signzy"
      >
        <p className="text-sm text-slate-500 py-4">
          No Signzy journey has been started for this user yet.
        </p>
      </SectionCard>
    );
  }

  const fields = orderedExtractedRows(selected?.extractedFields ?? null);
  const galleryItems = selected ? galleryItemsFromJourney(selected) : [];

  return (
    <div className="space-y-6">
      {journeys.length > 1 ? (
        <SectionCard
          title="Journey history"
          description="Select a verification attempt to review"
        >
          <ul className="divide-y divide-slate-100">
            {journeys.map((j) => {
              const active = j.id === selected?.id;
              return (
                <li key={j.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(j.id)}
                    className={`w-full text-left px-1 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 transition-colors ${
                      active ? "bg-indigo-50/60 -mx-1 px-2 rounded-lg" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {j.journeyId}
                    </span>
                    <DecisionBadge decision={j.kycDecision} />
                    <span className="text-xs text-slate-500">
                      {fmtDateTime(j.createdAt)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {j.journeyStatus}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      ) : null}

      {selected ? (
        <>
          <SectionCard
            title="Journey overview"
            description="Signzy verification session for this customer"
            action={
              <button
                type="button"
                onClick={() => void resync()}
                disabled={resyncing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${resyncing ? "animate-spin" : ""}`}
                />
                {resyncing ? "Refreshing…" : "Refresh from Signzy"}
              </button>
            }
          >
            {error ? (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            ) : null}
            <dl>
              <DetailRow
                label="Journey ID"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {selected.journeyId}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copyJourneyId(selected.journeyId)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      title="Copy journey ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copyFlash ? "Copied" : "Copy"}
                    </button>
                  </span>
                }
              />
              <DetailRow label="Journey status" value={selected.journeyStatus} />
              <DetailRow label="Current step" value={selected.currentStep} />
              <DetailRow
                label="App decision"
                value={<DecisionBadge decision={selected.kycDecision} />}
              />
              <DetailRow
                label="Signzy decision"
                value={selected.journeyDecision}
              />
              <DetailRow
                label="Decision reason"
                value={
                  selected.kycDecisionReasonHuman ||
                  selected.kycDecisionReason ||
                  ""
                }
                wide
              />
              <DetailRow label="Country" value={selected.country} />
              <DetailRow
                label="Residency"
                value={selected.residencyStatus}
              />
              <DetailRow
                label="Expected documents"
                value={formatExpectedDocs(selected.expectedDocuments)}
                wide
              />
              <DetailRow
                label="Created"
                value={fmtDateTime(selected.createdAt)}
              />
              <DetailRow
                label="Completed"
                value={
                  selected.completedAt
                    ? fmtDateTime(selected.completedAt)
                    : ""
                }
              />
              {/* {selected.journeyUrl ? (
                <DetailRow
                  label="Journey link"
                  value={
                    <a
                      href={selected.journeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Open hosted KYC
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  }
                />
              ) : null} */}
            </dl>
          </SectionCard>

          <SectionCard
            title="Document"
            description="OCR details extracted by Signzy"
          >
            <dl>
              <DetailRow
                label="Document type"
                value={selected.documentType || "—"}
              />
            </dl>
            {fields.length === 0 ? (
              <p className="text-sm text-slate-500 py-3">
                No document details available yet. If verification is complete,
                try Refresh from Signzy.
              </p>
            ) : (
              <dl>
                {fields.map((row) => (
                  <DetailRow
                    key={row.key}
                    label={row.label}
                    value={row.value}
                    wide={row.label.toLowerCase().includes("address")}
                  />
                ))}
              </dl>
            )}
          </SectionCard>

          <SectionCard
            title="Verification checks"
            description="Biometrics, document validity, and AML"
          >
            <dl>
              <DetailRow
                label="Image quality"
                value={<CheckBadge value={selected.checks.imageQualityPass} />}
              />
              <DetailRow
                label="Document not expired"
                value={
                  <CheckBadge value={selected.checks.documentNotExpired} />
                }
              />
              <DetailRow
                label="Liveness"
                value={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <CheckBadge value={selected.checks.livenessPass} />
                    {selected.scores.livenessScore != null ? (
                      <span className="text-xs text-slate-500">
                        score{" "}
                        {formatScore(selected.scores.livenessScore, true)}
                      </span>
                    ) : null}
                  </span>
                }
              />
              <DetailRow
                label="Face match"
                value={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <CheckBadge value={selected.checks.faceMatchPass} />
                    {selected.scores.faceMatchPercentage != null ? (
                      <span className="text-xs text-slate-500">
                        {formatScore(selected.scores.faceMatchPercentage, true)}
                      </span>
                    ) : null}
                  </span>
                }
              />
              <DetailRow
                label="AML clear"
                value={<CheckBadge value={selected.checks.amlClear} />}
              />
            </dl>

            {selected.aml.present ? (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1 px-0 py-2">
                  AML screening
                </p>
                <dl>
                  <DetailRow
                    label="Overall status"
                    value={selected.aml.overallStatus}
                  />
                  <DetailRow label="Result" value={selected.aml.result} />
                  <DetailRow label="PEP result" value={selected.aml.pepResult} />
                  <DetailRow
                    label="Screened name"
                    value={selected.aml.screenedName}
                  />
                  <DetailRow
                    label="Screened on"
                    value={
                      selected.aml.screenedOn
                        ? fmtDate(selected.aml.screenedOn)
                        : ""
                    }
                  />
                  <DetailRow
                    label="Request / batch ID"
                    value={selected.aml.requestId}
                  />
                </dl>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-3 border-t border-slate-100 mt-2">
                No AML screening result stored for this journey.
              </p>
            )}
          </SectionCard>

          <SignzyDocumentGallery
            items={galleryItems}
            journeyId={selected.journeyId}
            documentType={selected.documentType}
            userId={userId}
            onResynced={onResynced}
            title="Captured images"
            description="Document and selfie captures from Signzy (links may expire)"
          />
        </>
      ) : null}
    </div>
  );
}
