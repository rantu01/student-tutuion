"use client";

import { Mail, Send, Users, FileText, Calendar, ChevronRight, Bell, MessageSquare } from "lucide-react";

export default function EmailPage() {
  const upcomingFeatures = [
    {
      icon: Send,
      title: "Bulk Email Campaigns",
      description: "Send newsletters, announcements, and updates to students, batches, or specific groups."
    },
    {
      icon: FileText,
      title: "Email Templates",
      description: "Pre-built templates for common communications like welcome emails, reminders, and notifications."
    },
    {
      icon: Users,
      title: "Audience Segmentation",
      description: "Target specific student groups based on batch, course, performance, or custom criteria."
    },
    {
      icon: Bell,
      title: "Automated Notifications",
      description: "Set up automatic emails for assignment deadlines, grade releases, and important events."
    },
    {
      icon: MessageSquare,
      title: "Email Analytics",
      description: "Track open rates, click-through rates, and engagement metrics for your email campaigns."
    }
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h1 className="text-lg font-bold text-black">Email Management</h1>
          <p className="mt-1 text-xs text-gray-600">
            Comprehensive email communication tools for students and staff
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-600 mb-6">
            We're developing a comprehensive email management system to streamline 
            communication with students, send bulk notifications, and track engagement.
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Expected Release: Q1 2025
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
              <Send className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Emails Sent</p>
              <p className="text-lg font-bold text-gray-300">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Recipients</p>
              <p className="text-lg font-bold text-gray-300">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Open Rate</p>
              <p className="text-lg font-bold text-gray-300">--%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Templates</p>
              <p className="text-lg font-bold text-gray-300">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Email Templates Preview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg mb-3 inline-block">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Assignment Reminder</h4>
            <p className="text-[10px] text-gray-500">Automated reminders for upcoming deadlines</p>
          </div>
          
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg mb-3 inline-block">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Welcome Email</h4>
            <p className="text-[10px] text-gray-500">Onboarding emails for new students</p>
          </div>
          
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg mb-3 inline-block">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Newsletter</h4>
            <p className="text-[10px] text-gray-500">Regular updates and announcements</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-4 w-4 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-medium text-green-900 mb-1">
              Need email functionality now?
            </h3>
            <p className="text-[10px] text-green-700 mb-3">
              Contact our support team to discuss interim solutions and get priority access when the email system launches.
            </p>
            <button className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
