"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import AnnouncementCard from "@/components/mission-communication-hub/AnnouncementCard";
import AnnouncementFormModal from "@/components/mission-communication-hub/AnnouncementFormModal";
import { FBReaction } from "@/components/mission-communication-hub/FBReactions";
import { useAuth } from "@/context/AuthContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { selectSelectedMission, selectGroups, fetchGroups } from "@/store/missionHubSlice";

export default function MentorAnnouncements({ params }: { params: Promise<{ mentor: string }> }) {
  const { mentor } = usePromise(params);
  const isObjectId = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);
  const title = `${mentor} • Announcements`;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const groups = useAppSelector(selectGroups);
  const [v2Groups, setV2Groups] = useState<any[]>([]);
  const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-");
  // Prefer v2 groups; fallback to store groups
  const group = useMemo(() => {
    if (isObjectId(mentor)) {
      const list = (v2Groups && v2Groups.length > 0) ? v2Groups : (groups || []);
      return list.find((g: any) => String(g?._id) === mentor) || null;
    }
    const list = (v2Groups && v2Groups.length > 0) ? v2Groups : (groups || []);
    return list.find((g: any) => {
      const primaryName = g?.primaryMentorId?.name || g?.mentors?.[0]?.name || g?.mentor?.name || g?.name;
      if (!primaryName) return false;
      return toSlug(primaryName) === mentor || g?.mentor?.slug === mentor;
    }) || null;
  }, [v2Groups, groups, mentor]);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (missionId) dispatch(fetchGroups(missionId));
  }, [dispatch, missionId]);

  // Load v2 mentorship groups locally for reliable mentor slug matching
  useEffect(() => {
    let ignore = false;
    async function loadGroups() {
      if (!missionId) return;
      try {
        const qs = new URLSearchParams({ missionId, page: "1", limit: "500" });
        const res = await fetch(`/api/v2/mentorship-groups?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setV2Groups(json.data || []);
      } catch (_e) {
        if (!ignore) setV2Groups([]);
      }
    }
    loadGroups();
    return () => { ignore = true; };
  }, [missionId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ missionId, category: 'announcement', limit: '20' });
        if (group?._id) qs.set('groupId', String(group._id));
        const res = await fetch(`/api/v2/posts?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setAnnouncements(json.data || []);
      } catch (e) {
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [missionId, group?._id]);

  const canEditDelete = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role !== 'student';
  }, [user]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-3 bg-white">
        <div className="text-xs font-medium mb-2 flex items-center justify-between">
          <span>{title}</span>
          {canEditDelete && !group?._id && (
            <button onClick={() => setCreateOpen(true)} className="px-2.5 py-1.5 text-xs bg-black text-white rounded">New</button>
          )}
        </div>
        {loading && <div className="text-xs text-gray-500">Loading...</div>}
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a._id}
              author={a.createdBy?.name || mentor}
              createdAt={a.createdAt}
              content={`# ${a.title}\n\n${a.body}`}
              type={a.announcementType}
              myReaction={null}
              counts={{ ok: 0, like: 0, love: 0, sad: 0, wow: 0 }}
              onChangeReaction={() => {}}
              onMarkRead={() => {}}
              read={false}
              canEditDelete={canEditDelete}
              onEdit={() => {}}
              onDelete={async () => {
                try {
                  const res = await fetch(`/api/v2/posts/${a._id}`, { method: 'DELETE' });
                  const json = await res.json();
                  if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
                  setAnnouncements(prev => prev.filter(it => it._id !== a._id));
                } catch (e: any) {
                  alert(e?.message || 'Failed to delete');
                }
              }}
            />
          ))}
        </div>
        <AnnouncementFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (a) => {
            if (!missionId) return;
            try {
              const res = await fetch('/api/v2/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  missionId,
                  category: 'announcement',
                  title: a.title,
                  body: a.body,
                  announcementType: a.type,
                  groupId: group?._id,
                  visibility: group?._id ? 'group' : 'mission',
                }),
              });
              const json = await res.json();
              if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
              setAnnouncements(prev => [json.data, ...prev]);
              setCreateOpen(false);
            } catch (e: any) {
              alert(e?.message || 'Failed');
            }
          }}
        />
      </div>
    </div>
  );
}