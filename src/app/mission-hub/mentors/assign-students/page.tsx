"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus2, Target, ArrowLeft, Users, UserCheck2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useSelectedMission } from '@/hooks/useSelectedMission';

interface User {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  role: string;
}

interface MissionMentor {
  _id: string;
  mentorId: {
    _id: string;
    name: string;
    email: string;
  };
  role: 'primary' | 'secondary' | 'moderator';
  maxStudents: number;
  currentWorkload: number;
  status: 'active' | 'inactive' | 'overloaded';
}

interface MentorshipGroup {
  _id: string;
  groupName: string;
  maxStudents?: number;
  currentStudentCount: number;
  status: 'active' | 'inactive';
}

export default function AssignStudentsPage() {
  const { selectedMission, loading: missionLoading } = useSelectedMission();
  const [mentors, setMentors] = useState<MissionMentor[]>([]);
  const [groups, setGroups] = useState<MentorshipGroup[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [assignmentType, setAssignmentType] = useState<'mentor' | 'group'>('mentor');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPrimaryMentor, setIsPrimaryMentor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedMission) {
      fetchMentors();
      fetchGroups();
      fetchStudents();
    }
  }, [selectedMission]);

  const fetchMentors = async () => {
    if (!selectedMission) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mission-mentors?missionId=${selectedMission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedMentors = data.data.map((mentor: any) => ({
            _id: mentor._id,
            mentorId: {
              _id: mentor.mentorId._id,
              name: mentor.mentorId.name,
              email: mentor.mentorId.email
            },
            role: mentor.role,
            maxStudents: mentor.maxStudents,
            currentWorkload: mentor.currentStudents || 0,
            status: mentor.status
          }));
          setMentors(transformedMentors);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!selectedMission) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mentorship-groups?missionId=${selectedMission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedGroups = data.data.map((group: any) => ({
            _id: group._id,
            groupName: group.name,
            description: group.description,
            mentors: group.mentors?.map((mentorId: any) => ({
              mentorId: {
                _id: mentorId._id,
                name: mentorId.name,
                email: mentorId.email
              },
              role: 'primary' // Default role, could be enhanced
            })) || [],
            students: group.students?.map((studentId: any) => ({
              _id: studentId._id,
              name: studentId.name,
              email: studentId.email
            })) || [],
            status: group.status,
            currentStudentCount: group.students?.length || 0
          }));
          setGroups(transformedGroups);
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedMission) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mission-students?missionId=${selectedMission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedStudents = data.data.map((student: any) => ({
            _id: student._id,
            name: student.studentId?.name || 'Unknown',
            email: student.studentId?.email || 'Unknown',
            studentId: student.studentId?.studentId || 'Unknown',
            role: 'student'
          }));
          setStudents(transformedStudents);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (assignmentType === 'mentor' && !selectedMentor) {
      setError('Please select a mentor');
      return;
    }

    if (assignmentType === 'group' && !selectedGroup) {
      setError('Please select a group');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (assignmentType === 'mentor') {
        // Use V2 API for mentor assignment
        response = await fetch('/api/v2/mission-mentors/assign-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            missionId: mission?._id,
            mentorId: selectedMentor,
            studentIds: selectedStudents,
            isPrimaryMentor
          }),
        });
      } else {
        // Use V2 API for group assignment
        response = await fetch('/api/v2/mentorship-groups/assign-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: selectedGroup,
            studentIds: selectedStudents,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`Successfully assigned ${selectedStudents.length} student(s)`);
          setSelectedStudents([]);
          setSelectedMentor('');
          setSelectedGroup('');
          setIsPrimaryMentor(false);
          
          // Refresh data
          fetchMentors();
          fetchGroups();
        } else {
          setError(data.message || 'Failed to assign students');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Failed to assign students:', error);
      setError('Failed to assign students');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableStudents = () => {
    return students.filter(student => 
      student.role === 'student' && 
      !selectedStudents.includes(student._id)
    );
  };

  const getSelectedStudentsInfo = () => {
    return students.filter(student => selectedStudents.includes(student._id));
  };

  if (missionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedMission) {
    return (
      <div className="text-center py-12 text-xs">
        <Target className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission to assign students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/mission-hub/mentors"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Mentors
          </Link>
          <div>
            <h1 className="text-lg font-bold text-black">Assign Students</h1>
            <p className="text-xs text-gray-600 mt-1">Assign students to mentors or groups in {selectedMission.code} - {selectedMission.title}</p>
          </div>
        </div>
        </div>
      </div>

      {/* Error/Success Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-800">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assignment Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assignment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Assignment Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="mentor"
                    checked={assignmentType === 'mentor'}
                    onChange={(e) => setAssignmentType(e.target.value as 'mentor' | 'group')}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700">Individual Mentor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="group"
                    checked={assignmentType === 'group'}
                    onChange={(e) => setAssignmentType(e.target.value as 'mentor' | 'group')}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700">Mentorship Group</span>
                </label>
              </div>
            </div>

            {/* Mentor Selection */}
            {assignmentType === 'mentor' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Select Mentor
                  </label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Choose a mentor...</option>
                    {mentors
                      .filter(mentor => mentor.status === 'active')
                      .map(mentor => (
                        <option key={mentor._id} value={mentor._id}>
                          {mentor.mentorId.name} ({mentor.role}) - {mentor.currentWorkload}/{mentor.maxStudents} students
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrimaryMentor"
                    checked={isPrimaryMentor}
                    onChange={(e) => setIsPrimaryMentor(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isPrimaryMentor" className="text-xs text-gray-700">
                    Set as primary mentor for these students
                  </label>
                </div>
              </>
            )}

            {/* Group Selection */}
            {assignmentType === 'group' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choose a group...</option>
                  {groups
                    .filter(group => group.status === 'active')
                    .map(group => (
                      <option key={group._id} value={group._id}>
                        {group.groupName} - {group.currentStudentCount}/{group.maxStudents || '∞'} students
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || selectedStudents.length === 0}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Assigning...' : `Assign ${selectedStudents.length} Student(s)`}
            </button>
          </form>
        </div>

        {/* Student Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Students</h3>
          
          {/* Selected Students */}
          {selectedStudents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Selected Students ({selectedStudents.length})
              </h4>
              <div className="space-y-2">
                {getSelectedStudentsInfo().map(student => (
                  <div key={student._id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div>
                      <span className="text-xs font-medium text-gray-900">{student.name}</span>
                      <span className="text-[10px] text-gray-500 ml-2">({student.studentId || student.email})</span>
                    </div>
                    <button
                      onClick={() => handleStudentToggle(student._id)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Students */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Available Students ({getAvailableStudents().length})
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {getAvailableStudents().map(student => (
                <label key={student._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => handleStudentToggle(student._id)}
                    className="mr-2"
                  />
                  <div>
                    <span className="text-xs font-medium text-gray-900">{student.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">({student.studentId || student.email})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Summary */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <UserCheck2 className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-medium text-blue-900">Assignment Summary</h4>
          </div>
          <p className="text-xs text-blue-800">
            Ready to assign {selectedStudents.length} student(s) to{' '}
            {assignmentType === 'mentor' 
              ? mentors.find(m => m._id === selectedMentor)?.mentorId.name || 'selected mentor'
              : groups.find(g => g._id === selectedGroup)?.groupName || 'selected group'
            }
            {isPrimaryMentor && assignmentType === 'mentor' && ' as primary mentor'}
          </p>
        </div>
      )}
    </div>
  );
}
