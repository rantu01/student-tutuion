"use client";

import { Settings, Shield, Database, Palette, Bell, Users, ChevronRight, Calendar, Lock, Globe } from "lucide-react";

export default function SettingsPage() {
  const upcomingFeatures = [
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Configure authentication settings, password policies, and data privacy controls."
    },
    {
      icon: Database,
      title: "System Configuration",
      description: "Manage database settings, backup schedules, and system performance optimization."
    },
    {
      icon: Palette,
      title: "Customization",
      description: "Customize the application theme, branding, logos, and user interface elements."
    },
    {
      icon: Bell,
      title: "Notification Settings",
      description: "Configure email notifications, push notifications, and alert preferences."
    },
    {
      icon: Users,
      title: "User Management",
      description: "Set user roles, permissions, access levels, and account management policies."
    },
    {
      icon: Globe,
      title: "Integration Settings",
      description: "Configure third-party integrations, APIs, and external service connections."
    }
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h1 className="text-lg font-bold text-black">System Settings</h1>
          <p className="mt-1 text-xs text-gray-600">
            Configure system preferences, security settings, and application behavior
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-600 mb-6">
            We're building comprehensive system settings to give you full control over 
            your student management system configuration, security, and customization options.
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Expected Release: Q3 2025
          </div>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Upcoming Configuration Options</h3>
        
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

      {/* Current System Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Current System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Database className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-900">Version</h4>
                <p className="text-[10px] text-gray-600">SMS v1.0.0</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-900">Security</h4>
                <p className="text-[10px] text-gray-600">Active</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Lock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-900">Environment</h4>
                <p className="text-[10px] text-gray-600">Production</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <h3 className="text-xs font-medium text-gray-900">Security</h3>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">
            Authentication, authorization, and security policies
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Two-Factor Auth</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Password Policy</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Session Timeout</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-xs font-medium text-gray-900">Appearance</h3>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">
            Themes, branding, and user interface customization
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Theme</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Logo</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Colors</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-xs font-medium text-gray-900">Notifications</h3>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">
            Email alerts, push notifications, and communication settings
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Email Alerts</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Push Notifications</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Frequency</span>
              <span className="text-[10px] text-gray-400">--</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-medium text-purple-900 mb-1">
              Need specific configuration options?
            </h3>
            <p className="text-[10px] text-purple-700 mb-3">
              Let us know what settings are most important for your workflow. Your feedback helps prioritize development.
            </p>
            <button className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
