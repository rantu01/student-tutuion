"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import ResourceCard from "@/components/mission-communication-hub/ResourceCard";
import BaseModal from "@/components/mission-communication-hub/BaseModal";
import ContentViewer from "@/components/mission-communication-hub/ContentViewer";
import ResourceForm, { ResourceDraft } from "@/components/mission-communication-hub/ResourceForm";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

type Resource = { _id: string; title: string; content?: string; tags?: string[]; createdAt?: string };

export default function AdminResourcesPage() {
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
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
    resources.forEach(r => (r.tags || []).forEach(tag => t.add(tag)));
    return Array.from(t.values());
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter(r => !activeTag || (r.tags || []).includes(activeTag));
  }, [resources, activeTag]);

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const onView = (r: Resource) => { setSelected(r); setViewOpen(true); };
  const onEdit = (r: Resource) => { setSelected(r); setEditOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Admin Groups • Resources</h2>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search resources..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1.5 text-xs rounded border ${!activeTag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >All</button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-2.5 py-1.5 text-xs rounded border ${activeTag === tag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >{tag}</button>
          ))}
        </div>
      </div>

      {loading && <div className="text-xs text-gray-500">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <ResourceCard 
            key={r._id} 
            resource={r} 
            onView={onView} 
            onEdit={onEdit} 
            onDelete={async (res) => {
              try {
                const result = await fetch(`/api/v2/posts/${res._id}`, { method: 'DELETE' });
                const json = await result.json();
                if (!result.ok || !json?.success) throw new Error(json?.error || 'Failed');
                setResources(prev => prev.filter(item => item._id !== res._id));
              } catch (e: any) {
                alert(e?.message || 'Failed to delete');
              }
            }} 
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-gray-500">No resources found.</div>
      )}

      <BaseModal open={viewOpen} title="View Resource" onClose={() => setViewOpen(false)} showMenu onEdit={() => { setViewOpen(false); if (selected) setEditOpen(true); }} onDelete={async () => { 
        if (!selected) return;
        try {
          const res = await fetch(`/api/v2/posts/${selected._id}`, { method: 'DELETE' });
          const json = await res.json();
          if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
          setResources(prev => prev.filter(r => r._id !== selected._id));
          setViewOpen(false);
        } catch (e: any) {
          alert(e?.message || 'Failed');
        }
      }}>
        {selected && (
          <div className="space-y-2">
            <div className="text-sm font-medium">{selected.title}</div>
            <div className="text-xs text-gray-500">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</div>
            <div className="flex gap-1.5 flex-wrap">
              {(selected.tags || []).map(t => (
                <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">{t}</span>
              ))}
            </div>
            <ContentViewer content={selected.content} />
          </div>
        )}
      </BaseModal>

      <BaseModal open={editOpen} title="Edit Resource" onClose={() => setEditOpen(false)}>
        {selected && (
          <ResourceForm
            initial={{ title: selected.title, content: selected.content || "", tags: selected.tags || [] }}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (draft: ResourceDraft) => {
              try {
                const res = await fetch(`/api/v2/posts/${selected._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: draft.title, body: draft.content, tags: draft.tags }),
                });
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
                setResources(prev => prev.map(r => r._id === selected._id ? { ...r, title: draft.title, content: draft.content, tags: draft.tags } : r));
                setEditOpen(false);
              } catch (e: any) {
                alert(e?.message || 'Failed');
              }
            }}
          />
        )}
      </BaseModal>

      <BaseModal open={createOpen} title="New Resource" onClose={() => setCreateOpen(false)}>
        <ResourceForm
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (draft: ResourceDraft) => {
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
        />
      </BaseModal>
    </div>
  );
}