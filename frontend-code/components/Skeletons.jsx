/**
 * Reusable loading skeleton components.
 * Use while API data is being fetched.
 */

export function SkeletonBox({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <SkeletonBox className="h-3 w-24 mb-3" />
      <SkeletonBox className="h-7 w-16" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div className="animate-pulse bg-gray-100 rounded-lg w-full" style={{ height }} />
  );
}
