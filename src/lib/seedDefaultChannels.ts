import { connectToDatabase } from "./mongodb";
import { Channel } from "@/models";
import type { IChannel } from "@/models";
import type { Model } from "mongoose";

/**
 * Seed default channels for a mission
 * Creates:
 * - Admin/Mentor messaging channel (non-student visibility)
 * - Mission-wide announcement channel (optional, if you want to use channels for announcements)
 */
export async function seedDefaultChannels(missionId: string, createdBy: string) {
  await connectToDatabase();
  const ChannelModel = Channel as unknown as Model<IChannel>;

  // 1. Admin/Mentor messaging channel
  const existingAdmin = await ChannelModel.findOne({ missionId, type: "mentor-messaging", visibility: "non-student" }).lean();
  if (!existingAdmin) {
    await ChannelModel.create({
      missionId,
      type: "mentor-messaging",
      visibility: "non-student",
      allowedRoles: ["admin", "moderator", "mentor", "superadmin", "sre"],
      createdBy,
    });
    console.log(`✅ Created admin/mentor messaging channel for mission ${missionId}`);
  } else {
    console.log(`ℹ️  Admin/mentor messaging channel already exists for mission ${missionId}`);
  }

  return { success: true };
}

/**
 * Seed a group-discussion channel for a mentorship group
 */
export async function seedGroupChannel(missionId: string, groupId: string, createdBy: string) {
  await connectToDatabase();
  const ChannelModel = Channel as unknown as Model<IChannel>;

  const existing = await ChannelModel.findOne({ missionId, groupId, type: "group-discussion" }).lean();
  if (!existing) {
    await ChannelModel.create({
      missionId,
      groupId,
      type: "group-discussion",
      visibility: "group",
      allowedRoles: ["student", "mentor", "admin", "moderator"],
      createdBy,
    });
    console.log(`✅ Created group discussion channel for group ${groupId}`);
  } else {
    console.log(`ℹ️  Group discussion channel already exists for group ${groupId}`);
  }

  return { success: true };
}
