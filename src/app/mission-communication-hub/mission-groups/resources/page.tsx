"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Card from "@/components/mission-communication-hub/Card";
import ContentViewer from "@/components/mission-communication-hub/ContentViewer";
import ResourceForm, { ResourceDraft } from "@/components/mission-communication-hub/ResourceForm";
import Modal from "@/components/Modal";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

export default function MissionResourcesPage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!missionId) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ missionId, category: 'resource', limit: '30' });
        if (query) qs.set('q', query);
        const res = await fetch(`/api/v2/posts?${qs.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        if (!ignore) setResources(json.data || []);
      } catch (e) {
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [missionId, query]);

  const tags = useMemo(() => {
    const t = new Set<string>();
    resources.forEach(r => (r.tags || []).forEach((tag: string) => t.add(tag)));
    return Array.from(t.values());
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter(r => !activeTag || (r.tags || []).includes(activeTag));
  }, [resources, activeTag]);

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const onView = (r: any) => { setSelected(r); setViewOpen(true); };
  const onEdit = (r: any) => { setSelected(r); setEditOpen(true); };

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Mission Resources</h2>
            <p className="text-xs text-gray-600 mt-0.5">Documents, templates, and reference materials</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-7 pr-3 py-1.5 text-xs border rounded w-48"
              />
            </div>
            <button onClick={() => setCreateOpen(true)} className="px-3 py-1.5 text-xs bg-black text-white rounded">New Resource</button>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-2 py-1 text-xs rounded border ${!activeTag ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
            >All</button>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-2 py-1 text-xs rounded border ${activeTag === tag ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
              >{tag}</button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-xs text-gray-500">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(r => (
          <Card
            key={r._id}
            title={r.title}
            subtitle={new Date(r.createdAt).toLocaleDateString()}
            tags={r.tags}
            actions={
              <div className="flex items-center gap-1">
                <button onClick={() => onView(r)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">View</button>
                <button onClick={() => onEdit(r)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Edit</button>
              </div>
            }
          />
        ))}
      </div>

      {/* View Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={selected?.title || ''}>
        <ContentViewer content={selected?.body} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Resource">
        {selected && (
          <ResourceForm
            initial={{ title: selected.title, content: selected.body, tags: selected.tags || [] }}
            onSubmit={async (draft) => {
              try {
                const res = await fetch(`/api/v2/posts/${selected._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: draft.title, body: draft.content, tags: draft.tags }),
                });
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
                setResources(prev => prev.map(r => r._id === selected._id ? { ...r, title: draft.title, body: draft.content, tags: draft.tags } : r));
                setEditOpen(false);
              } catch (e: any) {
                alert(e?.message || 'Failed');
              }
            }}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Resource">
        <ResourceForm
          onSubmit={async (draft) => {
            if (!missionId) return;
            try {
              const res = await fetch('/api/v2/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  missionId,
                  category: 'resource',
                  title: draft.title,
                  body: draft.content,
                  tags: draft.tags,
                  visibility: 'mission',
                }),
              });
              const json = await res.json();
              if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
              setResources(prev => [json.data, ...prev]);
              setCreateOpen(false);
            } catch (e: any) {
              alert(e?.message || 'Failed');
            }
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}