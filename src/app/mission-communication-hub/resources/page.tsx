"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";
import PostList from "@/components/mission-communication-hub/PostList";

export default function ResourcesPage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [posts, setPosts] = useState<Array<{ _id: string; title: string; category: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ missionId, category: 'resource', limit: '30' });
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
      <h2 className="text-lg font-semibold">Resources</h2>
      {loading && <div className="text-xs text-gray-500">Loading…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <PostList posts={posts as any} />
    </div>
  );
}


