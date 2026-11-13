"use client";

import { useEffect, useMemo, useState } from "react";
import AnnouncementCard from "@/components/mission-communication-hub/AnnouncementCard";
import AnnouncementFormModal from "@/components/mission-communication-hub/AnnouncementFormModal";
import { FBReaction } from "@/components/mission-communication-hub/FBReactions";
import { useAuth } from "@/context/AuthContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function MissionAnnouncementsPage() {
  const { user } = useAuth();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const title = "Mission Groups • Announcements";
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v2/posts?missionId=${missionId}&category=announcement&limit=20`);
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
  }, [missionId]);

  const canEditDelete = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role !== 'student';
  }, [user]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-4 bg-white">
        <div className="text-sm font-medium mb-3 flex items-center justify-between">
          <span>{title}</span>
          {canEditDelete && (
            <button onClick={() => setCreateOpen(true)} className="px-3 py-2 text-sm bg-black text-white rounded">New Announcement</button>
          )}
        </div>
        {loading && <div className="text-xs text-gray-500">Loading...</div>}
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a._id}
              author={a.createdBy?.name || 'Staff'}
              createdAt={a.createdAt}
              content={`# ${a.title}\n\n${a.body}`}
              type={a.announcementType}
              myReaction={null}
              counts={{ ok: 0, like: 0, love: 0, sad: 0, wow: 0 }}
              onChangeReaction={() => {}}
              onMarkRead={() => {}}
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
                visibility: 'mission',
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
  );
}