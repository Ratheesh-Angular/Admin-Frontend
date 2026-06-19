"use client";

import { useEffect, useState } from "react";

type Transfer = {
  id: string;
  referenceCode: string;
  payInMethod: string | null;
  status: string;
  payAmount: number | null;
  payCurrency: string | null;
  createdAt: string;
  beneficiary: {
    deliveryChannel: string;
  } | null;
  user: {
    name: string | null;
    email: string;
  };
};

async function readJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      success: false,
      error: `Empty response from server (${res.status})`,
    };
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      success: false,
      error: `Invalid JSON from server (${res.status})`,
    };
  }
}

type PayoutPayloadView = {
  label: string | null;
  payload: unknown;
  flexResponse: unknown;
  error: string | null;
  referenceCode: string | null;
};

function extractPayoutDebug(data: Record<string, unknown>): PayoutPayloadView {
  const inner =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};
  return {
    label:
      typeof inner.payoutPayloadLabel === "string"
        ? inner.payoutPayloadLabel
        : null,
    payload: inner.payoutPayload ?? null,
    flexResponse: inner.flexResponse ?? null,
    error: typeof data.error === "string" ? data.error : null,
    referenceCode:
      typeof inner.referenceCode === "string" ? inner.referenceCode : null,
  };
}

function logPayoutDebug(view: PayoutPayloadView) {
  if (view.label && view.payload) {
    console.log(view.label, view.payload);
  }
  if (view.flexResponse) {
    console.log("FLEX_PAYOUT_RESPONSE", view.flexResponse);
  }
  if (view.error) {
    console.error("PAYOUT_TRIGGER_ERROR", view.error);
  }
}

export default function TestPayoutsPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [lastPayoutDebug, setLastPayoutDebug] = useState<PayoutPayloadView | null>(
    null,
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/transfers");
      const data = await readJsonResponse(res);
      if (data.success && data.data && typeof data.data === "object") {
        const transfers = (data.data as { transfers?: Transfer[] }).transfers;
        setTransfers(Array.isArray(transfers) ? transfers : []);
      } else {
        setError(String(data.error || "Failed to load transfers"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransfers();
  }, []);

  const triggerPayout = async (id: string, reference: string) => {
    setTriggeringId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/transfers/${id}/trigger-payout`, {
        method: "POST",
      });
      const data = await readJsonResponse(res);
      const debug = extractPayoutDebug(data);
      logPayoutDebug(debug);
      setLastPayoutDebug(debug);

      if (data.success) {
        setMessage({
          type: "success",
          text: `Payout triggered for ${reference}. Payload is below and in browser console.`,
        });
        void loadTransfers();
      } else {
        setMessage({
          type: "error",
          text: String(
            data.error ||
              "Payout failed — see payload below (senderDocNumber may be invalid).",
          ),
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to trigger payout",
      });
    } finally {
      setTriggeringId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Test Payouts
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Loading transfers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Test Payouts
        </h1>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm space-y-3">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadTransfers()}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
        Test Payouts
      </h1>
      <p className="text-slate-500 mt-1 text-sm">
        Manually trigger payouts for testing. The /newPayment payload appears in
        the Network tab response, browser console, and below.
      </p>

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {lastPayoutDebug?.payload ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 text-xs font-medium text-slate-300">
            {lastPayoutDebug.label ?? "PAYOUT_PAYLOAD"}
            {lastPayoutDebug.referenceCode
              ? ` — ${lastPayoutDebug.referenceCode}`
              : ""}
          </div>
          <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(lastPayoutDebug.payload, null, 2)}
          </pre>
          {lastPayoutDebug.flexResponse ? (
            <>
              <div className="px-4 py-2 border-t border-slate-800 text-xs font-medium text-slate-300">
                FLEX_PAYOUT_RESPONSE
              </div>
              <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap border-t border-slate-800">
                {JSON.stringify(lastPayoutDebug.flexResponse, null, 2)}
              </pre>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Reference
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Pay Method
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Delivery
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Created
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.referenceCode}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {t.user.name || t.user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.payInMethod || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.beneficiary?.deliveryChannel || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          t.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : t.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : t.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 tabular-nums">
                      {t.payAmount ?? "—"} {t.payCurrency ?? ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => triggerPayout(t.id, t.referenceCode)}
                        disabled={triggeringId === t.id}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {triggeringId === t.id
                          ? "Triggering..."
                          : "Trigger Payout"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
