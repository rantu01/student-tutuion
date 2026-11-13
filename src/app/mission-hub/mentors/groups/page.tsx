"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users2, Target, ArrowLeft, Plus, Eye } from 'lucide-react';
import { useSelectedMission } from '@/hooks/useSelectedMission';

interface MentorshipGroup {
  _id: string;
  groupName: string;
  description?: string;
  mentors: Array<{
    mentorId: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  students: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  status: 'active' | 'inactive';
  currentStudentCount: number;
}

export default function MentorshipGroupsPage() {
  const { selectedMission, loading: missionLoading } = useSelectedMission();
  const [groups, setGroups] = useState<MentorshipGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedMission) {
      fetchMentorshipGroups();
    }
  }, [selectedMission]);

  const fetchMentorshipGroups = async () => {
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
      } else {
        setError('Failed to fetch mentorship groups');
      }
    } catch (error) {
      console.error('Failed to fetch mentorship groups:', error);
      setError('Failed to fetch mentorship groups');
    } finally {
      setLoading(false);
    }
  };

  if (missionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (!selectedMission) {
    return (
      <div className="text-center py-12 text-xs">
        <Target className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission to view mentorship groups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/mission-hub/mentors"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors text-xs"
          >
            <ArrowLeft size={12} className="mr-1.5" />
            Back to Mentors
          </Link>
          <div>
            <h1 className="text-lg font-bold text-black">Mentor Groups</h1>
            <p className="text-xs text-gray-600 mt-0.5">Mentor groups for {selectedMission.code} - {selectedMission.title}</p>
          </div>
        </div>
        <Link
          href="/mission-hub/mentors/groups/create"
          className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus size={12} className="mr-1.5" />
          Create New Group
        </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">⚠️</div>
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Mentor Groups ({groups.length})</h3>
        </div>
        
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Groups Created</h3>
            <p className="text-xs text-gray-600 mb-2">No mentor groups have been created for this mission yet.</p>
            <Link
              href="/mission-hub/mentors/groups/create"
              className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus size={12} className="mr-1.5" />
              Create First Group
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groups.map((group) => (
              <div key={group._id} className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{group.groupName}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Description */}
                    {group.description && (
                      <p className="text-xs text-gray-600 mb-2">{group.description}</p>
                    )}

                    {/* Capacity */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Users2 size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {group.currentStudentCount} students
                        </span>
                      </div>
                    </div>

                    {/* Mentors */}
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-gray-700 mb-1.5">Mentors ({group.mentors.length})</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {group.mentors.map((mentor, index) => (
                          <div key={index} className="flex items-center space-x-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                            <span className="text-xs text-gray-700">{mentor.mentorId.name}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                              {mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Students */}
                    {group.students.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-1.5">Students ({group.students.length})</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {group.students.map((student) => (
                            <div key={student._id} className="flex items-center space-x-1.5 p-1.5 bg-gray-50 rounded-lg">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">{student.name}</span>
                              <span className="text-[10px] text-gray-500">({student.email})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1.5 ml-3">
                    <Link
                      href={`/mission-hub/mentors/groups/${group._id}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
