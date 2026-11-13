"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Filter, Eye, Users, Calendar, Link as LinkIcon, RefreshCw, Settings } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
}

interface Batch {
  _id: string;
  title: string;
  code: string;
}

interface Semester {
  _id: string;
  number: number;
  title?: string;
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
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
  createdAt?: string;
  updatedAt?: string;
}

interface GroupedCourseOfferings {
  course: Course;
  offerings: CourseOffering[];
}

export default function CourseOfferingsPage() {
  const router = useRouter();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting to fetch data...");
      
      const [offeringsRes, coursesRes, batchesRes, semestersRes] = await Promise.all([
        fetch("/api/course-offerings"),
        fetch("/api/courses?limit=100"),
        fetch("/api/batches?limit=100"),
        fetch("/api/semesters?limit=100")
      ]);

      console.log("API responses received:", {
        offeringsStatus: offeringsRes.status,
        coursesStatus: coursesRes.status,
        batchesStatus: batchesRes.status,
        semestersStatus: semestersRes.status
      });

      // Check for API errors
      if (!offeringsRes.ok) {
        console.error("Course offerings API error:", offeringsRes.status, offeringsRes.statusText);
      }
      if (!coursesRes.ok) {
        console.error("Courses API error:", coursesRes.status, coursesRes.statusText);
      }
      if (!batchesRes.ok) {
        console.error("Batches API error:", batchesRes.status, batchesRes.statusText);
      }
      if (!semestersRes.ok) {
        console.error("Semesters API error:", semestersRes.status, semestersRes.statusText);
      }

      const offeringsData = await offeringsRes.json();
      const coursesData = await coursesRes.json();
      const batchesData = await batchesRes.json();
      const semestersData = await semestersRes.json();

      console.log("Fetched data:", {
        offerings: offeringsData,
        courses: coursesData,
        batches: batchesData,
        semesters: semestersData
      });

      // Course Offerings API returns { data: data }
      setCourseOfferings(offeringsData.data || []);
      setCourses(coursesData.courses || []);
      setBatches(batchesData.batches || []);
      setSemesters(semestersData.data || []);
      
      console.log("Data set successfully:", {
        courseOfferingsCount: offeringsData.data?.length || 0,
        coursesCount: coursesData.courses?.length || 0,
        batchesCount: batchesData.batches?.length || 0,
        semestersCount: semestersData.data?.length || 0
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Group offerings by course - FIXED: One course can have multiple offerings
  const getGroupedOfferings = (): GroupedCourseOfferings[] => {
    if (!courseOfferings || courseOfferings.length === 0) {
      return [];
    }

    // Create a map to group offerings by course
    const groupedMap = new Map<string, GroupedCourseOfferings>();

    courseOfferings.forEach((offering) => {
      // Skip offerings with missing critical data
      if (!offering || !offering._id) {
        return;
      }

      // Get course info
      let course: Course | null = null;
      if (offering.courseId && offering.courseId._id) {
        course = offering.courseId;
      } else {
        // Try to find course by ID from courses array
        course = courses.find(c => c._id === offering.courseId?._id) || null;
      }

      if (!course) {
        return; // Skip if no valid course found
      }

      const courseId = course._id;
      
      if (!groupedMap.has(courseId)) {
        groupedMap.set(courseId, {
          course: course,
          offerings: []
        });
      }

      // Add offering if it has valid batch and semester data
      if (offering.batchId && offering.batchId._id && offering.semesterId && offering.semesterId._id) {
        groupedMap.get(courseId)!.offerings.push(offering);
      }
    });

    return Array.from(groupedMap.values());
  };

  const getFilteredGroupedOfferings = () => {
    let grouped = getGroupedOfferings();

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      grouped = grouped.filter(group => {
        if (!group.course) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          (group.course.title && group.course.title.toLowerCase().includes(searchLower)) ||
          (group.course.code && group.course.code.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply batch filter
    if (filterBatch && filterBatch.trim()) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => 
          offering.batchId && offering.batchId._id === filterBatch
        )
      })).filter(group => group.offerings.length > 0);
    }

    // Apply semester filter
    if (filterSemester && filterSemester.trim()) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => 
          offering.semesterId && offering.semesterId._id === filterSemester
        )
      })).filter(group => group.offerings.length > 0);
    }

    return grouped;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterBatch("");
    setFilterSemester("");
  };

  const handleManageCourse = (course: Course) => {
    if (course && course._id) {
      router.push(`/dashboard/admin/course-offerings/${course._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course offerings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const groupedOfferings = getFilteredGroupedOfferings();

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-black">Course Offerings Management</h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage course offerings grouped by course
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/dashboard/admin/course-offerings/create"
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Create Offering
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <LinkIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Offerings</p>
              <p className="text-lg font-bold text-black">{courseOfferings?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Courses</p>
              <p className="text-lg font-bold text-black">{groupedOfferings?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Batches</p>
              <p className="text-lg font-bold text-black">
                {batches && batches.length > 0 ? batches.length : 0}
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
              <p className="text-xs font-medium text-gray-500">Active Semesters</p>
              <p className="text-lg font-bold text-black">
                {semesters && semesters.length > 0 ? semesters.length : 0}
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
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Batch Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
              >
                <option value="">All Batches</option>
                {batches && batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.code} - {batch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
            >
              <option value="">All Semesters</option>
              {semesters && semesters
                .filter(semester => semester && semester.batchId && semester.batchId.code)
                .map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {semester.batchId?.code || 'Unknown'} - Semester {semester.number}
                  </option>
                ))}
            </select>

            {/* Clear Filters - Only show when filters are active */}
            {(searchTerm || filterBatch || filterSemester) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Clear</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {(searchTerm ? 1 : 0) + (filterBatch ? 1 : 0) + (filterSemester ? 1 : 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || filterBatch || filterSemester) && (
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
            {filterBatch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-50 text-green-700 rounded">
                Batch: {batches.find(b => b._id === filterBatch)?.code || filterBatch}
                <button
                  onClick={() => setFilterBatch("")}
                  className="hover:bg-green-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove batch filter</span>
                  ×
                </button>
              </span>
            )}
            {filterSemester && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-purple-50 text-purple-700 rounded">
                Semester: {semesters.find(s => s._id === filterSemester)?.number || filterSemester}
                <button
                  onClick={() => setFilterSemester("")}
                  className="hover:bg-purple-100 rounded p-0.5 text-[9px]"
                >
                  <span className="sr-only">Remove semester filter</span>
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Course Offerings Table */}
      <div className="table-container">
        <div className="table-responsive">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Offerings</th>
                  <th>Total Offerings</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedOfferings && groupedOfferings.length > 0 ? (
                  groupedOfferings.map((group) => (
                    <tr key={group.course?._id || `group-${Math.random()}`}>
                      <td>
                        <div>
                          {group.course ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {group.course.title || 'Unknown Course'}
                              </div>
                              <div className="text-gray-500">
                                {group.course.code || 'Unknown Code'}
                              </div>
                              {group.course.description && (
                                <div className="text-gray-400 mt-1">{group.course.description}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-red-600">Invalid Course Data</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {group.offerings && group.offerings.length > 0 ? (
                            group.offerings.map((offering) => (
                              <div key={offering._id} className="flex items-center space-x-2">
                                <span className="text-gray-900">
                                  {offering.batchId?.code || 'Unknown Batch'}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                  Semester {offering.semesterId?.number || 'Unknown'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">No offerings</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                          {group.offerings?.length || 0} offering{(group.offerings?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="actions">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => group.course && handleManageCourse(group.course)}
                            disabled={!group.course}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Manage offerings"
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500">
                      No course offerings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {(!groupedOfferings || groupedOfferings.length === 0) && (
          <div className="text-center py-8">
            <LinkIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No course offerings found</h3>
            <p className="mt-1 text-[10px] text-gray-500">
              {searchTerm || filterBatch || filterSemester ? "Try adjusting your search terms." : "Get started by creating a new course offering."}
            </p>
            {!searchTerm && !filterBatch && !filterSemester && (
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/course-offerings/create"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create Offering
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
