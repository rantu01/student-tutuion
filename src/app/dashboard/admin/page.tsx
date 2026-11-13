"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalMissions: number;
  activeMissions: number;
  totalBatches: number;
  totalAssignments: number;
  pendingAssignments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalMissions: 0,
    activeMissions: 0,
    totalBatches: 0,
    totalAssignments: 0,
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [studentsRes, coursesRes, missionsRes, batchesRes, assignmentsRes] = await Promise.all([
        fetch('/api/students?limit=1'),
        fetch('/api/courses?limit=1'),
        fetch('/api/v2/missions?status=active&limit=1'),
        fetch('/api/batches?limit=1'),
        fetch('/api/assignments?limit=1')
      ]);

      const studentsData = await studentsRes.json();
      const coursesData = await coursesRes.json();
      const missionsData = await missionsRes.json();
      const batchesData = await batchesRes.json();
      const assignmentsData = await assignmentsRes.json();

      const totalStudents = typeof studentsData?.pagination?.total === 'number'
        ? studentsData.pagination.total
        : (studentsData?.total || (Array.isArray(studentsData?.data) ? studentsData.data.length : 0));

      const totalCourses = typeof coursesData?.total === 'number'
        ? coursesData.total
        : (Array.isArray(coursesData?.courses) ? coursesData.courses.length : 0);

      const activeMissions = typeof missionsData?.pagination?.total === 'number'
        ? missionsData.pagination.total
        : (Array.isArray(missionsData?.data) ? missionsData.data.filter((m: any) => m.status === 'active').length : 0);

      const totalBatches = batchesData?.total || 0;
      const totalAssignments = assignmentsData?.total || 0;
      const pendingAssignments = Array.isArray(assignmentsData?.assignments)
        ? assignmentsData.assignments.filter((a: any) => !a.submitted && !a.publishedAt).length
        : 0;

      setStats({
        totalStudents,
        totalCourses,
        totalMissions: activeMissions, // not shown; keep for completeness
        activeMissions,
        totalBatches,
        totalAssignments,
        pendingAssignments
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    // {
    //   name: "Create Mission",
    //   description: "Start a new mission for students",
    //   href: "/dashboard/admin/missions/create",
    // },
    {
      name: "Manage Batches",
      description: "View and manage student batches",
      href: "/dashboard/admin/batches",
    },
    {
      name: "Manage Semesters",
      description: "View and manage academic semesters",
      href: "/dashboard/admin/semesters",
    },
    {
      name: "Manage Courses",
      description: "Create and manage academic courses",
      href: "/dashboard/admin/courses",
    },
    // {
    //   name: "Seed Demo Data",
    //   description: "Populate database with demo data for testing",
    //   href: "/seed-demo-data",
    // }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-black">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your Student Management System</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Students</p>
          <p className="text-lg font-bold text-black">{stats.totalStudents}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Courses</p>
          <p className="text-lg font-bold text-black">{stats.totalCourses}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Active Missions</p>
          <p className="text-lg font-bold text-black">{stats.activeMissions}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Pending Assignments</p>
          <p className="text-lg font-bold text-black">{stats.pendingAssignments}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <p className="text-xs font-semibold text-black mb-1">
                {action.name}
              </p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Missions */}
        {/* <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Missions</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/missions"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Missions
            </Link>
            <Link
              href="/dashboard/admin/missions/create"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Create New Mission
            </Link>
          </div>
        </div> */}

        {/* Batches */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Batches</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/batches"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Batches
            </Link>
            <Link
              href="/dashboard/admin/batches/create"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Create New Batch
            </Link>
          </div>
        </div>

        {/* Semesters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Semesters</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/semesters"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Semesters
            </Link>
            <Link
              href="/dashboard/admin/semesters/create"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Create New Semester
            </Link>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Courses</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/courses"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Courses
            </Link>
            <Link
              href="/dashboard/admin/courses/create"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Create New Course
            </Link>
            <Link
              href="/dashboard/admin/course-offerings"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Manage Offerings
            </Link>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Assignments</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/assignments"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Assignments
            </Link>
            <Link
              href="/dashboard/admin/assignments/create"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Create New Assignment
            </Link>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Students</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/admin/students"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              View All Students
            </Link>
            <Link
              href="/dashboard/admin/students/enroll"
              className="block text-xs text-gray-600 hover:text-gray-900 py-1"
            >
              Enroll New Student
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
