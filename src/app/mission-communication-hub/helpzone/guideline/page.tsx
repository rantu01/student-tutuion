"use client";

import { useEffect, useMemo, useState } from "react";
import PostList from "@/components/mission-communication-hub/PostList";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function HelpGuidelinePage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
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
        const qs = new URLSearchParams({ missionId, category: 'guideline', limit: '30' });
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
  }, [missionId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Helpzone • Guideline</h2>
        <button type="button" className="px-2.5 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50">New Post</button>
      </div>
      {loading && <div className="text-xs text-gray-500">Loading…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <PostList
        posts={posts as any}
        makeLink={(p) => `/mission-communication-hub/helpzone/guideline/${p._id}`}
      />
    </div>
  );
}


