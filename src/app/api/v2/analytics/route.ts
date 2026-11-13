import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroupV2, MissionV2, MissionMentorV2, MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 ANALYTICS API ROUTE
// GET: Get analytics data for groups, missions, etc.

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'groups';
    const timeRange = searchParams.get('timeRange') || '30d';
    const missionId = searchParams.get('missionId');
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    if (type === 'groups') {
      return await getGroupAnalytics(startDate);
    } else if (type === 'missions') {
      return await getMissionAnalytics(startDate);
    } else if (type === 'mentors') {
      if (!missionId) {
        return NextResponse.json(
          { success: false, error: 'missionId is required for mentors analytics' },
          { status: 400 }
        );
      }
      return await getMentorAnalytics(startDate, missionId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid analytics type' },
        { status: 400 }
      );
    }
    
  } catch (error: unknown) {
    console.error('V2 Analytics GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

async function getGroupAnalytics(startDate: Date) {
  try {
    // Get all groups with populated data
    const groups = await MentorshipGroupV2.find()
      .populate('missionId', 'code title status')
      .populate('primaryMentorId', 'name email role')
      .populate('students', 'name email studentId')
      .populate('mentors', 'name email role')
      .lean();
    
    // Calculate basic metrics
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.status === 'active').length;
    const totalStudents = groups.reduce((sum, g) => sum + g.students.length, 0);
    const totalMentors = groups.reduce((sum, g) => sum + g.mentors.length, 0);
    const averageGroupSize = totalGroups > 0 ? totalStudents / totalGroups : 0;
    
    // Calculate capacity utilization (handle unlimited groups)
    const limitedGroups = groups.filter(g => g.maxStudents > 0);
    const totalCapacity = limitedGroups.reduce((sum, g) => sum + g.maxStudents, 0);
    const studentsInLimitedGroups = limitedGroups.reduce((sum, g) => sum + g.students.length, 0);
    const capacityUtilization = totalCapacity > 0 ? (studentsInLimitedGroups / totalCapacity) * 100 : 0;
    
    // Group types distribution
    const groupTypes = {
      mentorship: groups.filter(g => g.groupType === 'mentorship').length,
      study: groups.filter(g => g.groupType === 'study').length,
      project: groups.filter(g => g.groupType === 'project').length,
      collaborative: groups.filter(g => g.groupType === 'collaborative').length
    };
    
    // Status distribution
    const statusDistribution = {
      active: groups.filter(g => g.status === 'active').length,
      inactive: groups.filter(g => g.status === 'inactive').length,
      full: groups.filter(g => g.status === 'full').length,
      recruiting: groups.filter(g => g.status === 'recruiting').length
    };
    
    // Top performing groups (by capacity utilization)
    const topPerformingGroups = groups
      .map(group => ({
        _id: group._id,
        name: group.name,
        missionId: group.missionId,
        currentStudents: group.students.length,
        maxStudents: group.maxStudents,
        mentors: group.mentors.length,
        status: group.status,
        capacityPercentage: group.maxStudents > 0 ? Math.round((group.students.length / group.maxStudents) * 100) : 100
      }))
      .sort((a, b) => b.capacityPercentage - a.capacityPercentage)
      .slice(0, 10);
    
    // Mission breakdown
    const missionBreakdown = groups.reduce((acc, group) => {
      const missionId = group.missionId._id.toString();
      if (!acc[missionId]) {
        acc[missionId] = {
          missionId: group.missionId,
          groupCount: 0,
          studentCount: 0,
          mentorCount: 0
        };
      }
      acc[missionId].groupCount++;
      acc[missionId].studentCount += group.students.length;
      acc[missionId].mentorCount += group.mentors.length;
      return acc;
    }, {} as Record<string, any>);
    
    // Recent activity (mock data for now)
    const recentActivity = [
      {
        _id: '1',
        type: 'group_created',
        description: 'New group created',
        timestamp: new Date().toISOString(),
        groupName: 'Sample Group'
      },
      {
        _id: '2',
        type: 'student_added',
        description: 'Student added to group',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        groupName: 'Sample Group'
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: {
        totalGroups,
        activeGroups,
        totalStudents,
        totalMentors,
        averageGroupSize,
        capacityUtilization,
        groupTypes,
        statusDistribution,
        recentActivity,
        topPerformingGroups,
        missionBreakdown: Object.values(missionBreakdown)
      }
    });
    
  } catch (error) {
    console.error('Group Analytics Error:', error);
    throw error;
  }
}

async function getMissionAnalytics(startDate: Date) {
  try {
    // Get all missions with populated data
    const missions = await MissionV2.find()
      .populate('batchId', 'name code')
      .lean();
    
    // Get mission mentors and students
    const [missionMentors, missionStudents] = await Promise.all([
      MissionMentorV2.find().populate('mentorId', 'name email role').lean(),
      MissionStudentV2.find().populate('studentId', 'name email studentId').lean()
    ]);
    
    // Calculate basic metrics
    const totalMissions = missions.length;
    const activeMissions = missions.filter(m => m.status === 'active').length;
    const totalMentors = missionMentors.length;
    const totalStudents = missionStudents.length;
    
    // Mission status distribution
    const statusDistribution = {
      active: missions.filter(m => m.status === 'active').length,
      inactive: missions.filter(m => m.status === 'inactive').length,
      completed: missions.filter(m => m.status === 'completed').length,
      planning: missions.filter(m => m.status === 'planning').length
    };
    
    // Top missions by student count
    const topMissions = missions
      .map(mission => {
        const missionStudentsCount = missionStudents.filter(ms => ms.missionId.toString() === mission._id.toString()).length;
        const missionMentorsCount = missionMentors.filter(mm => mm.missionId.toString() === mission._id.toString()).length;
        
        return {
          _id: mission._id,
          code: mission.code,
          title: mission.title,
          status: mission.status,
          studentCount: missionStudentsCount,
          mentorCount: missionMentorsCount,
          batchId: mission.batchId
        };
      })
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      data: {
        totalMissions,
        activeMissions,
        totalMentors,
        totalStudents,
        statusDistribution,
        topMissions
      }
    });
    
  } catch (error) {
    console.error('Mission Analytics Error:', error);
    throw error;
  }
}

