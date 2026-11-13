import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Channel } from '@/models';
import { MentorshipGroup } from '@/models/MentorshipGroup';
import MentorshipGroupV2 from '@/models/v2/MentorshipGroup';
import { getAuthUserFromRequest } from '@/lib/rbac';
import type { IChannel } from '@/models';
import type { Model } from 'mongoose';

const ChannelModel = Channel as unknown as Model<IChannel>;

/**
 * POST /api/admin/migrate-channels
 * 
 * Creates missing channels for existing mentorship groups
 * Only accessible by admin, developer, manager, and sre roles
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check authentication and authorization
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const privilegedRoles = ['admin', 'developer', 'manager', 'sre'];
    if (!privilegedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admin, developer, manager, and sre can run migrations.' },
        { status: 403 }
      );
    }

    const result = {
      totalGroups: 0,
      groupsProcessed: 0,
      channelsCreated: 0,
      errors: [] as Array<{ groupId: string; groupName: string; error: string }>,
      groupsWithChannels: 0,
      details: [] as Array<{ groupId: string; groupName: string; version: string; channelsCreated: string[] }>,
    };

    // Get all V2 mentorship groups
    const groupsV2 = await MentorshipGroupV2.find({
      status: { $in: ['active', 'inactive', 'full', 'recruiting'] },
    }).lean();

    // Get all V1 mentorship groups
    const groupsV1 = await MentorshipGroup.find({
      status: { $in: ['active', 'inactive'] },
    }).lean();

    const allGroups = [
      ...groupsV2.map((g) => ({ ...g, version: 'v2', name: g.name })),
      ...groupsV1.map((g) => ({ ...g, version: 'v1', name: g.groupName })),
    ];

    result.totalGroups = allGroups.length;

    for (const group of allGroups) {
      try {
        const groupDetail = {
          groupId: String(group._id),
          groupName: group.name,
          version: group.version,
          channelsCreated: [] as string[],
        };

        // Check if group-discussion channel exists
        const discussionChannel = await ChannelModel.findOne({
          groupId: group._id,
          type: 'group-discussion',
        }).lean();

        // Check if group-announcement channel exists
        const announcementChannel = await ChannelModel.findOne({
          groupId: group._id,
          type: 'group-announcement',
        }).lean();

        if (discussionChannel && announcementChannel) {
          result.groupsWithChannels++;
        } else {
          // Create group-discussion channel if missing
          if (!discussionChannel) {
            try {
              await ChannelModel.create({
                missionId: group.missionId,
                groupId: group._id,
                type: 'group-discussion',
                visibility: 'group',
                allowedRoles: ['admin', 'manager', 'sre', 'mentor', 'student'],
                createdBy: user._id,
              });
              groupDetail.channelsCreated.push('group-discussion');
              result.channelsCreated++;
            } catch (err: any) {
              result.errors.push({
                groupId: String(group._id),
                groupName: group.name,
                error: `Discussion channel: ${err.message}`,
              });
            }
          }

          // Create group-announcement channel if missing
          if (!announcementChannel) {
            try {
              await ChannelModel.create({
                missionId: group.missionId,
                groupId: group._id,
                type: 'group-announcement',
                visibility: 'group',
                allowedRoles: ['admin', 'manager', 'sre', 'mentor'],
                createdBy: user._id,
              });
              groupDetail.channelsCreated.push('group-announcement');
              result.channelsCreated++;
            } catch (err: any) {
              result.errors.push({
                groupId: String(group._id),
                groupName: group.name,
                error: `Announcement channel: ${err.message}`,
              });
            }
          }

          if (groupDetail.channelsCreated.length > 0) {
            result.details.push(groupDetail);
          }
        }

        result.groupsProcessed++;
      } catch (err: any) {
        result.errors.push({
          groupId: String(group._id),
          groupName: group.name,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Channel migration completed',
      data: result,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Migration failed' },
      { status: 500 }
    );
  }
}


