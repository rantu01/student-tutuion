"use client";

import { useEffect, useMemo, useState } from "react";
import AnnouncementCard from "@/components/mission-communication-hub/AnnouncementCard";
import AnnouncementFormModal from "@/components/mission-communication-hub/AnnouncementFormModal";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";
import { FBReaction } from "@/components/mission-communication-hub/FBReactions";
import { useAuth } from "@/context/AuthContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function AnnouncementsPage() {
  const title = "Announcements";
  const { user } = useAuth();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [topAnnouncement, setTopAnnouncement] = useState<{ author: string; createdAt: string; content: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [myReaction, setMyReaction] = useState<FBReaction | null>(null);
  const [counts, setCounts] = useState<Record<FBReaction, number>>({ ok: 0, like: 0, love: 0, sad: 0, wow: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ missionId, category: "announcement", limit: "1" });
        const res = await fetch(`/api/v2/posts?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load announcements");
        if (ignore) return;
        const [latest] = json.data || [];
        if (latest) {
          setTopAnnouncement({
            author: latest?.createdBy?.name || "Staff",
            createdAt: latest.createdAt,
            content: `# ${latest.title}\n\n${latest.body || ""}`,
          });
        } else {
          setTopAnnouncement(null);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [missionId]);

  const onSend = (text: string) => {
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    const msg: ChatMessage = { _id: `tmp-${Date.now()}`, senderName: "You", body, createdAt: new Date().toISOString(), mine: true };
    setMessages((prev) => [...prev, msg]);
    setAttached(null);
  };
  const onAttachImage = async (file: File) => {
    const url = `https://example.com/${encodeURIComponent(file.name)}`;
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-3 bg-white">
        <div className="text-xs font-medium mb-2 flex items-center justify-between">
          <span>{title}</span>
          <button onClick={() => setCreateOpen(true)} className="px-2.5 py-1.5 text-xs bg-black text-white rounded">New</button>
        </div>
        <div className="mb-2">
          {loading && <div className="text-xs text-gray-500">Loading…</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
          {topAnnouncement && (
            <AnnouncementCard
              author={topAnnouncement.author}
              createdAt={topAnnouncement.createdAt}
              content={topAnnouncement.content}
              myReaction={myReaction}
              counts={counts}
              onChangeReaction={(next) => {
                setCounts((prev) => {
                  const out: Record<FBReaction, number> = { ...prev };
                  if (myReaction) out[myReaction] = Math.max(0, out[myReaction] - 1);
                  if (next) out[next] = (out[next] ?? 0) + 1;
                  return out;
                });
                setMyReaction(next);
              }}
              onMarkRead={() => {}}
              canEditDelete={!!user && ((user.role || '').toLowerCase() !== 'student')}
              onEdit={() => setCreateOpen(true)}
              onDelete={() => setTopAnnouncement(null)}
            />
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto mb-2">
          <MessageList messages={messages} showEmptyState={false} />
        </div>
        <MessageComposer
          onSend={onSend}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
        />
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
                attachments: a.attachments || [],
                tags: [],
              }),
            });
            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to create');
            setTopAnnouncement({ author: user?.name || 'Staff', createdAt: json.data.createdAt, content: `# ${json.data.title}\n\n${json.data.body || ''}` });
            setCreateOpen(false);
          } catch (e: any) {
            alert(e?.message || 'Failed');
          }
        }}
      />
    </div>
  );
}


