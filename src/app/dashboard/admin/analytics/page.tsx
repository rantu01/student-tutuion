"use client";

import { BarChart3, TrendingUp, Users, BookOpen, Calendar, ChevronRight } from "lucide-react";

export default function AnalyticsPage() {
  const upcomingFeatures = [
    {
      icon: BarChart3,
      title: "Student Performance Analytics",
      description: "Track student progress, completion rates, and performance trends across courses and assignments."
    },
    {
      icon: TrendingUp,
      title: "Engagement Metrics",
      description: "Monitor student engagement, participation rates, and learning activity patterns."
    },
    {
      icon: Users,
      title: "Batch Comparisons",
      description: "Compare performance metrics between different batches and identify improvement opportunities."
    },
    {
      icon: BookOpen,
      title: "Course Analytics",
      description: "Detailed insights into course effectiveness, completion rates, and student feedback."
    },
    {
      icon: Calendar,
      title: "Time-based Reports",
      description: "Generate reports based on time periods, semesters, and academic calendars."
    }
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h1 className="text-lg font-bold text-black">Analytics Dashboard</h1>
          <p className="mt-1 text-xs text-gray-600">
            Comprehensive analytics and reporting for student management
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-600 mb-6">
            We're building powerful analytics tools to help you track student progress, 
            monitor engagement, and make data-driven decisions for your educational programs.
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Expected Release: Q2 2025
          </div>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Upcoming Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFeatures.map((feature, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <feature.icon className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-gray-900 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Reports</p>
              <p className="text-lg font-bold text-gray-300">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Avg Performance</p>
              <p className="text-lg font-bold text-gray-300">--%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Active Students</p>
              <p className="text-lg font-bold text-gray-300">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Completion Rate</p>
              <p className="text-lg font-bold text-gray-300">--%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-medium text-blue-900 mb-1">
              Want to be notified when Analytics is ready?
            </h3>
            <p className="text-[10px] text-blue-700 mb-3">
              Get early access to powerful analytics features and help shape the development process.
            </p>
            <button className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
