/**
 * Shared RiskBadge component — use across dashboard, history, and predict pages.
 * Import: import RiskBadge from "@/components/RiskBadge"
 */

const STYLES = {
  High:      "bg-green-100 text-green-800",
  Average:   "bg-amber-100 text-amber-800",
  "At Risk": "bg-red-100 text-red-800"
};

const DOTS = {
  High:      "bg-green-500",
  Average:   "bg-amber-500",
  "At Risk": "bg-red-500"
};

export default function RiskBadge({ value, showDot = false, size = "sm" }) {
  const base = STYLES[value] || "bg-gray-100 text-gray-700";
  const dot  = DOTS[value]   || "bg-gray-400";
  const sizeClass = size === "lg"
    ? "px-3.5 py-1 text-sm font-semibold rounded-full"
    : "px-2.5 py-0.5 text-xs font-medium rounded-full";

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} ${base}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {value || "Unknown"}
    </span>
  );
}
