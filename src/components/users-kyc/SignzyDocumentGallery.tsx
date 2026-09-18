"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { SectionCard } from "./kyc-ui";

export type DocumentGalleryItem = {
  id: string;
  label: string;
  url: string;
  kind: string;
};

type SignzyDocumentGalleryProps = {
  items: DocumentGalleryItem[];
  journeyId?: string | null;
  documentType?: string | null;
  userId: string;
  /** When set, shows Refresh and calls this journey's resync endpoint */
  onResynced?: () => void;
  title?: string;
  description?: string;
  /** Compact mode without outer SectionCard (for embedding) */
  embedded?: boolean;
};

export function SignzyDocumentGallery({
  items,
  journeyId,
  documentType,
  userId,
  onResynced,
  title = "Signzy documents",
  description = "Document captures from the Signzy verification journey",
  embedded = false,
}: SignzyDocumentGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());
  const [resyncing, setResyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !items.some((i) => i.id === activeId)) {
      setActiveId(items[0].id);
    }
  }, [items, activeId]);

  const active = items.find((i) => i.id === activeId) ?? items[0] ?? null;
  const activeBroken = active ? brokenIds.has(active.id) : false;

  async function resync() {
    if (!journeyId) return;
    setResyncing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/kyc-journeys/${encodeURIComponent(journeyId)}/resync`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data?.error as string) ||
            (data?.message as string) ||
            "Could not refresh images from Signzy.",
        );
        return;
      }
      setBrokenIds(new Set());
      onResynced?.();
    } catch {
      setError("Network error while refreshing from Signzy.");
    } finally {
      setResyncing(false);
    }
  }

  const refreshButton =
    journeyId && onResynced ? (
      <button
        type="button"
        onClick={() => void resync()}
        disabled={resyncing}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${resyncing ? "animate-spin" : ""}`} />
        {resyncing ? "Refreshing…" : "Refresh from Signzy"}
      </button>
    ) : null;

  const body =
    items.length === 0 ? (
      <div className="py-4 space-y-3">
        <p className="text-sm text-slate-500">
          No document images available from Signzy yet.
          {journeyId
            ? " If verification completed, refresh to pull the latest captures."
            : ""}
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {refreshButton && !embedded ? (
          <div>{refreshButton}</div>
        ) : null}
      </div>
    ) : (
      <div className="py-3 space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {documentType || journeyId ? (
          <p className="text-xs text-slate-500">
            {documentType ? (
              <span>
                Document type:{" "}
                <span className="font-medium text-slate-700">{documentType}</span>
              </span>
            ) : null}
            {documentType && journeyId ? " · " : null}
            {journeyId ? (
              <span>
                Journey{" "}
                <span className="font-mono text-slate-700">{journeyId}</span>
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200 bg-white">
            <p className="text-sm font-medium text-slate-900 truncate">
              {active?.label ?? "Document"}
            </p>
            {active?.url ? (
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-800 shrink-0"
              >
                Open full size
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
          <div className="flex min-h-[280px] items-center justify-center p-4 bg-slate-100/80">
            {active && !activeBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.url}
                alt={active.label}
                className="max-h-[420px] max-w-full object-contain rounded shadow-sm"
                onError={() => {
                  setBrokenIds((prev) => new Set(prev).add(active.id));
                }}
              />
            ) : (
              <div className="text-center px-4 space-y-2">
                <p className="text-sm text-slate-600">
                  Image could not be loaded. Signzy links expire after a short
                  time.
                </p>
                {refreshButton}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const selected = item.id === active?.id;
            const broken = brokenIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`shrink-0 w-20 rounded-md border overflow-hidden transition-colors ${
                  selected
                    ? "border-indigo-600 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                title={item.label}
              >
                <div className="h-14 bg-slate-100 flex items-center justify-center">
                  {!broken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      onError={() => {
                        setBrokenIds((prev) => new Set(prev).add(item.id));
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 px-1 text-center">
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-[10px] leading-tight text-slate-600 px-1 py-1 truncate bg-white">
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Signzy image URLs may expire. Use Refresh from Signzy if previews fail
          to load.
        </p>
      </div>
    );

  if (embedded) {
    return body;
  }

  return (
    <SectionCard
      title={title}
      description={description}
      action={items.length > 0 ? refreshButton : null}
    >
      {body}
    </SectionCard>
  );
}

/** Build gallery items from journey DTO (documentGallery preferred). */
export function galleryItemsFromJourney(journey: {
  documentGallery?: DocumentGalleryItem[] | null;
  capturedImages?: {
    frontDoc: string | null;
    backDoc: string | null;
    selfie: string | null;
    faceUrl: string | null;
  } | null;
}): DocumentGalleryItem[] {
  if (Array.isArray(journey.documentGallery) && journey.documentGallery.length) {
    return journey.documentGallery.filter((i) => i?.url);
  }
  const img = journey.capturedImages;
  if (!img) return [];
  const items: DocumentGalleryItem[] = [];
  const push = (
    id: string,
    label: string,
    url: string | null | undefined,
    kind: string,
  ) => {
    if (!url) return;
    items.push({ id, label, url, kind });
  };
  push("frontDoc", "Front document", img.frontDoc, "FRONT_DOC");
  push("backDoc", "Back document", img.backDoc, "BACK_DOC");
  push("selfie", "Selfie", img.selfie, "SELFIE");
  push("faceUrl", "Face crop", img.faceUrl, "FACE");
  return items;
}
