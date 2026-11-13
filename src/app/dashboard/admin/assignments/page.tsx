"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, Filter, Eye, Download, Mail, Users, CheckCircle } from "lucide-react";

interface Assignment {
  _id: string;
  courseOfferingId: {
    _id: string;
    courseId: {
      _id: string;
      title: string;
      code: string;
    };
    batchId: {
      _id: string;
      title: string;
      code: string;
    };
    semesterId: {
      _id: string;
      title: string;
      number: number;
    };
  };
  title: string;
  description?: string;
  dueAt?: string;
  publishedAt?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  maxPoints?: number;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completionCount?: number;
  totalSubmissions?: number;
}

interface AssignmentListResponse {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [deletingAssignment, setDeletingAssignment] = useState<string | null>(null);
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "unpublished">("all");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [batches, setBatches] = useState<Array<{_id: string, title: string, code: string}>>([]);
  const [semesters, setSemesters] = useState<Array<{_id: string, title: string, number: number}>>([]);
  const [courses, setCourses] = useState<Array<{_id: string, title: string, code: string}>>([]);

  useEffect(() => {
    fetchAssignments();
  }, [currentPage, searchTerm, filterPublished, filterCourse, filterBatch, filterSemester]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const [batchesRes, semestersRes, coursesRes] = await Promise.all([
        fetch('/api/batches'),
        fetch('/api/semesters'),
        fetch('/api/courses')
      ]);

      const [batchesData, semestersData, coursesData] = await Promise.all([
        batchesRes.json(),
        semestersRes.json(),
        coursesRes.json()
      ]);

      setBatches(batchesData.batches || []);
      setSemesters(semestersData.data || semestersData.semesters || []);
      setCourses(coursesData.courses || []);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(filterPublished !== "all" && { published: filterPublished === "published" ? "true" : "false" }),
        ...(filterCourse && { courseId: filterCourse }),
        ...(filterBatch && { batchId: filterBatch }),
        ...(filterSemester && { semesterId: filterSemester })
      });

      const response = await fetch(`/api/assignments?${params}`);
      const data: AssignmentListResponse = await response.json();

      setAssignments(data.assignments);
      setTotalPages(data.totalPages);
      setTotalAssignments(data.total);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingAssignment(assignmentId);
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAssignments(assignments.filter(assignment => assignment._id !== assignmentId));
        setTotalAssignments(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    } finally {
      setDeletingAssignment(null);
    }
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/publish`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: true }),
      });

      if (response.ok) {
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error publishing assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error publishing assignment:", error);
      alert("Failed to publish assignment");
    }
  };

  const handleUnpublishAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/publish`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: false }),
      });

      if (response.ok) {
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error unpublishing assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error unpublishing assignment:", error);
      alert("Failed to unpublish assignment");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const publishedAt = assignment.publishedAt ? new Date(assignment.publishedAt) : null;

    if (!publishedAt) return { status: "Draft", color: "bg-gray-100 text-gray-800" };
    if (dueDate && now > dueDate) return { status: "Overdue", color: "bg-red-100 text-red-800" };
    if (dueDate && now < dueDate) return { status: "Active", color: "bg-green-100 text-green-800" };
    return { status: "Published", color: "bg-blue-100 text-blue-800" };
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-black">Assignment Management</h1>
            <p className="mt-1 text-xs text-gray-600">
              Create and manage course assignments
            </p>
          </div>
          <Link
            href="/dashboard/admin/assignments/create"
            className="mt-4 sm:mt-0 inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Create Assignment
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Assignments</p>
              <p className="text-lg font-bold text-black">{totalAssignments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Published</p>
              <p className="text-lg font-bold text-black">
                {assignments.filter(a => a.publishedAt).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Draft</p>
              <p className="text-lg font-bold text-black">
                {assignments.filter(a => !a.publishedAt).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Completions</p>
              <p className="text-lg font-bold text-black">
                {assignments.reduce((sum, a) => sum + (a.completionCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Section: Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value as "all" | "published" | "unpublished")}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Draft</option>
              </select>
            </div>

            {/* Batch Filter */}
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.title}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.title}
                </option>
              ))}
            </select>

            {/* Course Filter */}
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.code})
                </option>
              ))}
            </select>

            {/* Clear Filters - Only show when filters are active */}
            {(searchTerm || filterPublished !== "all" || filterBatch || filterSemester || filterCourse) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterPublished("all");
                  setFilterCourse("");
                  setFilterBatch("");
                  setFilterSemester("");
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Clear</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {(searchTerm ? 1 : 0) + (filterPublished !== "all" ? 1 : 0) + (filterBatch ? 1 : 0) + (filterSemester ? 1 : 0) + (filterCourse ? 1 : 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || filterPublished !== "all" || filterBatch || filterSemester || filterCourse) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] font-medium text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-50 text-blue-700 rounded">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:bg-blue-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove search filter</span>
                  ×
                </button>
              </span>
            )}
            {filterPublished !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-50 text-green-700 rounded">
                Status: {filterPublished}
                <button
                  onClick={() => setFilterPublished("all")}
                  className="hover:bg-green-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove status filter</span>
                  ×
                </button>
              </span>
            )}
            {filterBatch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-purple-50 text-purple-700 rounded">
                Batch: {batches.find(b => b._id === filterBatch)?.title || filterBatch}
                <button
                  onClick={() => setFilterBatch("")}
                  className="hover:bg-purple-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove batch filter</span>
                  ×
                </button>
              </span>
            )}
            {filterSemester && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-50 text-orange-700 rounded">
                Semester: {semesters.find(s => s._id === filterSemester)?.title || filterSemester}
                <button
                  onClick={() => setFilterSemester("")}
                  className="hover:bg-orange-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove semester filter</span>
                  ×
                </button>
              </span>
            )}
            {filterCourse && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-pink-50 text-pink-700 rounded">
                Course: {courses.find(c => c._id === filterCourse)?.title || filterCourse}
                <button
                  onClick={() => setFilterCourse("")}
                  className="hover:bg-pink-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove course filter</span>
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <div className="table-responsive">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Points</th>
                  <th>Completions</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);
                  return (
                    <tr key={assignment._id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-gray-500 truncate max-w-xs">
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-gray-900">{assignment.courseOfferingId.courseId.title}</div>
                        <div className="text-gray-500">
                          {assignment.courseOfferingId.batchId.title} - {assignment.courseOfferingId.semesterId.title} - {assignment.courseOfferingId.courseId.code}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {formatDate(assignment.dueAt)}
                      </td>
                      <td className="text-gray-500">
                        {assignment.maxPoints || 100}
                      </td>
                      <td className="text-gray-500">
                        <div className="flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
                          {assignment.completionCount || 0}
                        </div>
                      </td>
                      <td className="actions">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/admin/assignments/${assignment._id}`}
                            className="text-gray-600 hover:text-black"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/admin/assignments/${assignment._id}/edit`}
                            className="text-gray-600 hover:text-black"
                            title="Edit Assignment"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          {assignment.publishedAt && (
                            <Link
                              href={`/dashboard/admin/assignments/${assignment._id}/submit-emails`}
                              className="text-gray-600 hover:text-blue-600"
                              title="Submit Emails"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          {assignment.publishedAt ? (
                            <button
                              onClick={() => handleUnpublishAssignment(assignment._id)}
                              className="text-gray-600 hover:text-yellow-600"
                              title="Unpublish"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublishAssignment(assignment._id)}
                              className="text-gray-600 hover:text-green-600"
                              title="Publish"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAssignment(assignment._id)}
                            disabled={deletingAssignment === assignment._id}
                            className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {assignments.length === 0 && !loading && (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-[10px] text-gray-500">
              {searchTerm || filterPublished !== "all" || filterCourse ? "Try adjusting your search terms." : "Get started by creating a new assignment."}
            </p>
            {!searchTerm && filterPublished === "all" && !filterCourse && (
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/assignments/create"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create Assignment
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalAssignments)} of {totalAssignments} results
            </div>
            
            {/* Numbered Pagination */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              
              {(() => {
                const pages = [];
                const showEllipsis = totalPages > 7;
                
                if (!showEllipsis) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-2 py-1 text-xs border rounded ${
                          i === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                } else {
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);
                  
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-2 py-1 text-xs text-gray-500">
                          ...
                        </span>
                      );
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-2 py-1 text-xs border rounded ${
                          i === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-2 py-1 text-xs text-gray-500">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    );
                  }
                }
                
                return pages;
              })()}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
