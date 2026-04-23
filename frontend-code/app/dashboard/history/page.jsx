"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const RiskBadge = ({ value }) => {
  const styles = {
    High:      "bg-green-100 text-green-800",
    Average:   "bg-amber-100 text-amber-800",
    "At Risk": "bg-red-100 text-red-800"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[value] || "bg-gray-100 text-gray-700"}`}>
      {value}
    </span>
  );
};

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("");
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({});

  const fetchPredictions = (p = 1, pred = filter) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (pred) params.prediction = pred;
    api.predictions.list(params)
      .then(d => {
        setPredictions(d.predictions || []);
        setPagination(d.pagination || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPredictions(1, ""); }, []);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
    fetchPredictions(1, val);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this prediction?")) return;
    await api.predictions.delete(id);
    fetchPredictions(page, filter);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Prediction history</h1>
          <p className="text-sm text-gray-500 mt-0.5">All predictions made by your account</p>
        </div>
        {/* Filter */}
        <div className="flex gap-2">
          {["", "High", "Average", "At Risk"].map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : predictions.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No predictions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Student", "Grade avg", "Attendance", "Study hrs", "GPA", "Prediction", "Confidence", "Date", ""].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{p.student?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{p.student?.studentId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.grade_avg?.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.attendance?.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.study_hours?.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.prev_gpa?.toFixed(2)}</td>
                    <td className="px-4 py-3"><RiskBadge value={p.result?.prediction} /></td>
                    <td className="px-4 py-3 text-gray-700">{((p.result?.confidence || 0) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { setPage(p => p - 1); fetchPredictions(page - 1, filter); }}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => { setPage(p => p + 1); fetchPredictions(page + 1, filter); }}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
