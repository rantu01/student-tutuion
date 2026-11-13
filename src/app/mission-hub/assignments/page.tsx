"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Users, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Target
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  courseOfferingId: {
    _id: string;
    courseId: { _id: string; title: string; code: string; };
    batchId: { _id: string; title: string; code: string; };
    semesterId: { _id: string; title: string; number: number; };
  };
}

interface Assignment {
  _id: string;
  title: string;
  courseOfferingId: {
    _id: string;
    courseId: { _id: string; title: string; code: string; };
    batchId: { _id: string; title: string; code: string; };
    semesterId: { _id: string; title: string; number: number; };
  };
  publishedAt?: string;
  dueAt?: string;
  maxPoints?: number;
}

interface StudentProgress {
  student: Student;
  assignments: {
    assignment: Assignment;
    status: 'completed' | 'pending' | 'overdue' | 'not_started';
    submittedAt?: string;
    score?: number;
  }[];
  isMissionEnrolled: boolean;
  missionStatus: string;
  missionProgress: number;
  groupInfo?: {
    _id: string;
    name: string;
    description: string;
  } | null;
}


interface Semester {
  _id: string;
  title: string;
  number: number;
}

interface Course {
  _id: string;
  title: string;
  code: string;
}

export default function MissionHubAssignmentsPage() {
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Array<{_id: string, name: string, description: string}>>([]);
  const [summary, setSummary] = useState<{
    totalStudents: number;
    missionEnrolledStudents: number;
    totalAssignments: number;
    totalCompletions: number;
  } | null>(null);

  // Redux hooks
  const selectedMission = useAppSelector(selectSelectedMission);

  useEffect(() => {
    fetchData();
  }, [selectedMission]);

  useEffect(() => {
    fetchFilterData();
  }, [selectedMission]);

  // Separate effect to fetch groups when mission changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (selectedMission && selectedMission._id) {
        try {
          const groupsRes = await fetch(`/api/v2/mentorship-groups?missionId=${selectedMission._id}`);
          if (groupsRes.ok) {
            const groupsData = await groupsRes.json();
            setGroups(groupsData.data || []);
          }
        } catch (error) {
          console.error('Error fetching groups:', error);
        }
      } else {
        setGroups([]);
      }
    };

    fetchGroups();
  }, [selectedMission]);


  const fetchFilterData = async () => {
    try {
      const batchId = selectedMission?.batchId?._id || selectedMission?.batchId;
      if (!batchId) {
        setSemesters([]);
        setCourses([]);
        return;
      }

      // Fetch semesters specific to the mission's batch
      const semestersRes = await fetch(`/api/semesters?batchId=${batchId}`);
      
      if (semestersRes.ok) {
        const semestersData = await semestersRes.json();
        setSemesters(semestersData.data || []);
      }

      // Fetch courses through course offerings for this batch
      const courseOfferingsRes = await fetch(`/api/course-offerings?batchId=${batchId}`);
      
      if (courseOfferingsRes.ok) {
        const courseOfferingsData = await courseOfferingsRes.json();
        const courseOfferings = courseOfferingsData.data || [];
        
        // Extract unique courses from course offerings
        const uniqueCourses = courseOfferings.reduce((acc: any[], offering: any) => {
          if (offering.courseId && !acc.find(course => course._id === offering.courseId._id)) {
            acc.push(offering.courseId);
          }
          return acc;
        }, []);
        
        setCourses(uniqueCourses);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedMission || !selectedMission._id) {
        setError("No mission selected");
        setLoading(false);
        return;
      }

      // Use the new dedicated API endpoint
      const missionId = selectedMission._id.toString();
      const response = await fetch(`/api/v2/missions/${missionId}/assignment-progress`);

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const { assignments, studentProgress, assignmentStats, summary } = data.data;
          
          console.log("Assignment Progress Data:", {
            totalStudents: studentProgress.length,
            totalAssignments: assignments.length,
            assignmentStats,
            summary,
            sampleStudent: studentProgress[0],
            sampleAssignment: assignments[0]
          });
          
          setAssignments(assignments);
          setStudentProgress(studentProgress);
          setSummary(summary);
        } else {
          setError("Failed to load assignment progress data");
        }
      } else {
        setError("Failed to fetch assignment progress data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load student progress data");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentProgress.filter(progress => {
    const student = progress.student;
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = !filterSemester || 
      student.courseOfferingId.semesterId._id === filterSemester;
    
    const matchesCourse = !filterCourse || 
      student.courseOfferingId.courseId._id === filterCourse;

    // Group filtering - check if student is in the selected group
    const matchesGroup = !filterGroup || 
      progress.groupInfo?._id === filterGroup;

    const matches = matchesSearch && matchesSemester && matchesCourse && matchesGroup;

    return matches;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Done';
      case 'overdue':
        return 'Overdue';
      case 'pending':
        return 'Pending';
      default:
        return 'Not Started';
    }
  };

  const getAssignmentCounts = (assignment: Assignment) => {
    const completedCount = filteredStudents.filter(progress => {
      const assignmentProgress = progress.assignments.find(ap => ap.assignment._id === assignment._id);
      return assignmentProgress?.status === 'completed';
    }).length;
    
    const pendingCount = filteredStudents.filter(progress => {
      const assignmentProgress = progress.assignments.find(ap => ap.assignment._id === assignment._id);
      return assignmentProgress?.status === 'pending' || assignmentProgress?.status === 'not_started';
    }).length;

    return { completedCount, pendingCount };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSemester("");
    setFilterCourse("");
    setFilterGroup("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Error Loading Data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-black">Assignment Progress</h1>
              <p className="mt-1 text-xs text-gray-600">
                Track student progress across all assignments
                {selectedMission && (
                  <span className="ml-1 text-blue-600">
                    • {selectedMission.code} - {selectedMission.title}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/admin/assignments"
              className="inline-flex items-center px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 mr-2" />
              Manage Assignments
            </Link>
          </div>
                 </div>

         {/* Summary Stats */}
         {summary && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center">
                 <Users className="w-4 h-4 text-blue-600 mr-2" />
                 <div>
                   <p className="text-xs font-medium text-gray-600">Total Students</p>
                   <p className="text-lg font-bold text-gray-900">{summary.totalStudents}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center">
                 <Target className="w-4 h-4 text-green-600 mr-2" />
                 <div>
                   <p className="text-xs font-medium text-gray-600">Mission Enrolled</p>
                   <p className="text-lg font-bold text-gray-900">{summary.missionEnrolledStudents}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center">
                 <FileText className="w-4 h-4 text-purple-600 mr-2" />
                 <div>
                   <p className="text-xs font-medium text-gray-600">Total Assignments</p>
                   <p className="text-lg font-bold text-gray-900">{summary.totalAssignments}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center">
                 <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
                 <div>
                   <p className="text-xs font-medium text-gray-600">Total Completions</p>
                   <p className="text-lg font-bold text-gray-900">{summary.totalCompletions}</p>
                 </div>
               </div>
             </div>
           </div>
         )}


         {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>


            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.title}
                </option>
              ))}
            </select>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.code})
                </option>
              ))}
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>

            <button
               onClick={clearFilters}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
             >
               Clear Filters
             </button>
          </div>
        </div>



        {/* Progress Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No students found</h3>
            <p className="text-xs text-gray-600 mb-4">
              {searchTerm || filterSemester || filterCourse || filterGroup
                ? "Try adjusting your filters to see more students."
                : "No students are enrolled in the selected courses."}
            </p>

          </div>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table className="table-compact">
                <thead>
                  <tr>
                    <th>
                      Student
                    </th>
                    <th>
                      User ID
                    </th>
                    <th>
                       Email
                     </th>
                    <th>
                       Group
                     </th>
                    {assignments.map((assignment) => {
                      const { completedCount, pendingCount } = getAssignmentCounts(assignment);
                      return (
                        <th key={assignment._id}>
                          <div className="max-w-32">
                            <div className="truncate" title={assignment.title}>
                              {assignment.title}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {assignment.courseOfferingId.courseId.code}
                            </div>
                            <div className="mt-1 flex space-x-2 text-[10px]">
                              <span className="text-green-600 font-semibold">
                                ✓ {completedCount}
                              </span>
                              <span className="text-yellow-600 font-semibold">
                                ⏰ {pendingCount}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((progress) => (
                    <tr key={progress.student._id}>
                      <td>
                         <div className="flex items-center">
                          <div className="flex-shrink-0 h-7 w-7">
                            <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-gray-600" />
                             </div>
                           </div>
                           <div className="ml-4">
                            <div className="font-medium text-gray-900">
                               {progress.student.name}
                             </div>
                            <div className="text-gray-500">
                               {progress.student.courseOfferingId.batchId.title} - {progress.student.courseOfferingId.semesterId.title}
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="text-gray-900">
                        {progress.student.studentId}
                      </td>
                      <td className="text-gray-900">
                        {progress.student.email}
                      </td>
                      <td className="text-gray-900">
                        {progress.groupInfo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                            {progress.groupInfo.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Group</span>
                        )}
                      </td>
                      {progress.assignments.map((assignmentProgress) => (
                        <td key={assignmentProgress.assignment._id}>
                          <div className="flex items-center">
                            {getStatusIcon(assignmentProgress.status)}
                            <span className="ml-2 text-gray-900">
                              {getStatusText(assignmentProgress.status)}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}