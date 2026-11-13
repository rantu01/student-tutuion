"use client";

import { useState, useEffect } from "react";
import { BarChart3, Loader2, BookOpen, ClipboardList, Target, CheckCircle } from "lucide-react";

export default function StudentProgressPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    courses: 0,
    assignmentsTotal: 0,
    assignmentsCompleted: 0,
    assignmentsOverdue: 0,
    missions: 0,
    avgMissionProgress: 0,
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const [coursesRes, assignmentsRes, missionsRes] = await Promise.all([
        fetch("/api/students/courses"),
        fetch("/api/students/assignments"),
        fetch("/api/mission-hub/student-missions"),
      ]);

      let courses = 0;
      if (coursesRes.ok) {
        const d = await coursesRes.json();
        courses = (d.data || []).length;
      }

      let assignmentsTotal = 0, assignmentsCompleted = 0, assignmentsOverdue = 0;
      if (assignmentsRes.ok) {
        const d = await assignmentsRes.json();
        const list = d.data || [];
        assignmentsTotal = list.length;
        assignmentsCompleted = list.filter((a: any) => a.completed).length;
        assignmentsOverdue = list.filter((a: any) => a.overdue).length;
      }

      let missions = 0, avgMissionProgress = 0;
      if (missionsRes.ok) {
        const d = await missionsRes.json();
        const list = d.data?.missions || [];
        missions = list.length;
        if (list.length > 0) {
          avgMissionProgress = Math.round(
            list.reduce((s: number, m: any) => s + (m.progress || 0), 0) / list.length
          );
        }
      }

      setStats({ courses, assignmentsTotal, assignmentsCompleted, assignmentsOverdue, missions, avgMissionProgress });
    } catch (e) {
      console.error("Failed to load progress", e);
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

  const completionRate = stats.assignmentsTotal > 0
    ? Math.round((stats.assignmentsCompleted / stats.assignmentsTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Progress</h1>
        <p className="mt-1 text-sm text-gray-600">Your overall academic progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.courses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Assignments Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignmentsCompleted}/{stats.assignmentsTotal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><BarChart3 className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Overdue Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignmentsOverdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Target className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Missions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Assignment Completion Rate</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{completionRate}% completed</p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Average Mission Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: `${stats.avgMissionProgress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{stats.avgMissionProgress}% average progress</p>
      </div>
    </div>
  );
}