async function getMentorAnalytics(startDate: Date, missionId: string) {
  try {
    // Fetch mentors for the mission
    const mentors = await MissionMentorV2.find({ missionId })
      .populate('mentorId', 'name email role')
      .lean();

    // Basic derived fields with safe defaults
    const mentorAnalytics = mentors.map((mm) => {
      const mentorName = (mm as any).mentorId?.name || 'Unknown Mentor';
      const mentorEmail = (mm as any).mentorId?.email || '';
      const role = mm.role || 'advisor';
      const status = mm.status || 'active';

      const totalStudents = mm.totalMentoredStudents || mm.currentStudents || 0;
      const activeStudents = mm.currentStudents || 0;
      const completedStudents = 0; // Not tracked in V2 yet
      const failedStudents = 0; // Not tracked in V2 yet

      const averageProgress = mm.stats?.avgStudentProgress ?? 0;
      const studentSuccessRate = mm.stats?.studentSatisfaction ? Math.min(100, (mm.stats.studentSatisfaction / 5) * 100) : 0;

      const totalMeetings = mm.totalSessions || 0;
      const completedMeetings = mm.totalSessions || 0;
      const cancelledMeetings = 0; // Not tracked in V2 yet
      const noShowMeetings = 0; // Not tracked in V2 yet
      const meetingSuccessRate = mm.stats?.sessionCompletionRate ?? 0;

      const currentWorkload = mm.currentStudents || 0;
      const maxStudents = mm.maxStudents || 0;
      const workloadEfficiency = maxStudents > 0 ? Math.round((currentWorkload / maxStudents) * 100) : 100;
      const workloadStatus = maxStudents > 0
        ? (currentWorkload >= maxStudents ? 'full' : currentWorkload > maxStudents * 0.8 ? 'high' : 'normal')
        : 'unlimited';

      const specialization = mm.specialization || [];
      const performanceScore = Math.round((averageProgress * 0.6) + (meetingSuccessRate * 0.2) + (studentSuccessRate * 0.2));

      return {
        mentorId: mm.mentorId?.toString?.() || (mm as any).mentorId?._id?.toString?.() || '',
        mentorName,
        mentorEmail,
        role,
        status,
        totalStudents,
        activeStudents,
        completedStudents,
        failedStudents,
        averageProgress,
        studentSuccessRate,
        totalMeetings,
        completedMeetings,
        cancelledMeetings,
        noShowMeetings,
        meetingSuccessRate,
        currentWorkload,
        maxStudents,
        workloadEfficiency,
        workloadStatus,
        specialization,
        performanceScore
      };
    });

    // Overall stats
    const overallStats = {
      totalMentors: mentorAnalytics.length,
      averageStudentSuccessRate: mentorAnalytics.length > 0
        ? Number((mentorAnalytics.reduce((s, m) => s + (m.studentSuccessRate || 0), 0) / mentorAnalytics.length).toFixed(1))
        : 0,
      averageMeetingSuccessRate: mentorAnalytics.length > 0
        ? Number((mentorAnalytics.reduce((s, m) => s + (m.meetingSuccessRate || 0), 0) / mentorAnalytics.length).toFixed(1))
        : 0,
      averagePerformanceScore: mentorAnalytics.length > 0
        ? Number((mentorAnalytics.reduce((s, m) => s + (m.performanceScore || 0), 0) / mentorAnalytics.length).toFixed(1))
        : 0,
      totalStudents: mentorAnalytics.reduce((s, m) => s + (m.totalStudents || 0), 0),
      totalMeetings: mentorAnalytics.reduce((s, m) => s + (m.totalMeetings || 0), 0)
    };

    // Top performers (by performanceScore)
    const topPerformers = [...mentorAnalytics]
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, 6);

    // Mentors needing attention (low performance or overloaded)
    const mentorsNeedingAttention = mentorAnalytics.filter(m => (m.performanceScore || 0) < 60 || m.workloadStatus === 'full');

    return NextResponse.json({
      success: true,
      data: {
        mentorAnalytics,
        overallStats,
        topPerformers,
        mentorsNeedingAttention
      }
    });
  } catch (error) {
    console.error('Mentor Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to compute mentor analytics' }, { status: 500 });
  }
}