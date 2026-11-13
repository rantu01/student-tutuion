import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, StudentProfile, StudentBatchMembership, Batch } from '@/models';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking database connection...');
    await connectToDatabase();
    console.log('✅ Database connected successfully');

    console.log('🔍 Debug: Counting students in database...');
    
    // Count total users with student role
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`📊 Total students in database: ${totalStudents}`);

    // Count active students
    const activeStudents = await User.countDocuments({ 
      role: 'student', 
      isActive: true,
      deletedAt: { $exists: false }
    });
    console.log(`📊 Active students: ${activeStudents}`);

    // Count students with profiles
    const studentsWithProfiles = await StudentProfile.countDocuments({});
    console.log(`📊 Students with profiles: ${studentsWithProfiles}`);

    // Count students with completed profiles
    const studentsWithCompletedProfiles = await StudentProfile.countDocuments({
      completedAt: { $exists: true, $ne: null }
    });
    console.log(`📊 Students with completed profiles: ${studentsWithCompletedProfiles}`);

    // Count batch memberships
    const totalBatchMemberships = await StudentBatchMembership.countDocuments({});
    console.log(`📊 Total batch memberships: ${totalBatchMemberships}`);

    // Count approved batch memberships
    const approvedBatchMemberships = await StudentBatchMembership.countDocuments({
      status: 'approved'
    });
    console.log(`📊 Approved batch memberships: ${approvedBatchMemberships}`);

    // Get sample data
    const sampleStudents = await User.find({ role: 'student' })
      .select('_id name email studentId isActive profileCompleted mustChangePassword')
      .limit(3)
      .lean();
    
    const sampleProfiles = await StudentProfile.find()
      .select('userId firstName lastName phone completedAt')
      .limit(3)
      .lean();

    const sampleBatchMemberships = await StudentBatchMembership.find()
      .populate('batchId', 'code title')
      .populate('studentId', 'name email')
      .limit(3)
      .lean();

    return NextResponse.json({
      success: true,
      debug: {
        databaseConnected: true,
        totalStudents,
        activeStudents,
        studentsWithProfiles,
        studentsWithCompletedProfiles,
        totalBatchMemberships,
        approvedBatchMemberships,
        sampleStudents,
        sampleProfiles,
        sampleBatchMemberships
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        databaseConnected: false
      }
    }, { status: 500 });
  }
}
