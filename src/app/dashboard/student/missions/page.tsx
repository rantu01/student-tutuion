"use client";

import { useState, useEffect } from "react";
import { Target, Loader2, Calendar, Users } from "lucide-react";

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  totalStudents?: number;
  totalMentors?: number;
  progress?: number;
  studentStatus?: string;
}

export default function StudentMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mission-hub/student-missions");
      if (!res.ok) throw new Error("Failed to load missions");
      const data = await res.json();
      setMissions(data.data?.missions || []);
    } catch (e) {
      setError("Failed to load missions");
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
        <h1 className="text-2xl font-bold text-black">My Missions</h1>
        <p className="mt-1 text-sm text-gray-600">Missions you are enrolled in.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {missions.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Target className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No missions assigned yet</h3>
          <p className="mt-1 text-xs text-gray-500">You will see your missions here once assigned.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => (
            <div key={m._id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{m.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{m.status}</span>
                  </div>
                  {m.description && <p className="text-xs text-gray-600 mt-2">{m.description}</p>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {m.startDate && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(m.startDate).toLocaleDateString()}</span>
                    )}
                    {typeof m.totalStudents === "number" && (
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{m.totalStudents} students</span>
                    )}
                    {typeof m.progress === "number" && (
                      <span>Progress: {m.progress}%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}