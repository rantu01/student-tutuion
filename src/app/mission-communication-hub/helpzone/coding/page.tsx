"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import PostList from "@/components/mission-communication-hub/PostList";
import GuidelinePostModal from "@/components/mission-communication-hub/GuidelinePostModal";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function HelpCodingPage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Array<{ _id: string; title: string; status?: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ missionId, category: 'coding', limit: '30' });
        if (search) qs.set('q', search);
        if (status) qs.set('status', status);
        const res = await fetch(`/api/v2/posts?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load');
        if (!ignore) setPosts(json.data || []);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [missionId, search, status]);

  const filtered = posts;
  return (
    <div className="space-y-3">
      <div>
        <Link
          href="/mission-communication-hub"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
          Back to hub
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Helpzone • Coding</h2>
            <p className="text-xs text-gray-600 mt-0.5">Ask coding questions, share fixes, and track resolutions.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts"
                className="pl-7 pr-3 py-1.5 text-xs border rounded w-56"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs border rounded px-2 py-1.5"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-xs text-gray-500">Loading…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <PostList posts={filtered as any} makeLink={(p) => `/mission-communication-hub/helpzone/coding/${p._id}`} />
    </div>
  );
}


