"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Target, 
  RefreshCw, 
  Users, 
  BarChart3, 
  Settings, 
  Home,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  BookOpen,
  TrendingUp,
  UserCheck,
  Users2,
  Zap,
  UserPlus,
  UserX,
  FileText,
  Mail,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle
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

interface MissionHubSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavigationItem[];
}

export default function MissionHubSidebar({ sidebarOpen, setSidebarOpen }: MissionHubSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const missions = useAppSelector(selectMissions);
  const selectedMission = useAppSelector(selectSelectedMission);
  const loading = useAppSelector(selectMissionsLoading);
  const error = useAppSelector(selectMissionsError);

  useEffect(() => {
    // Fetch missions on component mount
    console.log('🚀 MissionHubSidebar: Component mounted, fetching missions...');
    dispatch(fetchMissions());
  }, [dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('📊 MissionHubSidebar: State updated:', {
      missionsCount: missions.length,
      selectedMission: selectedMission?.code,
      loading,
      error
    });
  }, [missions, selectedMission, loading, error]);

  const handleRefreshMissions = () => {
    dispatch(fetchMissions());
  };

  const handleMissionChange = (missionId: string) => {
    console.log('🎯 MissionHubSidebar: Mission selection changed to:', missionId);
    const mission = missions.find(m => m._id === missionId);
    console.log('🎯 MissionHubSidebar: Found mission:', mission);
    dispatch(setSelectedMission(mission || null));
    console.log('🎯 MissionHubSidebar: Dispatched setSelectedMission');
  };

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  let navigation: NavigationItem[] = [
    { 
      name: "Dashboard", 
      href: "/mission-hub", 
      icon: <Home className="w-5 h-5" />
    },
    { 
      name: "Student Management", 
      href: "/mission-hub/students", 
      icon: <Users className="w-5 h-5" />,
      children: [
        { name: "All Students", href: "/mission-hub/students", icon: <Users className="w-4 h-4" /> },
        { name: "Add Students", href: "/mission-hub/students/add", icon: <UserPlus className="w-4 h-4" /> },
        { name: "Manage Students", href: "/mission-hub/students/manage", icon: <UserCheck className="w-4 h-4" /> },
        { name: "Deactivated Students", href: "/mission-hub/students/deactivated", icon: <UserX className="w-4 h-4" /> },
      ]
    },
    { 
      name: "Mentor Management", 
      href: "/mission-hub/mentors", 
      icon: <UserCheck className="w-5 h-5" />,
      children: [
        { name: "Overview", href: "/mission-hub/mentors", icon: <UserCheck className="w-4 h-4" /> },
        { name: "Assign Mentors", href: "/mission-hub/mentors/assign", icon: <UserPlus className="w-4 h-4" /> },
        { name: "Assign Students", href: "/mission-hub/mentors/assign-students", icon: <Users className="w-4 h-4" /> },
        { name: "Mission Mentors", href: "/mission-hub/mentors/mission-mentors", icon: <UserCheck className="w-4 h-4" /> },
        { name: "Mentor Groups", href: "/mission-hub/mentors/groups", icon: <Users2 className="w-4 h-4" /> },
        { name: "Analytics", href: "/mission-hub/mentors/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      ]
    },
    { 
      name: "Groups", 
      href: "/mission-hub/groups", 
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "All Groups", href: "/mission-hub/groups", icon: <Users2 className="w-4 h-4" /> },
        { name: "Create Group", href: "/mission-hub/groups/create", icon: <Zap className="w-4 h-4" /> },
        { name: "Student Management", href: "/mission-hub/groups/students", icon: <Users className="w-4 h-4" /> },
        { name: "Group Analytics", href: "/mission-hub/groups/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      ]
    },
    { 
      name: "Assignment Progress", 
      href: "/mission-hub/assignments", 
      icon: <FileText className="w-5 h-5" />
    },
    { 
      name: "Analytics", 
      href: "/mission-hub/analytics", 
      icon: <BarChart3 className="w-5 h-5" />
    },
    { 
      name: "Settings", 
      href: "/mission-hub/settings", 
      icon: <Settings className="w-5 h-5" />
    },
  ];

  if (selectedMission?._id) {
    navigation.splice(3, 0, {
      name: "Attendance",
      href: `/mission-hub/missions/${selectedMission._id}/attendance`,
      icon: <UserCheck className="w-5 h-5" />,
      children: [
        { name: "Check-in", href: `/mission-hub/missions/${selectedMission._id}/attendance`, icon: <UserCheck className="w-4 h-4" /> },
        { name: "Forms", href: `/mission-hub/missions/${selectedMission._id}/attendance/forms`, icon: <BookOpen className="w-4 h-4" /> },
      ]
    });
  }

  const isActive = (href: string) => pathname === href;

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    
    return (
      <div key={item.name} className="space-y-1">
        <div className="flex items-center justify-between group">
          <Link
            href={item.href}
            className={`
              flex-1 flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors
              ${active 
                ? 'bg-black text-white' 
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }
              ${level > 0 ? 'ml-4' : ''}
              ${collapsed ? 'justify-center' : ''}
            `}
            onClick={() => setSidebarOpen(false)}
          >
            <div className={`
              ${active ? 'text-white' : 'text-gray-500 group-hover:text-black'}
              transition-colors
            `}>
              {item.icon}
            </div>
            {!collapsed && <span className="ml-2">{item.name}</span>}
          </Link>
          
          {hasChildren && !collapsed && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleExpanded(item.name);
              }}
              className={`
                p-1.5 rounded-md transition-colors
                ${active ? 'text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
              `}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="ml-4 space-y-1 border-l border-gray-200 pl-2">
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/20" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-white text-gray-900 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:inset-0 border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-black mr-3" />
            {!collapsed && <h1 className="heading-5 text-black">Mission Hub</h1>}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:inline-flex p-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 overflow-y-auto space-y-1`}>
          {navigation.map((item) => renderNavigationItem(item))}
        </nav>

        {/* Quick Actions */}
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-1.5">
            <Link
              href="/mission-communication-hub"
              className="w-full flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors justify-center"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {!collapsed && 'Communication Hub'}
            </Link>
            <Link
              href="/dashboard/admin/missions"
              className="w-full flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-gray-300 transition-colors justify-center"
            >
              <Target className="w-4 h-4 mr-2 text-black" />
              {!collapsed && 'Manage Missions'}
            </Link>
            <Link
              href="/dashboard/admin/missions/create"
              className="w-full flex items-center px-3 py-2 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              {!collapsed && 'Create Mission'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}