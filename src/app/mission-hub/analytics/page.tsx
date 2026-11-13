"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Target, Calendar, Award } from "lucide-react";

interface AnalyticsData {
  totalMissions: number;
  activeMissions: number;
  totalStudents: number;
  totalMentors: number;
  avgProgress: number;
  completionRate: number;
  monthlyStats: {
    month: string;
    missions: number;
    students: number;
    progress: number;
  }[];
  topPerformingMissions: {
    title: string;
    code: string;
    completionRate: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/mission-hub/analytics');
      if (response.ok) {
        const analyticsData = await response.json();
        if (analyticsData.success && analyticsData.data) {
          setData(analyticsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-black">Analytics</h1>
          <p className="text-xs text-gray-600 mt-1">Mission performance insights and metrics</p>
        </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-600">Total Missions</p>
              <p className="text-lg font-bold text-gray-900">{data.totalMissions}</p>
              <p className="text-[10px] text-green-600">+{data.activeMissions} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-600">Total Students</p>
              <p className="text-lg font-bold text-gray-900">{data.totalStudents}</p>
              <p className="text-[10px] text-blue-600">Enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-600">Avg Progress</p>
              <p className="text-lg font-bold text-gray-900">{data.avgProgress}%</p>
              <p className="text-[10px] text-green-600">+5% this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-4 w-4 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-600">Completion Rate</p>
              <p className="text-lg font-bold text-gray-900">{data.completionRate}%</p>
              <p className="text-[10px] text-orange-600">Missions completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Progress Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600 mb-1">{data.avgProgress}%</div>
            <div className="text-xs text-gray-600">Average Student Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${data.avgProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600 mb-1">{data.totalStudents}</div>
            <div className="text-xs text-gray-600">Active Students</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-green-600 mb-1">{data.totalMentors}</div>
            <div className="text-xs text-gray-600">Active Mentors</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Monthly Trends</h2>
        <div className="space-y-4">
          {data.monthlyStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 text-center">
                  <div className="text-xs font-medium text-gray-900">{stat.month}</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Missions</div>
                    <div className="text-lg font-bold text-purple-600">{stat.missions}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Students</div>
                    <div className="text-lg font-bold text-blue-600">{stat.students}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Progress</div>
                    <div className="text-lg font-bold text-green-600">{stat.progress}%</div>
                  </div>
                </div>
              </div>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Missions</h3>
          <div className="space-y-3">
            {data.topPerformingMissions.map((mission, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{mission.title}</div>
                  <div className="text-xs text-gray-500">{mission.completionRate}% completion rate</div>
                </div>
                <div className="text-lg font-bold text-green-600">{mission.completionRate}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-xs">
                <span className="font-medium">5 new students</span> enrolled in Mission Hub
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="text-xs">
                <span className="font-medium">Mission "React Advanced"</span> completed by 12 students
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="text-xs">
                <span className="font-medium">New mentor</span> Sarah Johnson joined the platform
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
