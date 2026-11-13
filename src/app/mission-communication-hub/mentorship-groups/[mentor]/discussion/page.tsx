"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";
import { useAuth } from "@/context/AuthContext";

export default function MentorDiscussion({ params }: { params: Promise<{ mentor: string }> }) {
  const { mentor } = usePromise(params);
  const isObjectId = (val: string) => /^[a-fA-F0-9]{24}$/.test(val);
  const { user } = useAuth();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const title = `${mentor} • Discussion`;
  const [channelId, setChannelId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; snippet: string } | null>(null);
  const [matchedGroupId, setMatchedGroupId] = useState<string>("");
  const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-");

  // Resolve route param to groupId (support either mentor slug or direct groupId)
  useEffect(() => {
    let ignore = false;
    async function resolveGroup() {
      if (!missionId) return;
      try {
        if (isObjectId(mentor)) {
          setMatchedGroupId(mentor);
          return;
        }
        const qs = new URLSearchParams({ missionId, page: "1", limit: "500" });
        const res = await fetch(`/api/v2/mentorship-groups?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (ignore) return;
        const list = (json.data || []) as Array<any>;
        const match = list.find((g) => {
          const primaryName = g?.primaryMentorId?.name || g?.mentors?.[0]?.name || g?.name;
          const groupName = g?.name || '';
          
          // Try to match by primary mentor name slug OR group name slug
          const mentorSlug = primaryName ? toSlug(primaryName) : '';
          const groupSlug = groupName ? toSlug(groupName) : '';
          
          return mentorSlug === mentor || groupSlug === mentor || g?.mentor?.slug === mentor;
        });
        setMatchedGroupId(match?._id || "");
      } catch {
        setMatchedGroupId("");
      }
    }
    resolveGroup();
    return () => { ignore = true; };
  }, [missionId, mentor]);

  // Load or create group-discussion channel for the matched group
  useEffect(() => {
    let ignore = false;
    async function loadChannel() {
      if (!missionId || !matchedGroupId) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ missionId, groupId: matchedGroupId, type: 'group-discussion' });
        const res = await fetch(`/api/v2/channels?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (ignore) return;
        let ch = (json.data || []).find(() => true);
        if (!ch) {
          const create = await fetch(`/api/v2/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ missionId, groupId: matchedGroupId, type: 'group-discussion', visibility: 'group' }),
          });
          const cj = await create.json();
          if (!create.ok || !cj?.success) throw new Error(cj?.error || 'Failed to create');
          ch = cj.data;
        }
        setChannelId(ch._id);
        setError(null);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load channel');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadChannel();
    return () => { ignore = true; };
  }, [missionId, matchedGroupId]);

  // Map server doc to ChatMessage
  function mapToChatMessage(doc: any): ChatMessage {
    const createdAt = doc.createdAt || new Date().toISOString();
    const mine = user?._id && doc.senderId && String(doc.senderId) === String(user._id);
    const counts: any = { ok: 0, like: 0, love: 0, wow: 0, sad: 0 };
    if (Array.isArray(doc.reactions)) {
      for (const r of doc.reactions) {
        if (r?.reaction && counts[r.reaction] !== undefined) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
      }
    }
    return {
      _id: String(doc._id),
      senderName: mine ? "You" : (doc.senderId?.name || "Member"),
      body: doc.body || "",
      createdAt: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
      mine: !!mine,
      reactionCounts: counts,
      myReaction: null,
    } as ChatMessage;
  }

  useEffect(() => {
    let ignore = false;
    async function loadMessages() {
      if (!channelId) return;
      try {
        const res = await fetch(`/api/v2/channels/${channelId}/messages?limit=30`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setMessages((json.data || []).map(mapToChatMessage));
      } catch {}
    }
    loadMessages();
    return () => { ignore = true; };
  }, [channelId, user?._id]);

  const onSend = async (text: string) => {
    if (!channelId) {
      setError('Channel not ready. Please wait or refresh the page.');
      return;
    }
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    if (replyingTo?.snippet) body = `> ${replyingTo.snippet}\n\n` + body;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = { _id: tempId, senderName: "You", body, createdAt: new Date().toISOString(), mine: true, reactionCounts: { ok: 0, like: 0, love: 0, wow: 0, sad: 0 }, myReaction: null };
    setMessages((prev) => [...prev, optimistic]);
    setAttached(null);
    setReplyingTo(null);
    try {
      const res = await fetch(`/api/v2/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, attachments: [] }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
      const mapped = mapToChatMessage(json.data);
      mapped.mine = true;
      mapped.senderName = "You";
      setMessages((prev) => prev.map(m => m._id === tempId ? { ...mapped } : m));
      setError(null);
    } catch (e: any) {
      setMessages((prev) => prev.filter(m => m._id !== tempId));
      setError(e?.message || 'Failed to send message');
      console.error('Send message error:', e);
    }
  };
  const onAttachImage = async (file: File) => {
    const url = `https://example.com/${encodeURIComponent(file.name)}`;
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-4 bg-white">
        <div className="text-sm font-medium mb-3">{title}</div>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
          <MessageList
            messages={messages}
            onReact={async (id, r) => {
              setMessages(prev => prev.map(m => {
                if (m._id !== id) return m;
                const counts = { ok: 0, like: 0, love: 0, wow: 0, sad: 0, ...(m.reactionCounts || {}) } as any;
                if (m.myReaction) counts[m.myReaction] = Math.max(0, counts[m.myReaction] - 1);
                if (r) counts[r] = (counts[r] || 0) + 1;
                return { ...m, myReaction: r, reactionCounts: counts };
              }));
              try {
                const res = await fetch(`/api/v2/channels/${channelId}/messages/${id}/react`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reaction: r ?? null }),
                });
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
                setMessages((prev) => prev.map(m => m._id === id ? { ...m, myReaction: json.data.myReaction, reactionCounts: json.data.counts } : m));
              } catch {}
            }}
            onReply={(id) => {
              const msg = messages.find(m => m._id === id);
              if (!msg) return;
              const snippet = msg.body.length > 160 ? msg.body.slice(0, 157) + '…' : msg.body;
              setReplyingTo({ id, snippet });
            }}
          />
        </div>
        <MessageComposer
          onSend={onSend}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
          replySnippet={replyingTo?.snippet || null}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}
