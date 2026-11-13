import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const students = await User.find({ role: "student" }).lean();
    let created = 0;
    let skipped = 0;

    for (const u of students) {
      const exists = await StudentProfile.findOne({ userId: u._id });
      if (exists) { skipped++; continue; }

      const parts = (u.name || "").trim().split(/\s+/);
      const firstName = parts[0] || "Student";
      const lastName = parts.slice(1).join(" ") || "User";

      const shortUser = (u.username || u.studentId || "").toString().slice(0, 24);
      const username = shortUser.length >= 3
        ? shortUser
        : `student_${u._id.toString().slice(-8)}`;

      await StudentProfile.create({
        userId: u._id,
        firstName,
        lastName,
        username,
        phone: u.phone || "+1-555-0000",
        completedAt: new Date(),
      });
      created++;
    }

    return NextResponse.json({ ok: true, created, skipped, total: students.length });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}