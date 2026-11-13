import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
import type { IChannel } from "@/models";
import type { Model } from "mongoose";

const ChannelModel = Channel as unknown as Model<IChannel>;

/**
 * GET /api/v2/channels/[id]
 * Get a single channel by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const channel = await ChannelModel.findById(params.id)
      .populate('missionId', 'code title status')
      .populate('groupId', 'name')
      .populate('createdBy', 'name email')
      .lean();

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: channel });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to fetch channel" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v2/channels/[id]
 * Update a channel
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only moderators can edit channels
    const moderatorRoles = ['admin', 'developer', 'manager', 'sre', 'mentor'];
    if (!moderatorRoles.includes(me.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Check if channel exists
    const channel = await ChannelModel.findById(params.id);
    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updateData: any = {};
    if (body.type) updateData.type = body.type;
    if (body.visibility) updateData.visibility = body.visibility;
    if (body.allowedRoles) updateData.allowedRoles = body.allowedRoles;
    if (body.status) updateData.status = body.status;
    if (body.groupId !== undefined) updateData.groupId = body.groupId || undefined;

    const updatedChannel = await ChannelModel.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    )
      .populate('missionId', 'code title status')
      .populate('groupId', 'name')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to update channel" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/channels/[id]
 * Delete a channel
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins, developers, and managers can delete channels
    const canDelete = ['admin', 'developer', 'manager'];
    if (!canDelete.includes(me.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions. Only admin, developer, and manager can delete channels." },
        { status: 403 }
      );
    }

    // Check if channel exists
    const channel = await ChannelModel.findById(params.id);
    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    // Delete the channel
    await ChannelModel.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to delete channel" },
      { status: 500 }
    );
  }
}

