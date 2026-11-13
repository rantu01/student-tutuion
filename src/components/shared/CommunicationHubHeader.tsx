"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  MessageSquare,
  Sparkles,
  FileText,
  Target,
  RefreshCw,
  Sliders
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import {
  selectMissions,
  selectSelectedMission,
  selectMissionsLoading,
  selectMissionsError,
  fetchMissions,
  setSelectedMission
} from "@/store/missionHubSlice";

interface CommunicationHubHeaderProps {
  user: any;
}

export default function CommunicationHubHeader({ user }: CommunicationHubHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mission selector (match Mission Hub behavior)
  const dispatch = useAppDispatch();
  const missions = useAppSelector(selectMissions);
  const selectedMission = useAppSelector(selectSelectedMission);
  const loading = useAppSelector(selectMissionsLoading);
  const error = useAppSelector(selectMissionsError);

  useEffect(() => {
    dispatch(fetchMissions());
  }, [dispatch]);

  const handleMissionChange = (missionId: string) => {
    const mission = missions.find(m => m._id === missionId);
    dispatch(setSelectedMission(mission || null));
  };


  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close notifications dropdown
      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      
      // Close profile dropdown
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isNotificationsOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNotificationsOpen, isProfileOpen]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-1.5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          {/* Left - Quick Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link href="/" className="px-2 py-1 rounded-full text-xs text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black">Home</Link>
            <Link href="/mission-hub" className="px-2 py-1 rounded-full text-xs text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black">Mission Hub</Link>
            <Link href="/dashboard" className="px-2 py-1 rounded-full text-xs text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-black">Dashboard</Link>
          </div>

          {/* Center spacer */}
          <div className="flex-1"></div>

          {/* Right side - Mission selector, Actions, Profile */}
          <div className="flex items-center space-x-1 flex-wrap justify-end">
            {/* Mission selector next to profile */}
            <div className="flex items-center space-x-1 min-w-0">
              <Target className="w-3 h-3 text-gray-500" />
              {loading ? (
                <div className="text-xs text-gray-500 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Loading...
                </div>
              ) : error ? (
                <div className="text-xs text-red-600">{error}</div>
              ) : (
                <select
                  value={selectedMission?._id || ""}
                  onChange={(e) => handleMissionChange(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white max-w-full"
                >
                  {missions.map((mission) => (
                    <option key={mission._id} value={mission._id}>
                      {mission.code} - {mission.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Manage Channels Button (only for moderators) */}
            {['admin', 'developer', 'manager', 'sre', 'mentor'].includes(user?.role?.toLowerCase()) && (
              <Link
                href="/mission-communication-hub/channels/manage"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-black transition-all"
                title="Manage Channels"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Manage Channels</span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="ui-label">Notifications</h3>
                    <p className="body-caption">You have 3 new notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="ui-label">New Communication Post</p>
                          <p className="body-caption mt-1">New announcement posted in General</p>
                          <p className="body-caption mt-1 text-gray-400">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Sparkles className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="ui-label">Guideline Updated</p>
                          <p className="body-caption mt-1">New coding guidelines published</p>
                          <p className="body-caption mt-1 text-gray-400">4 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="ui-label">New Document Shared</p>
                          <p className="body-caption mt-1">Project requirements document uploaded</p>
                          <p className="body-caption mt-1 text-gray-400">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Link
                      href="/notifications"
                      className="ui-button text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="ui-label">{user?.name || 'User'}</p>
                    <p className="body-caption">{user?.email || 'user@example.com'}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 ui-button text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2.5 ui-button text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-400" />
                      Settings
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 ui-button text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
