import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Post, Comment } from "@/models";
import type { IPost, IComment } from "@/models";
import type { Model } from "mongoose";
import { getAuthUserFromRequest } from "@/lib/rbac";

type Reaction = "ok" | "love" | "cry" | "haha" | "bulb";

function summarizeReactions(reactions: any[] | undefined) {
  const counts = { ok: 0, love: 0, cry: 0, haha: 0, bulb: 0 } as Record<Reaction, number> & any;
  for (const r of reactions || []) {
    if (r?.reaction && counts[r.reaction] !== undefined) counts[r.reaction] += 1;
  }
  return counts as { ok: number; love: number; cry: number; haha: number; bulb: number };
}

export async function POST(req: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Ensure post exists (and for future, apply RBAC if needed based on post visibility)
    const PostModel = Post as unknown as Model<IPost>;
    const postExists = await PostModel.exists({ _id: params.id });
    if (!postExists) return Response.json({ success: false, error: "Post not found" }, { status: 404 });

    const body = await req.json();
    const reaction: Reaction | null = body?.reaction ?? null;

    const CommentModel = Comment as unknown as Model<IComment>;
    const comment = await CommentModel.findOne({ _id: params.commentId });
    if (!comment || String((comment as any).postId) !== String(params.id)) {
      return Response.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    // Remove existing reaction by this user
    const current = ((comment as any).reactions || []).filter((r: any) => String(r.userId) !== String(me._id));
    if (reaction) {
      current.push({ reaction, userId: me._id, createdAt: new Date() } as any);
    }
    (comment as any).reactions = current;
    await (comment as any).save();

    const counts = summarizeReactions((comment as any).reactions);
    const myReaction = reaction;
    return Response.json({ success: true, data: { myReaction, counts } });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to react" }, { status: 500 });
  }
}


