"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const defaultForm = {
  student_id:       "",
  attendance:       "",
  grade_avg:        "",
  assignments:      "",
  engagement:       "",
  prev_gpa:         "",
  study_hours:      "",
  participation:    "",
  missed_deadlines: "",
  notes:            ""
};

const RISK_STYLES = {
  High:      { bg: "bg-green-50",  border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-800" },
  Average:   { bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-800" },
  "At Risk": { bg: "bg-red-50",    border: "border-red-200",   text: "text-red-800",   badge: "bg-red-100 text-red-800" }
};

export default function PredictPage() {
  const [students, setStudents] = useState([]);
  const [form,     setForm]     = useState(defaultForm);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.students.list({ limit: 100 })
      .then(d => setStudents(d.students || []))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        attendance:       parseFloat(form.attendance),
        grade_avg:        parseFloat(form.grade_avg),
        assignments:      parseFloat(form.assignments),
        engagement:       parseFloat(form.engagement),
        prev_gpa:         parseFloat(form.prev_gpa),
        study_hours:      parseFloat(form.study_hours),
        participation:    parseFloat(form.participation),
        missed_deadlines: parseFloat(form.missed_deadlines)
      };
      const data = await api.predictions.create(payload);
      setResult(data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = result ? (RISK_STYLES[result.result?.prediction] || RISK_STYLES.Average) : null;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New prediction</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter student data to predict performance using Random Forest ML model</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Student selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Select student</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Student *</label>
              <select
                name="student_id" required value={form.student_id} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select a student —</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No students found. Add students first from the Students page.</p>
              )}
            </div>
          </div>

          {/* Academic features */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Academic performance</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "attendance",  label: "Attendance (%)",    min: 0, max: 100,  step: 0.1 },
                { name: "grade_avg",   label: "Grade average (%)", min: 0, max: 100,  step: 0.1 },
                { name: "assignments", label: "Assignments (%)",   min: 0, max: 100,  step: 0.1 },
                { name: "engagement",  label: "Engagement score",  min: 0, max: 100,  step: 0.1 }
              ].map(({ name, label, min, max, step }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} *</label>
                  <input
                    type="number" name={name} required
                    min={min} max={max} step={step}
                    value={form[name]} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`0–${max}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral features */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Behavioral & historical</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "prev_gpa",         label: "Previous GPA",       min: 0, max: 4,  step: 0.01 },
                { name: "study_hours",       label: "Study hours/day",    min: 0, max: 12, step: 0.5  },
                { name: "participation",     label: "Participation (0–10)",min: 0,max: 10, step: 1    },
                { name: "missed_deadlines",  label: "Missed deadlines",   min: 0, max: 7,  step: 1    }
              ].map(({ name, label, min, max, step }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} *</label>
                  <input
                    type="number" name={name} required
                    min={min} max={max} step={step}
                    value={form[name]} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${min}–${max}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes (optional)</label>
              <textarea
                name="notes" value={form.notes} onChange={handleChange} rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Any additional observations…"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running prediction…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run prediction
              </>
            )}
          </button>
        </form>

        {/* Result panel */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Main result */}
              <div className={`rounded-xl border p-5 ${styles.bg} ${styles.border}`}>
                <p className="text-xs font-medium text-gray-500 mb-2">Prediction result</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-3xl font-bold ${styles.text}`}>{result.result?.prediction}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                    {((result.result?.confidence || 0) * 100).toFixed(1)}% confidence
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Student: <strong>{result.student?.name}</strong>
                </p>
              </div>

              {/* Probabilities */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Class probabilities</h3>
                {Object.entries(result.result?.probabilities || {}).map(([cls, prob]) => (
                  <div key={cls} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{cls}</span>
                      <span className="text-gray-500">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(prob * 100).toFixed(1)}%`,
                          backgroundColor: RISK_STYLES[cls]?.badge.includes("green") ? "#16a34a" :
                                           RISK_STYLES[cls]?.badge.includes("amber") ? "#d97706" : "#dc2626"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature importance */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Feature importance</h3>
                {Object.entries(result.result?.feature_importance || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([feat, imp]) => (
                    <div key={feat} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{feat.replace(/_/g, " ")}</span>
                        <span className="text-gray-400">{(imp * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(imp * 100).toFixed(1)}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Prediction result</p>
              <p className="text-xs text-gray-400 mt-1">Fill the form and run the prediction to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
