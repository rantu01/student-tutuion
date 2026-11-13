import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Post } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const role = String(me.role || '').toLowerCase();
    if (!['admin','moderator','superadmin','sre','mentor'].includes(role)) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const pinned = Boolean(body?.pinned);
    const updated = await Post.findByIdAndUpdate(params.id, { $set: { pinned } }, { new: true }).lean();
    if (!updated) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    return Response.json({ success: true, data: { pinned: updated.pinned } });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}


