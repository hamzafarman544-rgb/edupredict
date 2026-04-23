"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const RISK_COLORS = { High: "#16a34a", Average: "#d97706", "At Risk": "#dc2626" };

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats,        setStats]        = useState([]);
  const [predictions,  setPredictions]  = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.predictions.stats(),
      api.predictions.list({ limit: 8 })
    ]).then(([statsData, predsData]) => {
      setStats(statsData.stats || []);
      setTotal(statsData.total || 0);
      setPredictions(predsData.predictions || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCount = (label) => stats.find(s => s._id === label)?.count || 0;
  const highCount    = getCount("High");
  const avgCount     = getCount("Average");
  const riskCount    = getCount("At Risk");
 

  const pieData = [
    { name: "High",    value: highCount,  color: "#16a34a" },
    { name: "Average", value: avgCount,   color: "#d97706" },
    { name: "At Risk", value: riskCount,  color: "#dc2626" }
  ].filter(d => d.value > 0);

  const barData = [
    { name: "High",    count: highCount,  fill: "#16a34a" },
    { name: "Average", count: avgCount,   fill: "#d97706" },
    { name: "At Risk", count: riskCount,  fill: "#dc2626" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your prediction overview</p>
        </div>
        <Link
          href="/dashboard/predict"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New prediction
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total predictions", value: total,         color: "text-gray-900" },
          { label: "High performers",   value: highCount,     color: "text-green-700" },
          { label: "At Risk",           value: riskCount,     color: "text-red-700" },
          // { label: "Model accuracy",    value: `${modelAccuracy}%`, color: "text-blue-700" }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Predictions by category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} students`, name]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent predictions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent predictions</h2>
          <Link href="/dashboard/history" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : predictions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No predictions yet.</p>
            <Link href="/dashboard/predict" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
              Make your first prediction →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase tracking-wider">Student</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Grade avg</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Attendance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Prediction</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Confidence</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.student?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{p.student?.studentId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.grade_avg?.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-700">{p.features?.attendance?.toFixed(1)}%</td>
                    <td className="px-4 py-3"><RiskBadge value={p.result?.prediction} /></td>
                    <td className="px-4 py-3 text-gray-700">{((p.result?.confidence || 0) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
