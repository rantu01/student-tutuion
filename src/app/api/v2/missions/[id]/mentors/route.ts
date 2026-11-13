import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2, MissionV2 } from '@/models/v2';

// GET /api/v2/missions/:id/mentors
// Returns a normalized list of mentors for the given mission id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // Ensure the mission exists and get its batchId (if any)
    const mission = await MissionV2.findById(id).lean();
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Query mentors assigned to this mission
    const mm = await MissionMentorV2.find({ missionId: id })
      .populate('mentorId', 'name email role')
      .lean();

    const mentors = (mm || []).map((item: any) => ({
      _id: item?.mentorId?._id || item?._id,
      name: item?.mentorId?.name ?? item?.name ?? 'Mentor',
      email: item?.mentorId?.email ?? item?.email ?? '',
      specialization: Array.isArray(item?.specialization) ? item.specialization.join(', ') : (item?.specialization ?? ''),
      assignedStudents: item?.assignedStudents ?? [],
      totalStudents: typeof item?.currentStudents === 'number' ? item.currentStudents : (item?.assignedStudents?.length ?? 0),
      status: item?.status ?? 'active',
    }));

    return NextResponse.json({ success: true, mentors });
  } catch (error) {
    console.error('V2 Mission mentors list error:', error);
    return NextResponse.json({ error: 'Failed to fetch mission mentors' }, { status: 500 });
  }
}


