"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const defaultForm = { name: "", studentId: "", email: "", course: "", semester: "" };

export default function StudentsPage() {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(defaultForm);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  const fetch = (q = search) => {
    setLoading(true);
    api.students.list({ search: q, limit: 50 })
      .then(d => setStudents(d.students || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(""); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.students.create(form);
      setForm(defaultForm);
      setShowForm(false);
      fetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student and all their predictions?")) return;
    await api.students.delete(id);
    fetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage student records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add student
        </button>
      </div>

      {/* Add student form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Add new student</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "name",      label: "Full name *",    placeholder: "Jane Smith",       required: true  },
              { name: "studentId", label: "Student ID *",   placeholder: "STU-2024-001",     required: true  },
              { name: "email",     label: "Email",          placeholder: "jane@uni.edu",      required: false },
              { name: "course",    label: "Course",         placeholder: "Computer Science",  required: false },
              { name: "semester",  label: "Semester",       placeholder: "Spring 2025",       required: false }
            ].map(({ name, label, placeholder, required }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                <input
                  type={name === "email" ? "email" : "text"}
                  name={name} required={required}
                  value={form[name]}
                  onChange={e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-3 flex gap-3">
              <button
                type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save student"}
              </button>
              <button
                type="button" onClick={() => { setShowForm(false); setError(""); setForm(defaultForm); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" value={search}
          onChange={e => { setSearch(e.target.value); fetch(e.target.value); }}
          placeholder="Search by name or student ID…"
          className="w-full max-w-sm px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">No students yet.</p>
            <button onClick={() => setShowForm(true)} className="text-sm text-blue-600 hover:underline mt-1">
              Add your first student →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Name", "Student ID", "Course", "Semester", "Email", "Added", ""].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.studentId}</td>
                  <td className="px-4 py-3 text-gray-500">{s.course || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.semester || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
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
        )}
      </div>
    </div>
  );
}
