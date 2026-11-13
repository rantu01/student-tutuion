"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Radio, Megaphone, BookOpen, Code2, Users2, RefreshCw, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchMissions, selectMissions, selectMissionsError, selectMissionsLoading, selectSelectedMission, setSelectedMission } from "@/store/missionHubSlice";

type NavItem = { name: string; href?: string; icon?: React.ReactNode; children?: NavItem[] };

export default function CommunicationHubSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void; }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const missions = useAppSelector(selectMissions);
  const selectedMission = useAppSelector(selectSelectedMission);
  const loading = useAppSelector(selectMissionsLoading);
  const error = useAppSelector(selectMissionsError);
  const [collapsed, setCollapsed] = useState(false);
  const [mentorNavItems, setMentorNavItems] = useState<NavItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMissions());
  }, [dispatch]);
  const isActive = (href: string) => pathname === href;
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Admin Groups", "Mission Groups", "Helpzone"]));

  // Utility to create URL-friendly slug
  const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-");

  // Load mentorship groups for the selected mission and build group-based nav items
  useEffect(() => {
    let ignore = false;
    async function loadGroups() {
      if (!selectedMission?._id) {
        setMentorNavItems([]);
        return;
      }
      setGroupsLoading(true);
      try {
        const qs = new URLSearchParams({ missionId: selectedMission._id, page: "1", limit: "500" });
        const res = await fetch(`/api/v2/mentorship-groups?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load groups");
        if (ignore) return;
        const groups = (json.data || []) as Array<any>;
        
        // Check which groups have channels
        const channelsRes = await fetch(`/api/v2/channels?missionId=${selectedMission._id}`);
        const channelsJson = await channelsRes.json();
        const channels = channelsJson?.success ? (channelsJson.data || []) : [];
        
        // Build one entry per group using its group name, only if channels exist
        const items: NavItem[] = groups
          .filter((g) => {
            // Check if this group has at least one channel
            return channels.some((ch: any) => String(ch.groupId?._id) === String(g._id));
          })
          .map((g) => {
            const groupName = g?.name || "group";
            const groupSlug = toSlug(groupName);
            
            // Check which channels exist for this group
            const groupChannels = channels.filter((ch: any) => String(ch.groupId?._id) === String(g._id));
            const hasDiscussion = groupChannels.some((ch: any) => ch.type === 'group-discussion');
            const hasAnnouncements = groupChannels.some((ch: any) => ch.type === 'group-announcement');
            
            const children: NavItem[] = [];
            if (hasAnnouncements) {
              children.push({ name: "announcements", href: `/mission-communication-hub/mentorship-groups/${groupSlug}/announcements` });
            }
            if (hasDiscussion) {
              children.push({ name: "discussion", href: `/mission-communication-hub/mentorship-groups/${groupSlug}/discussion` });
            }
            
            return {
              name: groupName,
              icon: <Users2 className="w-5 h-5" />,
              children,
            } as NavItem;
          });
        setMentorNavItems(items);
      } catch (_e) {
        setMentorNavItems([]);
      } finally {
        if (!ignore) setGroupsLoading(false);
      }
    }
    loadGroups();
    return () => { ignore = true; };
  }, [selectedMission?._id]);

  const nav: NavItem[] = [
    { name: "Overview", href: "/mission-communication-hub", icon: <Radio className="w-5 h-5" /> },
    {
      name: "Admin Groups",
      icon: <Radio className="w-5 h-5" />,
      children: [
        { name: "Resources", href: "/mission-communication-hub/admin-groups/resources", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Messaging", href: "/mission-communication-hub/admin-groups/messaging", icon: <Radio className="w-5 h-5" /> },
      ]
    },
    {
      name: "Mission Groups",
      icon: <Users2 className="w-5 h-5" />,
      children: [
        { name: "Announcements", href: "/mission-communication-hub/mission-groups/announcements", icon: <Megaphone className="w-5 h-5" /> },
        { name: "Guideline Session", href: "/mission-communication-hub/mission-groups/guideline", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Resources", href: "/mission-communication-hub/mission-groups/resources", icon: <BookOpen className="w-5 h-5" /> },
      ]
    },
    {
      name: "Helpzone",
      icon: <BookOpen className="w-5 h-5" />,
      children: [
        { name: "Guideline Zone", href: "/mission-communication-hub/helpzone/guideline", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Coding Zone", href: "/mission-communication-hub/helpzone/coding", icon: <Code2 className="w-5 h-5" /> },
      ]
    },
    { name: "Mentorship Groups", href: "/mission-communication-hub/mentorship-groups", icon: <Users2 className="w-5 h-5" /> },
    // Loading/empty hints for mentor groups
    ...(groupsLoading ? [{ name: "Loading groups…" } as NavItem] : []),
    ...(!groupsLoading && mentorNavItems.length === 0 ? [{ name: "No mentorship groups yet" } as NavItem] : []),
    // Dynamically generated mentor/group items
    ...mentorNavItems,
  ];

  const toggle = (key: string) => {
    const next = new Set(expanded);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpanded(next);
  };

  const renderItem = (item: NavItem, level: number) => {
    const padded = level > 0;
    const active = item.href ? isActive(item.href) : false;
    if (item.children) {
      const open = expanded.has(item.name);
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggle(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${padded ? 'ml-4' : ''} ${active ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className={`${active ? 'text-white' : 'text-gray-500'}`}>{item.icon}</span>}
              {!collapsed && <span>{item.name}</span>}
            </div>
            {!collapsed && (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>
          {open && !collapsed && (
            <div className="ml-4 space-y-1 border-l border-gray-200 pl-2">
              {item.children.map((c) => (
                <div key={c.name}>{renderItem(c, level + 1)}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    // Leaf: render link if href exists, otherwise render static row
    if (item.href) {
      return (
        <Link
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${active ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'} ${padded ? 'ml-4' : ''} ${collapsed ? 'justify-center' : ''}`}
        >
          {item.icon && <span className={`${active ? 'text-white' : 'text-gray-500'}`}>{item.icon}</span>}
          {!collapsed && <span className="ml-2">{item.name}</span>}
        </Link>
      );
    }
    return (
      <div
        className={`flex items-center px-3 py-2 text-xs font-medium rounded-md ${padded ? 'ml-4' : ''} ${collapsed ? 'justify-center' : ''} text-gray-500`}
      >
        {item.icon && <span className={`text-gray-400`}>{item.icon}</span>}
        {!collapsed && <span className="ml-2">{item.name}</span>}
      </div>
    );
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/20" />
        </div>
      )}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-white text-gray-900 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:inset-0 border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Radio className="w-6 h-6 text-black mr-3" />
            {!collapsed && <h1 className="heading-5 text-black">Communication Hub</h1>}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:inline-flex p-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-md text-gray-600 hover:text-black hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 overflow-y-auto space-y-1`}>
          {nav.map((item) => (
            <div key={item.name}>{renderItem(item, 0)}</div>
          ))}
        </nav>
      </div>
    </>
  );
}


