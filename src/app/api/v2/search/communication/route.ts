import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Post, Message } from "@/models";
import type { IPost, IMessage } from "@/models";
import type { Model } from "mongoose";
import { Types } from "mongoose";

// Unified search across Posts and Messages
// Query params: q, missionId, category, type, tag, authorId, dateFrom, dateTo, limit, cursor
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const missionId = searchParams.get("missionId") || undefined;
    const category = searchParams.get("category") || undefined; // for posts
    const type = searchParams.get("type") || undefined; // reserved for messages/channel type (not used here)
    const tag = searchParams.get("tag") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

    const postFilter: any = {};
    if (missionId) postFilter.missionId = missionId;
    if (category) postFilter.category = category;
    if (tag) postFilter.tags = tag;
    if (authorId) postFilter.createdBy = authorId;
    if (q) postFilter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { body: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ];
    if (dateFrom || dateTo) {
      postFilter.createdAt = {};
      if (dateFrom) postFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) postFilter.createdAt.$lte = new Date(dateTo);
    }

    const messageFilter: any = {};
    if (authorId) messageFilter.senderId = authorId as any;
    if (q) messageFilter.$or = [
      { body: { $regex: q, $options: 'i' } },
    ];
    if (dateFrom || dateTo) {
      messageFilter.createdAt = {};
      if (dateFrom) messageFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) messageFilter.createdAt.$lte = new Date(dateTo);
    }

    // Note: mission-bound filtering for messages would normally join via channel.missionId.
    // For simplicity, skip missionId filter on messages unless future lookup is added.

    const PostModel = Post as unknown as Model<IPost>;
    const MessageModel = Message as unknown as Model<IMessage>;

    const [posts, messages] = await Promise.all([
      PostModel.find(postFilter).sort({ createdAt: -1 }).limit(limit).lean(),
      MessageModel.find(messageFilter).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    // Merge and sort by createdAt desc, then cut to limit
    const combined = [
      ...(posts || []).map(p => ({ kind: 'post', createdAt: p.createdAt, _id: p._id, data: p })),
      ...(messages || []).map(m => ({ kind: 'message', createdAt: m.createdAt, _id: m._id, data: m })),
    ].sort((a, b) => +new Date(b.createdAt as any) - +new Date(a.createdAt as any)).slice(0, limit);

    return Response.json({ success: true, data: combined });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed to search' }, { status: 500 });
  }
}


