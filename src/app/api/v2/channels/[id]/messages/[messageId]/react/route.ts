import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel, Message } from "@/models";
import type { IChannel, IMessage } from "@/models";
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

export async function POST(req: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const ChannelModel = Channel as unknown as Model<IChannel>;
    const MessageModel = Message as unknown as Model<IMessage>;

    const channel = await ChannelModel.findById(params.id).lean();
    if (!channel) return Response.json({ success: false, error: "Channel not found" }, { status: 404 });

    // Basic RBAC: if mentor-messaging channel, block students
    if (channel.type === "mentor-messaging" && me.role === "student") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const reaction: Reaction | null = body?.reaction ?? null;

    const msg = await MessageModel.findById(params.messageId);
    if (!msg || String(msg.channelId) !== String(params.id)) {
      return Response.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Remove existing reaction by this user
    const current = (msg.reactions || []).filter((r: any) => String(r.userId) !== String(me._id));
    if (reaction) {
      current.push({ reaction, userId: me._id, createdAt: new Date() } as any);
    }
    (msg as any).reactions = current;
    await msg.save();

    const counts = summarizeReactions((msg as any).reactions);
    const myReaction = reaction;
    return Response.json({ success: true, data: { myReaction, counts } });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to react" }, { status: 500 });
  }
}


