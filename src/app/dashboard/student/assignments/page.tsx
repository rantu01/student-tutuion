"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Loader2, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueAt?: string;
  maxPoints?: number;
  completed: boolean;
  overdue: boolean;
  course?: { title: string; code: string } | null;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students/assignments");
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data.data || []);
    } catch (e) {
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Assignments</h1>
        <p className="mt-1 text-sm text-gray-600">Your assignments and their status.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No assignments yet</h3>
          <p className="mt-1 text-xs text-gray-500">Assignments will appear here once published.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{a.title}</h3>
                    {a.course && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a.course.code}</span>
                    )}
                  </div>
                  {a.description && <p className="text-xs text-gray-600 mt-1">{a.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {a.dueAt && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Due: {new Date(a.dueAt).toLocaleDateString()}</span>
                    )}
                    {typeof a.maxPoints === "number" && <span>{a.maxPoints} pts</span>}
                  </div>
                </div>
                <div>
                  {a.completed ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle className="h-3.5 w-3.5" />Completed</span>
                  ) : a.overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700"><AlertCircle className="h-3.5 w-3.5" />Overdue</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700"><AlertCircle className="h-3.5 w-3.5" />Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}