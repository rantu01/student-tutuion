"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import MarkdownViewer from "@/components/mission-communication-hub/MarkdownViewer";

export default function GuidelinePostDetailPage() {
  const params = useParams();
  const postId = String(params?.postId || "");

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/v2/posts/${postId}`),
          fetch(`/api/v2/posts/${postId}/comments?limit=50`),
        ]);
        const postJson = await postRes.json();
        const commentsJson = await commentsRes.json();
        if (!postRes.ok || !postJson?.success) throw new Error(postJson?.error || 'Failed to load post');
        if (!commentsRes.ok || !commentsJson?.success) throw new Error(commentsJson?.error || 'Failed to load comments');
        if (!ignore) {
          setPost(postJson.data);
          setComments(commentsJson.data || []);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [postId]);

  async function submitComment(parentId?: string | null) {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/v2/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment, parentId: parentId || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
      setComments(prev => [json.data, ...prev]);
      setNewComment("");
      setReplyTo(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to add comment');
    }
  }

  async function changeStatus(status: string) {
    try {
      const res = await fetch(`/api/v2/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
      setPost((p: any) => ({ ...p, status: json.data.status }));
    } catch (e: any) {
      alert(e?.message || 'Failed to change status');
    }
  }

  if (loading) return <div className="text-xs text-gray-500">Loading...</div>;
  if (error) return <div className="text-xs text-red-600">{error}</div>;
  if (!post) return <div className="text-xs text-gray-500">Post not found</div>;

  const topLevelComments = comments.filter(c => !c.parentId);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/mission-communication-hub/helpzone/guideline"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
          Back to guidelines
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="flex items-start justify-between">
          <div className="prose max-w-none">
            <h2 className="text-sm font-semibold">{post.title}</h2>
            <div className="mt-2"><MarkdownViewer text={post.body} /></div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={post.status} size="sm" />
            <div className="relative">
              <select
                className="border rounded text-xs px-2 py-1"
                value={post.status}
                onChange={(e) => changeStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Comments</h3>

        <div className="bg-white border rounded p-3">
          <textarea
            className="w-full border rounded p-2 text-xs"
            rows={3}
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => submitComment(replyTo)}
              className="px-3 py-1.5 text-xs bg-black text-white rounded"
            >
              Post Comment
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {topLevelComments.map(c => (
            <div key={c._id} className="bg-white border rounded p-3 text-xs">
              <div className="font-medium text-gray-900">{c.authorId?.name || 'User'}</div>
              <div className="mt-1 text-gray-700"><MarkdownViewer text={c.body} /></div>
              <div className="mt-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
              {comments.filter(r => r.parentId === c._id).map(reply => (
                <div key={reply._id} className="ml-4 mt-2 p-2 border-l-2 border-gray-200">
                  <div className="font-medium text-gray-900">{reply.authorId?.name || 'User'}</div>
                  <div className="mt-1 text-gray-700"><MarkdownViewer text={reply.body} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}