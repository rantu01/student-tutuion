"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, Filter } from "lucide-react";

interface Semester {
  _id: string;
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
  number: 1 | 2 | 3;
  title?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SemesterListResponse {
  data: Semester[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [deletingSemester, setDeletingSemester] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterNumber, setFilterNumber] = useState<"1" | "2" | "3" | "">("");

  useEffect(() => {
    fetchSemesters();
  }, [currentPage, searchTerm, filterBatch, filterNumber]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(filterBatch && { batchId: filterBatch }),
        ...(filterNumber && { number: filterNumber })
      });

      const response = await fetch(`/api/semesters?${params}`);
      const data: SemesterListResponse = await response.json();

      setSemesters(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalSemesters(data.pagination.total);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm("Are you sure you want to delete this semester? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingSemester(semesterId);
      const response = await fetch(`/api/semesters?id=${semesterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSemesters(semesters.filter(semester => semester._id !== semesterId));
        setTotalSemesters(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting semester: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting semester:", error);
      alert("Failed to delete semester");
    } finally {
      setDeletingSemester(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSemesterStatus = (semester: Semester) => {
    const now = new Date();
    const startDate = semester.startDate ? new Date(semester.startDate) : null;
    const endDate = semester.endDate ? new Date(semester.endDate) : null;

    if (!startDate && !endDate) return { status: "Not Scheduled", color: "bg-gray-100 text-gray-800" };
    if (startDate && now < startDate) return { status: "Upcoming", color: "bg-blue-100 text-blue-800" };
    if (endDate && now > endDate) return { status: "Completed", color: "bg-green-100 text-green-800" };
    return { status: "Active", color: "bg-yellow-100 text-yellow-800" };
  };

  if (loading && semesters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading semesters...</p>
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
            <h1 className="text-lg font-bold text-black">Semester Management</h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage academic semesters and their schedules
            </p>
          </div>
          <Link
            href="/dashboard/admin/semesters/create"
            className="mt-4 sm:mt-0 inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Create Semester
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
              <p className="text-xs font-medium text-gray-500">Total Semesters</p>
              <p className="text-lg font-bold text-black">{totalSemesters}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Semesters</p>
              <p className="text-lg font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Active").length}
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
              <p className="text-xs font-medium text-gray-500">Upcoming</p>
              <p className="text-lg font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Upcoming").length}
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
              <p className="text-xs font-medium text-gray-500">Completed</p>
              <p className="text-lg font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Completed").length}
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
                placeholder="Search semesters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Semester Number Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value as "1" | "2" | "3" | "")}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
              </select>
            </div>

            {/* Batch Filter */}
            <input
              type="text"
              placeholder="Filter by batch..."
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 min-w-[160px]"
            />

            {/* Clear Filters - Only show when filters are active */}
            {(searchTerm || filterNumber || filterBatch) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBatch("");
                  setFilterNumber("");
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Clear</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {(searchTerm ? 1 : 0) + (filterNumber ? 1 : 0) + (filterBatch ? 1 : 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || filterNumber || filterBatch) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
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
            {filterNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-50 text-green-700 rounded">
                Semester: {filterNumber}
                <button
                  onClick={() => setFilterNumber("")}
                  className="hover:bg-green-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove semester filter</span>
                  ×
                </button>
              </span>
            )}
            {filterBatch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-purple-50 text-purple-700 rounded">
                Batch: "{filterBatch}"
                <button
                  onClick={() => setFilterBatch("")}
                  className="hover:bg-purple-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove batch filter</span>
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Semesters Table */}
      <div className="table-container">
        <div className="table-responsive">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((semester) => {
                  const status = getSemesterStatus(semester);
                  return (
                    <tr key={semester._id}>
                      <td>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                            {semester.number}
                          </span>
                          <span className="ml-2 font-medium text-gray-900">
                            {semester.title || `Semester ${semester.number}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-gray-900">
                          {semester.batchId?.title || 'Unknown Batch'}
                        </div>
                        <div className="text-gray-500">
                          {semester.batchId?.code || 'Unknown Code'}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {formatDate(semester.startDate)}
                      </td>
                      <td className="text-gray-500">
                        {formatDate(semester.endDate)}
                      </td>
                      <td className="actions">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/admin/semesters/${semester._id}`}
                            className="text-gray-600 hover:text-black"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSemester(semester._id)}
                            disabled={deletingSemester === semester._id}
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

        {/* Empty State */}
        {semesters.length === 0 && !loading && (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No semesters found</h3>
            <p className="mt-1 text-[10px] text-gray-500">
              {searchTerm || filterBatch || filterNumber ? "Try adjusting your search terms." : "Get started by creating a new semester."}
            </p>
            {!searchTerm && !filterBatch && !filterNumber && (
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/semesters/create"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create Semester
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
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalSemesters)} of {totalSemesters} results
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
              
              {/* Page Numbers with ellipsis logic */}
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
