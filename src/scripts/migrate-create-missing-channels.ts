/**
 * Migration Script: Create Missing Channels for Existing Mentorship Groups
 * 
 * This script finds all mentorship groups (V1 and V2) that don't have
 * group-discussion and group-announcement channels and creates them.
 * 
 * Run with: npx ts-node src/scripts/migrate-create-missing-channels.ts
 */

import { connectToDatabase } from '@/lib/mongodb';
import { Channel } from '@/models';
import { MentorshipGroup } from '@/models/MentorshipGroup';
import MentorshipGroupV2 from '@/models/v2/MentorshipGroup';
import type { IChannel } from '@/models';
import type { Model } from 'mongoose';

const ChannelModel = Channel as unknown as Model<IChannel>;

interface MigrationResult {
  totalGroups: number;
  groupsProcessed: number;
  channelsCreated: number;
  errors: Array<{ groupId: string; groupName: string; error: string }>;
  groupsWithChannels: number;
}

async function migrateCreateMissingChannels(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalGroups: 0,
    groupsProcessed: 0,
    channelsCreated: 0,
    errors: [],
    groupsWithChannels: 0,
  };

  try {
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Get all V2 mentorship groups
    const groupsV2 = await MentorshipGroupV2.find({ status: { $in: ['active', 'inactive', 'full', 'recruiting'] } }).lean();
    console.log(`📊 Found ${groupsV2.length} V2 mentorship groups`);

    // Get all V1 mentorship groups
    const groupsV1 = await MentorshipGroup.find({ status: { $in: ['active', 'inactive'] } }).lean();
    console.log(`📊 Found ${groupsV1.length} V1 mentorship groups`);

    const allGroups = [
      ...groupsV2.map(g => ({ ...g, version: 'v2', name: g.name })),
      ...groupsV1.map(g => ({ ...g, version: 'v1', name: g.groupName })),
    ];

    result.totalGroups = allGroups.length;
    console.log(`📊 Total groups to process: ${result.totalGroups}`);
    console.log('');

    for (const group of allGroups) {
      try {
        console.log(`🔍 Processing ${group.version.toUpperCase()} group: ${group.name} (${group._id})`);

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
          console.log(`  ✅ Both channels already exist`);
          result.groupsWithChannels++;
        } else {
          let created = 0;

          // Create group-discussion channel if missing
          if (!discussionChannel) {
            try {
              await ChannelModel.create({
                missionId: group.missionId,
                groupId: group._id,
                type: 'group-discussion',
                visibility: 'group',
                allowedRoles: ['admin', 'manager', 'sre', 'mentor', 'student'],
                createdBy: group.createdBy || (group as any).mentors?.[0]?.mentorId || null,
              });
              console.log(`  ✅ Created group-discussion channel`);
              created++;
              result.channelsCreated++;
            } catch (err: any) {
              console.error(`  ❌ Failed to create discussion channel: ${err.message}`);
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
                createdBy: group.createdBy || (group as any).mentors?.[0]?.mentorId || null,
              });
              console.log(`  ✅ Created group-announcement channel`);
              created++;
              result.channelsCreated++;
            } catch (err: any) {
              console.error(`  ❌ Failed to create announcement channel: ${err.message}`);
              result.errors.push({
                groupId: String(group._id),
                groupName: group.name,
                error: `Announcement channel: ${err.message}`,
              });
            }
          }

          if (created > 0) {
            console.log(`  🎉 Created ${created} channel(s) for group`);
          }
        }

        result.groupsProcessed++;
        console.log('');
      } catch (err: any) {
        console.error(`❌ Error processing group ${group.name}: ${err.message}`);
        result.errors.push({
          groupId: String(group._id),
          groupName: group.name,
          error: err.message,
        });
      }
    }

    return result;
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}

// Run migration
async function main() {
  console.log('🚀 Starting migration: Create Missing Channels for Mentorship Groups');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await migrateCreateMissingChannels();

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ Migration completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total groups: ${result.totalGroups}`);
    console.log(`   Groups processed: ${result.groupsProcessed}`);
    console.log(`   Groups with existing channels: ${result.groupsWithChannels}`);
    console.log(`   Channels created: ${result.channelsCreated}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('⚠️ Errors encountered:');
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.groupName} (${err.groupId}): ${err.error}`);
      });
    }

    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { migrateCreateMissingChannels };


