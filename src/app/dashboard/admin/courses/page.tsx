"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Filter, Eye, Users, Calendar } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseOffering {
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
    number: number;
    title?: string;
  };
}

interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchCourseOfferings();
  }, [currentPage, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/courses?${params}`);
      const data: CourseListResponse = await response.json();

      setCourses(data.courses || []);
      setTotalPages(Math.max(1, data.totalPages || 1));
      setTotalCourses(Math.max(0, data.total || 0));
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch("/api/course-offerings");
      const data = await response.json();
      setCourseOfferings(data.data || []);
    } catch (error) {
      console.error("Error fetching course offerings:", error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingCourse(courseId);
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCourses(courses.filter(course => course._id && course._id !== courseId));
        setTotalCourses(prev => Math.max(0, prev - 1));
      } else {
        const error = await response.json();
        alert(`Error deleting course: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    } finally {
      setDeletingCourse(null);
    }
  };

  const getCourseOfferingsCount = (courseId: string) => {
    if (!courseOfferings || courseOfferings.length === 0 || !courseId) return 0;
    const count = courseOfferings.filter(offering => offering.courseId?._id === courseId).length;
    return isNaN(count) ? 0 : count;
  };

  const getActiveBatches = (courseId: string) => {
    if (!courseOfferings || courseOfferings.length === 0 || !courseId) return [];
    const offerings = courseOfferings.filter(offering => offering.courseId?._id === courseId);
    const uniqueBatches = new Set(offerings.map(offering => offering.batchId?.title).filter(Boolean));
    return Array.from(uniqueBatches);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
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
            <h1 className="text-lg font-bold text-black">Course Management</h1>
            <p className="mt-1 text-xs text-gray-600">
              Create and manage academic courses
            </p>
          </div>
          <Link
            href="/dashboard/admin/courses/create"
            className="mt-4 sm:mt-0 inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Create Course
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
              <p className="text-xs font-medium text-gray-500">Total Courses</p>
              <p className="text-lg font-bold text-black">{totalCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Offerings</p>
              <p className="text-lg font-bold text-black">{courseOfferings?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Batches</p>
              <p className="text-lg font-bold text-black">
                {(() => {
                  if (!courseOfferings || courseOfferings.length === 0) return 0;
                  const batchIds = courseOfferings
                    .map(offering => offering.batchId?._id)
                    .filter(id => id && id.toString && id.toString().length > 0);
                  return new Set(batchIds).size;
                })()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Semesters</p>
              <p className="text-lg font-bold text-black">
                {(() => {
                  if (!courseOfferings || courseOfferings.length === 0) return 0;
                  const semesterIds = courseOfferings
                    .map(offering => offering.semesterId?._id)
                    .filter(id => id && id.toString && id.toString().length > 0);
                  return new Set(semesterIds).size;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Section: Search */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Clear Search - Only show when search is active */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Clear</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">1</span>
              </button>
            )}
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/course-offerings"
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              <Filter className="h-3.5 w-3.5 mr-2" />
              Manage Offerings
            </Link>
          </div>
        </div>

        {/* Active Filters Display */}
        {searchTerm && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] font-medium text-gray-500">Active filters:</span>
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
          </div>
        )}
      </div>

      {/* Courses Table */}
      {courses && courses.length > 0 && (
        <div className="table-container">
          <div className="table-responsive">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="table-compact">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Offerings</th>
                    <th>Active Batches</th>
                    <th>Created</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    if (!course._id) return null;
                    const offeringsCount = getCourseOfferingsCount(course._id);
                    const activeBatches = getActiveBatches(course._id);
                    return (
                      <tr key={course._id}>
                        <td>
                          <div>
                            <div className="font-medium text-gray-900">{course.title || 'Untitled'}</div>
                            {course.description && (
                              <div className="text-gray-500 truncate max-w-xs">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                            {course.code || 'N/A'}
                          </span>
                        </td>
                        <td className="text-gray-500">
                          {offeringsCount || 0} offering{(offeringsCount || 0) !== 1 ? 's' : ''}
                        </td>
                        <td>
                          <div className="text-gray-900">
                            {activeBatches.length > 0 ? (
                              <div className="space-y-1">
                                {activeBatches.slice(0, 2).map((batch, index) => (
                                  <span key={index} className="inline-block bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded mr-1">
                                    {batch}
                                  </span>
                                ))}
                                {activeBatches.length > 2 && (
                                  <span className="text-[10px] text-gray-500">
                                    +{activeBatches.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No active batches</span>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-500">
                          {course.createdAt ? formatDate(course.createdAt) : 'N/A'}
                        </td>
                        <td className="actions">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/dashboard/admin/courses/${course._id}`}
                              className="text-gray-600 hover:text-black"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/dashboard/admin/courses/${course._id}/edit`}
                              className="text-gray-600 hover:text-black"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => course._id && handleDeleteCourse(course._id)}
                              disabled={deletingCourse === course._id}
                              className="text-gray-600 hover:text-red-600 disabled:opacity-50"
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
        </div>
      )}

      {/* Empty State */}
      {(!courses || courses.length === 0) && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-xs font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-[10px] text-gray-500">
            {searchTerm ? "Try adjusting your search terms." : "Get started by creating a new course."}
          </p>
          {!searchTerm && (
            <div className="mt-4">
              <Link
                href="/dashboard/admin/courses/create"
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Create Course
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && courses && courses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-700">
              Showing {Math.max(1, ((currentPage - 1) * 10) + 1)} to {Math.min(currentPage * 10, totalCourses || 0)} of {totalCourses || 0} results
            </div>
            
            {/* Numbered Pagination */}
            <div className="flex items-center space-x-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              
              {/* Previous */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              
              {/* Page Numbers */}
              {(() => {
                const pages = [];
                const showEllipsis = totalPages > 7;
                
                if (!showEllipsis) {
                  // Show all pages if 7 or fewer
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
                  // Show pages with ellipsis
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
              
              {/* Next */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              
              {/* Last Page */}
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
