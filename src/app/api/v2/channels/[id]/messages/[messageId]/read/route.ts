import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel, Message } from "@/models";
import type { IChannel, IMessage } from "@/models";
import type { Model } from "mongoose";
import { getAuthUserFromRequest } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const ChannelModel = Channel as unknown as Model<IChannel>;
    const MessageModel = Message as unknown as Model<IMessage>;

    const channel = await ChannelModel.findById(params.id).lean();
    if (!channel) return Response.json({ success: false, error: "Channel not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const readAt = body?.readAt ? new Date(body.readAt) : new Date();

    const msg = await MessageModel.findOne({ _id: params.messageId });
    if (!msg || String(msg.channelId) !== String(params.id)) {
      return Response.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const receipts = (msg as any).readReceipts || [];
    const others = receipts.filter((r: any) => String(r.userId) !== String(me._id));
    others.push({ userId: me._id, readAt });
    (msg as any).readReceipts = others;
    await msg.save();

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to update read receipt" }, { status: 500 });
  }
}


