import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Message } from "@/models";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const updated = await Message.findByIdAndUpdate(params.messageId, { $set: { body: body?.body, editedAt: new Date() } }, { new: true }).lean();
    if (!updated) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    return Response.json({ success: true, data: updated });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    await connectToDatabase();
    await Message.findByIdAndUpdate(params.messageId, { $set: { deletedAt: new Date() } });
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}


