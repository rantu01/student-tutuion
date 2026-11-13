"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, User, Filter, Eye, Users, Calendar, GraduationCap } from "lucide-react";

interface StudentProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  phone: string;
    email: string;
  profilePicture?: string;
  bio?: string;
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
    courseGoal?: string;
  };
    isActive: boolean;
    profileCompleted: boolean;
  completedAt?: string;
    createdAt: string;
  updatedAt: string;
  batches: Array<{
    id: string;
    title: string;
    code: string;
    status: string;
  }>;
  enrollment?: {
  status: string;
  batchId: {
    _id: string;
      title: string;
    code: string;
    };
    invitedAt?: string;
    activatedAt?: string;
  };
}

interface StudentProfileListResponse {
  profiles: StudentProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StudentsPage() {
  const pageSize = 10;
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentProfiles();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchStudentProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/student-profiles?${params}`);
      const data: StudentProfileListResponse = await response.json();

      setProfiles(data.profiles);
      setTotalPages(data.totalPages);
      setTotalStudents(data.total);
    } catch (error) {
      console.error("Error fetching student profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingProfile(profileId);
      const response = await fetch(`/api/student-profiles/${profileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProfiles(profiles?.filter(profile => profile._id !== profileId) || []);
        setTotalStudents(prev => prev - 1);
        } else {
        const error = await response.json();
        alert(`Error deleting student: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    } finally {
      setDeletingProfile(null);
    }
  };

  const getStatusBadge = (profile: StudentProfile) => {
    if (!profile.isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!profile.profileCompleted) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Profile Pending</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const getBatchesDisplay = (profile: StudentProfile) => {
    if (profile.batches.length === 0) {
      return <span className="text-gray-400">No batches</span>;
    }
    
    return (
      <div className="space-y-0.5">
        {profile.batches.slice(0, 2).map((batch, index) => (
          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded mr-0.5">
            {batch.code}
          </span>
        ))}
        {profile.batches.length > 2 && (
          <span className="text-[10px] text-gray-500">
            +{profile.batches.length - 2} more
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (!profiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h1 className="text-lg font-bold text-black">Student Management</h1>
          <p className="mt-1 text-xs text-gray-600">
            Manage and view all enrolled students
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">Total Students:</span>
          <span className="text-xs font-medium text-black">{totalStudents}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">Active:</span>
          <span className="text-xs font-medium text-black">
            {profiles?.filter(p => p.isActive && p.profileCompleted)?.length || 0}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">Pending:</span>
          <span className="text-xs font-medium text-black">
            {profiles?.filter(p => !p.profileCompleted)?.length || 0}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">Enrolled:</span>
          <span className="text-xs font-medium text-black">
            {profiles?.filter(p => p.batches.length > 0)?.length || 0}
          </span>
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
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Profile Pending</option>
              </select>
            </div>

            {/* Clear Filters - Only show when filters are active */}
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Clear</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {(searchTerm ? 1 : 0) + (statusFilter ? 1 : 0)}
                </span>
              </button>
            )}
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/students/invite"
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              <Users className="h-3.5 w-3.5 mr-2" />
              Manage Invitations
            </Link>
            
            <Link
              href="/dashboard/admin/students/enroll"
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Student
            </Link>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter) && (
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
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-50 text-green-700 rounded">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("")}
                  className="hover:bg-green-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove status filter</span>
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

          {/* Students Table */}
      <div className="table-container">
            <div className="table-responsive">
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="table-compact">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Batches</th>
                <th>Enrollment</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
              {profiles?.map((profile) => (
                <tr key={profile._id}>
                  <td>
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                {profile.profilePicture ? (
                                  <img
                                    className="h-8 w-8 rounded-full"
                                    src={profile.profilePicture}
                                    alt={profile.fullName}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-700">
                                      {getInitials(profile.firstName, profile.lastName)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">{profile.fullName}</div>
                                <div className="text-gray-500">{profile.email}</div>
                                <div className="text-gray-400">@{profile.username}</div>
                              </div>
                            </div>
                        </td>
                  <td>
                    {getStatusBadge(profile)}
                  </td>
                  <td>
                    {getBatchesDisplay(profile)}
                        </td>
                  <td>
                    {profile.enrollment ? (
                      <div>
                        <div className="text-gray-900">{profile.enrollment.batchId.code}</div>
                        <div className="text-gray-500">{profile.enrollment.status}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not enrolled</span>
                    )}
                        </td>
                  <td className="text-gray-500">
                    {formatDate(profile.createdAt)}
                        </td>
                  <td className="actions">
                    <div className="flex items-center justify-end space-x-2">
                        <>
                          <Link
                            href={`/dashboard/admin/students/${profile._id}`}
                            className="text-gray-600 hover:text-black"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/admin/students/${profile._id}/edit`}
                            className="text-gray-600 hover:text-black"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProfile(profile._id)}
                            disabled={deletingProfile === profile._id}
                            className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                          </div>
                        </td>
                      </tr>
              ))}
                </tbody>
              </table>
              </div>
            </div>

        {/* Empty State */}
                    {(!profiles || profiles.length === 0) && !loading && (
          <div className="text-center py-8">
            <User className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-xs text-gray-500">
              {searchTerm || statusFilter ? "Try adjusting your search terms." : "Get started by enrolling new students."}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                              <Link
                                href="/dashboard/admin/students/enroll"
                  className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <Plus className="h-4 w-4 mr-2" />
                                Enroll New Students
                              </Link>
                            </div>
                          )}
                        </div>
                            )}
                          </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} results
                          </div>
          <div className="flex space-x-2">
                            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                            >
              Previous
                            </button>
                            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
            >
              Next
                            </button>
          </div>
        </div>
      )}
    </div>
  );
}
