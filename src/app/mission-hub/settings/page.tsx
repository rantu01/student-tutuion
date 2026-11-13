"use client";

import { useState } from "react";
import { Settings, Bell, Shield, User, Palette, Database } from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    achievements: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    progressVisible: true,
    achievementsVisible: false
  });

  const [theme, setTheme] = useState("light");

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-black">Settings</h1>
            <p className="text-xs text-gray-600 mt-1">Manage your Mission Hub preferences and account settings</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <Bell className="h-4 w-4 text-blue-600 mr-2" />
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Email Notifications</h3>
                <p className="text-[10px] text-gray-500">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Push Notifications</h3>
                <p className="text-[10px] text-gray-500">Receive real-time updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Weekly Reports</h3>
                <p className="text-[10px] text-gray-500">Get weekly progress summaries</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.weekly}
                  onChange={(e) => setNotifications({...notifications, weekly: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <h2 className="text-sm font-semibold text-gray-900">Privacy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Profile Visibility</h3>
                <p className="text-[10px] text-gray-500">Allow others to see your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.profileVisible}
                  onChange={(e) => setPrivacy({...privacy, profileVisible: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Progress Visibility</h3>
                <p className="text-[10px] text-gray-500">Show your progress to mentors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.progressVisible}
                  onChange={(e) => setPrivacy({...privacy, progressVisible: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <Palette className="h-4 w-4 text-purple-600 mr-2" />
            <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <User className="h-4 w-4 text-orange-600 mr-2" />
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Email</h3>
                <p className="text-[10px] text-gray-500">admin@example.com</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                Change
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Password</h3>
                <p className="text-[10px] text-gray-500">Last changed 30 days ago</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Data & Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <Database className="h-4 w-4 text-red-600 mr-2" />
            <h2 className="text-sm font-semibold text-gray-900">Data & Export</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Export My Data
            </button>
            <button className="w-full flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-xs font-medium text-red-700 hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
