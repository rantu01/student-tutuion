import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { Batch } from '@/models/Batch';
import { Course } from '@/models/Course';
import { Semester } from '@/models/Semester';
import { CourseOffering } from '@/models/CourseOffering';
import { Mission } from '@/models/Mission';
import { StudentProfile } from '@/models/StudentProfile';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins can clear the database
    if (me.role !== 'admin') {
      return createErrorResponse('Insufficient permissions', 403);
    }

    console.log('🗑️ Starting database cleanup...');

    // Get counts before deletion
    const counts = {
      users: await User.countDocuments(),
      batches: await Batch.countDocuments(),
      courses: await Course.countDocuments(),
      semesters: await Semester.countDocuments(),
      courseOfferings: await CourseOffering.countDocuments(),
      missions: await Mission.countDocuments()
    };

    // Delete all data except the current admin user
    console.log('🧹 Clearing database collections...');
    
    // Delete missions first (they reference other collections)
    const missionsDeleted = await Mission.deleteMany({});
    console.log('✅ Missions deleted:', missionsDeleted.deletedCount);

    // Delete course offerings
    const courseOfferingsDeleted = await CourseOffering.deleteMany({});
    console.log('✅ Course offerings deleted:', courseOfferingsDeleted.deletedCount);

    // Delete semesters
    const semestersDeleted = await Semester.deleteMany({});
    console.log('✅ Semesters deleted:', semestersDeleted.deletedCount);

    // Delete courses
    const coursesDeleted = await Course.deleteMany({});
    console.log('✅ Courses deleted:', coursesDeleted.deletedCount);

    // Delete batches
    const batchesDeleted = await Batch.deleteMany({});
    console.log('✅ Batches deleted:', batchesDeleted.deletedCount);

    // Delete student profiles
    const profilesDeleted = await StudentProfile.deleteMany({});
    console.log('✅ Student profiles deleted:', profilesDeleted.deletedCount);

    // Delete all users except the current admin
    const usersDeleted = await User.deleteMany({ _id: { $ne: me._id } });
    console.log('✅ Users deleted:', usersDeleted.deletedCount);

    // Get final counts
    const finalCounts = {
      users: await User.countDocuments(),
      batches: await Batch.countDocuments(),
      courses: await Course.countDocuments(),
      semesters: await Semester.countDocuments(),
      courseOfferings: await CourseOffering.countDocuments(),
      missions: await Mission.countDocuments()
    };

    const summary = {
      deleted: {
        users: counts.users - finalCounts.users,
        batches: counts.batches,
        courses: counts.courses,
        semesters: counts.semesters,
        courseOfferings: counts.courseOfferings,
        missions: counts.missions
      },
      remaining: finalCounts
    };

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:', summary);

    return createSuccessResponse(summary, 'Database cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return handleApiError(error);
  }
}
