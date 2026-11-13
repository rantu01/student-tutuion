"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users2, UserCircle2, MessageSquare, Megaphone, RefreshCw, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function MentorshipGroupsLanding() {
  const dispatch = useAppDispatch();
  const mission = useAppSelector(selectSelectedMission);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "students">("name");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!mission?._id) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ missionId: mission._id, page: "1", limit: "500" });
        const res = await fetch(`/api/v2/mentorship-groups?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setGroups(json.data || []);
      } catch {
        if (!ignore) setGroups([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [dispatch, mission?._id]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g: any) =>
      [g.name, g.description, g?.primaryMentorId?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [groups, query]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    groups?.forEach((g: any) => {
      if (Array.isArray(g?.focusArea)) g.focusArea.forEach((fa: string) => set.add(fa));
    });
    return Array.from(set);
  }, [groups]);

  const filteredAndSorted = useMemo(() => {
    const list = (activeTag ? filteredGroups.filter((g: any) => g?.focusArea?.includes?.(activeTag)) : filteredGroups).slice();
    if (sortBy === "name") {
      list.sort((a: any, b: any) => String(a?.name || "").localeCompare(String(b?.name || "")));
    } else if (sortBy === "students") {
      const aCount = (g: any) => (Array.isArray(g?.students) ? g.students.length : 0);
      list.sort((a: any, b: any) => aCount(b) - aCount(a));
    }
    return list;
  }, [filteredGroups, sortBy, activeTag]);

  // Prefer stable identifiers (group._id) instead of name-based slugs for routing
  const isObjectId = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);

  const totalMentors = useMemo(() => (
    groups?.reduce((sum: number, g: any) => sum + (Array.isArray(g?.mentors) ? g.mentors.length : 0), 0)
  ), [groups]);
  const totalStudents = useMemo(() => (
    groups?.reduce((sum: number, g: any) => sum + (Array.isArray(g?.students) ? g.students.length : 0), 0)
  ), [groups]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Mentorship Groups</h2>
            </div>
            <p className="text-xs text-gray-600">Group-wise channels for announcements and discussions.</p>
            {mission && (
              <p className="text-xs text-gray-500">
                Active mission: <span className="font-medium text-gray-800">{mission.code}</span> — {mission.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mentors..."
                className="pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
            >
              <option value="name">Sort: Name</option>
              <option value="students">Sort: Students</option>
            </select>
            <button
              onClick={() => { if (mission?._id) setGroups([]); }}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs">
            <Users2 className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-gray-700">Mentors:</span>
            <span className="font-semibold text-gray-900">{totalMentors}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs">
            <UserCircle2 className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-gray-700">Students:</span>
            <span className="font-semibold text-gray-900">{totalStudents}</span>
          </div>
          {tags.length > 0 && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-600">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-2 py-1.5 text-xs rounded border ${!activeTag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >All</button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-2 py-1.5 text-xs rounded border ${activeTag === tag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >{tag}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                    <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded mt-3"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">No mentors found</p>
            <p className="text-xs text-gray-500 mt-1">Try another search, filter, or refresh the list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSorted.map((g: any) => {
              const groupId = String(g?._id || "");
              const count = Array.isArray(g?.students) ? g.students.length : 0;
              const initials = String(g?.name || "?").trim().split(/\s+/).map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={g._id} className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{g.name}</div>
                        <div className="text-[10px] text-gray-600 truncate">{g?.primaryMentorId?.name || (Array.isArray(g?.mentors) && g.mentors.length > 0 ? `${g.mentors.length} mentor(s)` : 'No mentors')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Students</div>
                      <div className="text-sm font-semibold text-gray-900">{count}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={`/mission-communication-hub/mentorship-groups/${groupId}/announcements`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-gray-600" />
                      Announcements
                    </Link>
                    <Link
                      href={`/mission-communication-hub/mentorship-groups/${groupId}/discussion`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600" />
                      Discussion
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

