"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type AdminDataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Used by the built-in search filter. */
  searchText?: (row: T) => string;
  headerClassName?: string;
  cellClassName?: string;
};

export type AdminDataTableProps<T> = {
  columns: AdminDataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  filteredEmptyMessage?: string;
  /** Rows per page. Defaults to 10. */
  pageSize?: number;
};

export function filterTableRows<T>(
  data: T[],
  search: string,
  columns: AdminDataTableColumn<T>[],
): T[] {
  const tokens = searchTokens(search);
  if (tokens.length === 0) return data;
  return data.filter((row) => {
    const haystack = normalizeForSearch(
      columns.map((col) => col.searchText?.(row) ?? "").join(" "),
    );
    return tokens.every((token) => haystack.includes(token));
  });
}

/** Lowercase, unify dash variants, collapse whitespace — for fuzzy table search. */
function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2013\u2014\u2212–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

const DEFAULT_PAGE_SIZE = 10;

export function AdminDataTable<T>({
  columns,
  data,
  getRowKey,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  toolbar,
  loading = false,
  emptyMessage = "No records found.",
  filteredEmptyMessage = "No records match your search.",
  pageSize = DEFAULT_PAGE_SIZE,
}: AdminDataTableProps<T>) {
  const [page, setPage] = useState(1);
  const filtered = filterTableRows(data, search, columns);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full sm:max-w-xs rounded-lg border border-slate-200 px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
        />
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-6 py-3 font-medium ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  {search.trim() ? filteredEmptyMessage : emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={getRowKey(row)} className="text-slate-700 hover:bg-slate-50/60">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-6 py-3 align-middle ${col.cellClassName ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalItems > 0 ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {totalItems.toLocaleString()}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-slate-500 px-1 tabular-nums">
              Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
