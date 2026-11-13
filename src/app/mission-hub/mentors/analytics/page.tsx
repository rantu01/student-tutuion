"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Target, ArrowLeft, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useSelectedMission } from '@/hooks/useSelectedMission';

interface MentorAnalytics {
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  role: string;
  status: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  failedStudents: number;
  averageProgress: number;
  studentSuccessRate: number;
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  noShowMeetings: number;
  meetingSuccessRate: number;
  averageResponseTime: number;
  currentWorkload: number;
  maxStudents: number;
  workloadEfficiency: number;
  workloadStatus: string;
  specialization: string[];
  performanceScore: number;
}

interface OverallStats {
  totalMentors: number;
  averageStudentSuccessRate: number;
  averageMeetingSuccessRate: number;
  averagePerformanceScore: number;
  totalStudents: number;
  totalMeetings: number;
}

export default function MentorAnalyticsPage() {
  const { selectedMission, loading: missionLoading } = useSelectedMission();
  const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<MentorAnalytics[]>([]);
  const [mentorsNeedingAttention, setMentorsNeedingAttention] = useState<MentorAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (selectedMission) {
      fetchAnalytics();
    }
  }, [selectedMission, timeRange]);

  const fetchAnalytics = async () => {
    if (!selectedMission) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/analytics?missionId=${selectedMission._id}&timeRange=${timeRange}&type=mentors`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 analytics data to match expected format
          const analyticsData = data.data;
          
          setMentorAnalytics(analyticsData.mentorAnalytics || []);
          setOverallStats(analyticsData.overallStats || {});
          setTopPerformers(analyticsData.topPerformers || []);
          setMentorsNeedingAttention(analyticsData.mentorsNeedingAttention || []);
        }
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary':
        return 'bg-purple-100 text-purple-800';
      case 'secondary':
        return 'bg-blue-100 text-blue-800';
      case 'moderator':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (missionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!selectedMission) {
    return (
      <div className="text-center py-12 text-xs">
        <Target className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission to view analytics.</p>
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
            <h1 className="text-lg font-bold text-black">Mentor Analytics</h1>
            <p className="text-xs text-gray-600 mt-1">Performance metrics for {selectedMission.code} - {selectedMission.title}</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
        </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Total Mentors</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.totalMentors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Avg Success Rate</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.averageStudentSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Meeting Success</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.averageMeetingSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Avg Performance</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.averagePerformanceScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Top Performers</h3>
            <p className="text-[10px] text-gray-600">Mentors with highest performance scores</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topPerformers.map((mentor, index) => (
                <div key={mentor.mentorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      <h4 className="font-semibold text-gray-900">{mentor.mentorName}</h4>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                      {mentor.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Performance Score:</span>
                      <span className={`font-semibold ${getPerformanceColor(mentor.performanceScore)}`}>
                        {mentor.performanceScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{mentor.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">{mentor.studentSuccessRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mentors Needing Attention */}
      {mentorsNeedingAttention.length > 0 && (
        <div className="bg-white rounded-lg border border-red-200">
          <div className="px-4 py-3 border-b border-red-200 bg-red-50">
            <h3 className="text-sm font-semibold text-red-900">Mentors Needing Attention</h3>
            <p className="text-[10px] text-red-800">Mentors with low performance or overloaded status</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {mentorsNeedingAttention.map((mentor) => (
                <div key={mentor.mentorId} className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <h4 className="font-semibold text-gray-900">{mentor.mentorName}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                        {mentor.role}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getPerformanceBgColor(mentor.performanceScore)} ${getPerformanceColor(mentor.performanceScore)}`}>
                      {mentor.performanceScore.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Performance Score: </span>
                      <span className="font-medium">{mentor.performanceScore.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Workload: </span>
                      <span className="font-medium">{mentor.currentWorkload}/{mentor.maxStudents}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <span className="font-medium capitalize">{mentor.workloadStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Detailed Mentor Analytics</h3>
          <p className="text-[10px] text-gray-600">Comprehensive performance metrics for all mentors</p>
        </div>
        
        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Mentor</th>
                <th>Role</th>
                <th>Students</th>
                <th>Success Rate</th>
                <th>Meetings</th>
                <th>Workload</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {mentorAnalytics.map((mentor) => (
                <tr key={mentor.mentorId}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{mentor.mentorName}</div>
                      <div className="text-gray-500">{mentor.mentorEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                      {mentor.role}
                    </span>
                  </td>
                  <td>
                    <div className="text-gray-900">{mentor.totalStudents}</div>
                    <div className="text-[10px] text-gray-500">
                      {mentor.activeStudents} active, {mentor.completedStudents} completed
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-gray-900">{mentor.studentSuccessRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-gray-500">Avg: {mentor.averageProgress.toFixed(1)}%</div>
                  </td>
                  <td>
                    <div className="text-gray-900">{mentor.totalMeetings}</div>
                    <div className="text-[10px] text-gray-500">{mentor.meetingSuccessRate.toFixed(1)}% success</div>
                  </td>
                  <td>
                    <div className="text-gray-900">{mentor.currentWorkload}/{mentor.maxStudents}</div>
                    <div className="text-[10px] text-gray-500">{mentor.workloadEfficiency.toFixed(1)}% capacity</div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getPerformanceBgColor(mentor.performanceScore)} ${getPerformanceColor(mentor.performanceScore)}`}>
                      {mentor.performanceScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



