import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { CourseOffering } from "@/models/CourseOffering";
import { StudentCourse } from "@/models/StudentCourse";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);

    // Courses the student is enrolled in
    const studentCourses = await StudentCourse.find({ studentId: me._id }).lean();
    const courseIds = studentCourses.map((sc: any) => sc.courseId);

    // Course offerings for those courses
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } }).lean();
    const offeringIds = offerings.map((o: any) => o._id);

    const assignments = await Assignment.find({
      courseOfferingId: { $in: offeringIds },
      publishedAt: { $ne: null },
    })
      .populate({
        path: "courseOfferingId",
        populate: [
          { path: "courseId", select: "title code" },
          { path: "batchId", select: "title code" },
        ],
      })
      .sort({ dueAt: 1 })
      .lean();

    const now = new Date();
    const result = assignments.map((a: any) => {
      const completed = (a.completedEmails || []).some(
        (e: any) =>
          (e.studentId && e.studentId.toString() === me._id.toString()) ||
          (e.email && e.email.toLowerCase() === (me.email || "").toLowerCase())
      );
      const overdue = !!a.dueAt && new Date(a.dueAt) < now && !completed;
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        dueAt: a.dueAt,
        maxPoints: a.maxPoints,
        publishedAt: a.publishedAt,
        completed,
        overdue,
        course: a.courseOfferingId?.courseId
          ? { title: a.courseOfferingId.courseId.title, code: a.courseOfferingId.courseId.code }
          : null,
      };
    });

    return Response.json({ data: result, total: result.length });
  } catch (err) {
    console.error("Error fetching student assignments:", err);
    return Response.json({ error: { code: "INTERNAL", message: "Internal server error" } }, { status: 500 });
  }
}