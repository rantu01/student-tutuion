import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentProfile } from "@/models/StudentProfile";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const profiles = await StudentProfile.find({}).lean();
    let fixed = 0;

    for (const p of profiles) {
      const current = p.username || "";
      if (current.length <= 30) continue;

      // Build a short username from firstName, fallback to id slice
      let base = (p.firstName || "student").toLowerCase().replace(/[^a-z0-9_]/gi, "").slice(0, 12) || "student";
      if (base.length < 3) base = "student";

      let candidate = `${base}_${p._id.toString().slice(-6)}`;
      if (candidate.length > 30) candidate = candidate.slice(0, 30);

      let suffix = 0;
      while (await StudentProfile.findOne({ username: candidate, _id: { $ne: p._id } })) {
        suffix++;
        candidate = `${base}_${p._id.toString().slice(-6)}${suffix}`;
        if (candidate.length > 30) candidate = candidate.slice(0, 30);
      }

      await StudentProfile.updateOne({ _id: p._id }, { $set: { username: candidate } });
      fixed++;
    }

    return NextResponse.json({ ok: true, fixed, total: profiles.length });
  } catch (error) {
    console.error("Fix usernames error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}