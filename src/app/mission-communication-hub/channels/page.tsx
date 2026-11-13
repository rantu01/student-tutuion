"use client";

import { useEffect, useMemo, useState } from "react";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function ChannelsPage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const title = "Mentor Messaging";
  const [channelId, setChannelId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadChannel() {
      if (!missionId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v2/channels?missionId=${missionId}&type=mentor-messaging`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (ignore) return;
        let ch = (json.data || []).find(() => true);
        if (!ch) {
          const create = await fetch(`/api/v2/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ missionId, type: 'mentor-messaging', visibility: 'non-student' }),
          });
          const cj = await create.json();
          if (!create.ok || !cj?.success) throw new Error(cj?.error || 'Failed to create');
          ch = cj.data;
        }
        setChannelId(ch._id);
      } catch (e) {
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadChannel();
    return () => { ignore = true; };
  }, [missionId]);

  useEffect(() => {
    let ignore = false;
    async function loadMessages() {
      if (!channelId) return;
      try {
        const res = await fetch(`/api/v2/channels/${channelId}/messages?limit=30`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setMessages(json.data || []);
      } catch {}
    }
    loadMessages();
    return () => { ignore = true; };
  }, [channelId]);

  const onSend = async (text: string) => {
    if (!channelId) return;
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = { _id: tempId, senderName: "You", body, createdAt: new Date().toISOString(), mine: true };
    setMessages((prev) => [...prev, optimistic]);
    setAttached(null);
    try {
      const res = await fetch(`/api/v2/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, attachments: attached?.url ? [{ url: attached.url, name: attached.name, type: 'image' }] : [] }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
      setMessages((prev) => prev.map(m => m._id === tempId ? { ...m, _id: json.data._id, createdAt: json.data.createdAt } : m));
    } catch (e) {
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    }
  };
  
  const onAttachImage = async (file: File) => {
    // TODO: Integrate Cloudinary upload
    const url = URL.createObjectURL(file);
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-3 bg-white">
        <div className="text-xs font-medium mb-2">{title}</div>
        {loading && <div className="text-xs text-gray-500">Loading channel...</div>}
        <div className="flex-1 min-h-0 overflow-y-auto mb-2">
          <MessageList messages={messages} />
        </div>
        <MessageComposer
          onSend={onSend}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
        />
      </div>
    </div>
  );
}