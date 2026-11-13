"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Users, Calendar } from "lucide-react";

interface Batch {
  _id: string;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

interface BatchListResponse {
  batches: Batch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBatches, setTotalBatches] = useState(0);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, [currentPage, searchTerm]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/batches?${params}`);
      const data: BatchListResponse = await response.json();

      console.log('Batches API response:', data);
      console.log('Batches data:', data.batches);
      console.log('Total batches:', data.total);

      setBatches(data.batches || []);
      setTotalPages(data.totalPages);
      setTotalBatches(data.total);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setBatches(null);
      setTotalPages(1);
      setTotalBatches(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingBatch(batchId);
      const response = await fetch(`/api/batches/${batchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBatches(batches?.filter(batch => batch._id !== batchId) || null);
        setTotalBatches(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting batch: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch");
    } finally {
      setDeletingBatch(null);
    }
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
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  if (!batches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
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
            <h1 className="text-lg font-bold text-black">Batch Management</h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage student batches and their enrollment
            </p>
          </div>
          <Link
            href="/dashboard/admin/batches/create"
            className="mt-4 sm:mt-0 inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Create Batch
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Batches</p>
              <p className="text-lg font-bold text-black">{totalBatches}</p>
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
              <p className="text-lg font-bold text-black">{batches?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Students</p>
              <p className="text-lg font-bold text-black">
                {batches?.reduce((sum, batch) => sum + (batch.studentCount || 0), 0) || 0}
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
                placeholder="Search batches..."
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

      {/* Batches Table */}
      <div className="table-container">
        <div className="table-responsive">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Batch Code</th>
                  <th>Title</th>
                  <th>Students</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches?.map((batch) => (
                  <tr key={batch._id}>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                        {batch.code}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {batch.title}
                      </div>
                    </td>
                    <td>
                      <div className="text-gray-900">
                        {batch.studentCount || 0} students
                      </div>
                    </td>
                    <td className="text-gray-500">
                      {formatDate(batch.createdAt)}
                    </td>
                    <td className="text-gray-500">
                      {formatDate(batch.updatedAt)}
                    </td>
                    <td className="actions">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/batches/${batch._id}`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBatch(batch._id)}
                          disabled={deletingBatch === batch._id}
                          className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {(!batches || batches.length === 0) && !loading && (
          <div className="text-center py-8">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No batches found</h3>
            <p className="mt-1 text-[10px] text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "Get started by creating a new batch."}
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/batches/create"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create Batch
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
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalBatches)} of {totalBatches} results
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
