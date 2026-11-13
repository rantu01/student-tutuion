"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
  enrolledAt?: string;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students/courses");
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(data.data || []);
    } catch (e) {
      setError("Failed to load courses");
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
        <h1 className="text-2xl font-bold text-black">My Courses</h1>
        <p className="mt-1 text-sm text-gray-600">Courses you are enrolled in.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No courses enrolled yet</h3>
          <p className="mt-1 text-xs text-gray-500">You will see your courses here once enrolled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div key={c._id} className="bg-white border rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{c.code}</p>
                  {c.description && <p className="text-xs text-gray-600 mt-2">{c.description}</p>}
                  {c.enrolledAt && (
                    <p className="text-xs text-gray-400 mt-2">Enrolled: {new Date(c.enrolledAt).toLocaleDateString()}</p>
                  )}
                </div>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}