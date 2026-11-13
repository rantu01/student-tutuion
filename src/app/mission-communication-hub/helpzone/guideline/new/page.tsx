"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedMission } from "@/hooks/useSelectedMission";

export default function NewGuidelinePostPage() {
  const router = useRouter();
  const { getSelectedMissionId, hasSelectedMission } = useSelectedMission();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const missionId = getSelectedMissionId();

  async function submit() {
    if (!missionId || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v2/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ missionId, category: 'guideline', title, body })
      });
      const data = await res.json();
      if (res.ok && data?.data?._id) {
        router.push(`/mission-communication-hub/helpzone/guideline/${data.data._id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasSelectedMission) {
    return <div className="text-sm text-gray-500">Select a mission from the sidebar to create a post.</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">New Guideline Post</h2>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium">Title</label>
        <input className="w-full border rounded p-2 text-xs" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium">Body</label>
        <textarea className="w-full border rounded p-2 text-xs" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={submit} disabled={submitting || !title.trim() || !body.trim()} className="px-2.5 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{submitting ? 'Publishing…' : 'Publish'}</button>
      </div>
    </div>
  );
}


