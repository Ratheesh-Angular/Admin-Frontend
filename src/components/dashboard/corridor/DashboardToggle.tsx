"use client";

type DashboardToggleProps = {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
};

export function DashboardToggle({
  options,
  value,
  onChange,
}: DashboardToggleProps) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-lg border border-[#e4e0db] bg-[#f3f1ef] p-1"
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`rounded-md px-3 py-1.5 font-mono text-[11.5px] font-medium transition-colors ${
            value === opt.id
              ? "bg-[#c81e3a] text-white"
              : "bg-transparent text-[#6b6560] hover:text-[#221c1a]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
