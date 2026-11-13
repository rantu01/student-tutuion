"use client";

import { useEffect, useMemo, useState } from "react";
import ChannelList from "@/components/mission-communication-hub/ChannelList";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";
import { useAuth } from "@/context/AuthContext";

export default function AdminMessagingPage() {
  const { user } = useAuth();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [channels, setChannels] = useState<Array<{ _id: string; name?: string; type: string }>>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; snippet: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msgCursor, setMsgCursor] = useState<string | null>(null);
  const [lastReadId, setLastReadId] = useState<string | null>(null);

  // Load or create the admin↔mentor messaging channel for this mission
  useEffect(() => {
    let ignore = false;
    async function loadChannels() {
      if (!missionId) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ missionId, type: "mentor-messaging" });
        const res = await fetch(`/api/v2/channels?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load channels");
        if (ignore) return;
        const list = (json.data || []) as Array<{ _id: string; type: string; visibility?: string }>;
        let ch = list.find(() => true);
        // If none, create one (non-student visibility)
        if (!ch) {
          const create = await fetch(`/api/v2/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ missionId, type: 'mentor-messaging', visibility: 'non-student' }),
          });
          const cj = await create.json();
          if (!create.ok || !cj?.success) throw new Error(cj?.error || 'Failed to create channel');
          ch = cj.data;
          setChannels([ch]);
        } else {
          setChannels(list);
        }
        setActiveChannelId(ch._id);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadChannels();
    return () => { ignore = true; };
  }, [missionId]);

  // Map server docs to ChatMessage UI shape
  function mapToChatMessage(doc: any): ChatMessage {
    const createdAt = doc.createdAt || new Date().toISOString();
    const mine = user?._id && doc.senderId && String(doc.senderId) === String(user._id);
    // basic reaction counts mapping; defaults to zero
    const counts: any = { ok: 0, like: 0, love: 0, sad: 0, wow: 0 };
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

  // Load messages for active channel
  useEffect(() => {
    let ignore = false;
    async function loadMessages(reset = true) {
      if (!activeChannelId) return;
      setLoadingMsgs(true);
      try {
        const qs = new URLSearchParams({ limit: '30' });
        const res = await fetch(`/api/v2/channels/${activeChannelId}/messages?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load messages');
        if (ignore) return;
        const mapped = Array.isArray(json.data) ? json.data.map(mapToChatMessage) : [];
        setMessages(mapped);
        setMsgCursor(json.nextCursor || null);
      } catch (e) {
        // noop basic error; could set toast
      } finally {
        if (!ignore) setLoadingMsgs(false);
      }
    }
    loadMessages(true);
    return () => { ignore = true; };
  }, [activeChannelId, user?._id]);

  // Send read receipt for the latest message when messages change
  useEffect(() => {
    async function markLastRead() {
      if (!activeChannelId || messages.length === 0) return;
      const last = messages[messages.length - 1];
      // Skip temporary/optimistic messages
      if (!last || last._id === lastReadId || last._id.startsWith('tmp-')) return;
      try {
        await fetch(`/api/v2/channels/${activeChannelId}/messages/${last._id}/read`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        setLastReadId(last._id);
      } catch {}
    }
    markLastRead();
  }, [activeChannelId, messages, lastReadId]);

  const onSelectChannel = (id: string) => setActiveChannelId(id);
  const onSend = async (text: string) => {
    if (!activeChannelId) {
      setError('Channel not ready. Please wait or refresh the page.');
      return;
    }
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    // optimistic add
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = { _id: tempId, senderName: "You", body, createdAt: new Date().toISOString(), mine: true, reactionCounts: { ok: 0, like: 0, love: 0, sad: 0, wow: 0 }, myReaction: null };
    setMessages((prev) => [...prev, optimistic]);
    setAttached(null);
    try {
      const res = await fetch(`/api/v2/channels/${activeChannelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, attachments: [] }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to send');
      // replace optimistic with mapped server doc but preserve mine=true and senderName
      const mapped = mapToChatMessage(json.data);
      mapped.mine = true;
      mapped.senderName = "You";
      setMessages((prev) => prev.map(m => (m._id === tempId ? { ...mapped } : m)));
    } catch (e) {
      // revert optimistic
      setMessages((prev) => prev.filter(m => m._id !== tempId));
      alert((e as any)?.message || 'Failed to send');
    }
  };
  const onAttachImage = async (file: File) => {
    // Placeholder: in real impl, upload to Cloudinary and set URL
    const url = `https://example.com/${encodeURIComponent(file.name)}`;
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">

      {/* Conversation block */}
      <div className="flex flex-col flex-1 min-h-0 border rounded p-3 bg-white">
        <div className="text-xs font-medium mb-2">
          {loading ? 'Loading channels…' : (channels.find(c => c._id === activeChannelId)?.name || 'Admin ↔ Mentor Messaging')}
        </div>
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto mb-2">
          <MessageList
            messages={messages}
            onReact={async (id, r) => {
              // optimistic toggle
              setMessages((prev) => prev.map(m => {
                if (m._id !== id) return m;
                const counts = { ok: 0, like: 0, love: 0, sad: 0, wow: 0, ...(m.reactionCounts || {}) } as any;
                if (m.myReaction) counts[m.myReaction] = Math.max(0, counts[m.myReaction] - 1);
                if (r) counts[r] = (counts[r] || 0) + 1;
                return { ...m, myReaction: r, reactionCounts: counts };
              }));
              try {
                const res = await fetch(`/api/v2/channels/${activeChannelId}/messages/${id}/react`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reaction: r ?? null }),
                });
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to react');
                setMessages((prev) => prev.map(m => m._id === id ? { ...m, myReaction: json.data.myReaction, reactionCounts: json.data.counts } : m));
              } catch (e) {
                // revert on error (simplified)
                setMessages((prev) => prev.map(m => (m._id === id ? { ...m, myReaction: null } : m)));
              }
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
          onSend={(text) => {
            let prefix = '';
            if (replyingTo?.snippet) prefix = `> ${replyingTo.snippet}\n\n`;
            onSend(prefix + text);
            setReplyingTo(null);
          }}
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


