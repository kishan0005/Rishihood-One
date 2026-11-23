import api from './src/config/prisma.js';
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 Starting Full-Stack Core Workflows Verification for Rishihood One...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.response?.data?.error || err.message}`);
      failed++;
    }
  };

  // 1. Health check
  await test('Server Health Check', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.data.status !== 'online') throw new Error('Status not online');
  });

  // 2. Authentication & Roles
  let studentToken = '';
  let facultyToken = '';
  let wardenToken = '';
  let adminToken = '';
  let studentUser: any = null;

  await test('Student Quick-Login', async () => {
    const res = await axios.post(`${BASE_URL}/auth/quick-login`, { role: 'STUDENT' });
    studentToken = res.data.token;
    studentUser = res.data.user;
    if (!studentToken || res.data.user.role !== 'STUDENT') throw new Error('Student auth failed');
  });

  await test('Faculty Quick-Login', async () => {
    const res = await axios.post(`${BASE_URL}/auth/quick-login`, { role: 'FACULTY' });
    facultyToken = res.data.token;
    if (!facultyToken || res.data.user.role !== 'FACULTY') throw new Error('Faculty auth failed');
  });

  await test('Warden Quick-Login', async () => {
    const res = await axios.post(`${BASE_URL}/auth/quick-login`, { role: 'WARDEN' });
    wardenToken = res.data.token;
    if (!wardenToken || res.data.user.role !== 'WARDEN') throw new Error('Warden auth failed');
  });

  await test('Admin Quick-Login', async () => {
    const res = await axios.post(`${BASE_URL}/auth/quick-login`, { role: 'ADMIN' });
    adminToken = res.data.token;
    if (!adminToken || res.data.user.role !== 'ADMIN') throw new Error('Admin auth failed');
  });

  await test('Verify Authenticated Profile (/auth/me)', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.data.user.email !== 'student@rishihood.edu.in') throw new Error('Profile mismatch');
  });

  // 3. Academics
  let courseId = '';
  let assignmentId = '';
  let submissionId = '';

  await test('Fetch Student Enrolled Courses', async () => {
    const res = await axios.get(`${BASE_URL}/academic/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.data.courses.length === 0) throw new Error('No courses found');
    courseId = res.data.courses[0].id;
  });

  await test('Fetch Student Attendance Records & Overall Percentage', async () => {
    const res = await axios.get(`${BASE_URL}/academic/attendance`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.data.overallPercentage === undefined || res.data.courseStats.length === 0) {
      throw new Error('Attendance summary missing');
    }
  });

  await test('Faculty Marks Live Session Attendance', async () => {
    const res = await axios.post(
      `${BASE_URL}/academic/attendance/mark`,
      {
        courseId,
        date: new Date().toISOString(),
        sessionTopic: 'Test Distributed Consensus Lecture',
        attendees: [{ studentId: studentUser.id, status: 'PRESENT', remarks: 'Active lab participation' }],
      },
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );
    if (!res.data.records || res.data.records.length === 0) throw new Error('Failed to mark attendance');
  });

  await test('Fetch Weekly Timetable', async () => {
    const res = await axios.get(`${BASE_URL}/academic/timetable`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!Array.isArray(res.data.slots) || res.data.slots.length === 0) {
      throw new Error('Timetable slots missing');
    }
  });

  await test('Fetch Assignments & Submissions', async () => {
    const res = await axios.get(`${BASE_URL}/academic/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.data.assignments.length === 0) throw new Error('No assignments');
    assignmentId = res.data.assignments[0].id;
  });

  await test('Student Submits Assignment Solution', async () => {
    const res = await axios.post(
      `${BASE_URL}/academic/assignments/${assignmentId}/submit`,
      {
        submissionText: 'Automated test suite verification solution for PyTorch scaled dot-product attention.',
        fileUrl: 'https://github.com/rishihood/verified-asgn.git',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (!res.data.submission) throw new Error('Submission response missing');
    submissionId = res.data.submission.id;
  });

  await test('Faculty Grades Student Submission', async () => {
    const res = await axios.post(
      `${BASE_URL}/academic/assignments/${assignmentId}/grade`,
      {
        submissionId,
        marksObtained: 98,
        feedback: 'Superb unit tests and attention head shapes.',
      },
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );
    if (res.data.submission.marksObtained !== 98) throw new Error('Grade not updated');
  });

  await test('Fetch Certified Academic Results & CGPA', async () => {
    const res = await axios.get(`${BASE_URL}/academic/results`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!res.data.cgpa || res.data.semesters.length === 0) throw new Error('Results missing');
  });

  // 4. Housing & Hostels
  await test('Fetch Housing Overview & Room Inventory', async () => {
    const res = await axios.get(`${BASE_URL}/housing/overview`, {
      headers: { Authorization: `Bearer ${wardenToken}` },
    });
    if (res.data.blocks.length === 0 || !res.data.metrics) throw new Error('Housing overview empty');
  });

  await test('Fetch Student Allocated Room & Roommates', async () => {
    const res = await axios.get(`${BASE_URL}/housing/my-room`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!res.data.allocation) throw new Error('No allocation returned');
  });

  let createdLeaveId = '';
  await test('Student Requests Campus Outing / Leave Pass', async () => {
    const res = await axios.post(
      `${BASE_URL}/housing/leaves`,
      {
        leaveType: 'DAY_OUTING',
        departureDate: new Date().toISOString(),
        returnDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        destination: 'Sonipat City Centre (Books & Hardware)',
        reason: 'Procuring embedded sensors for capstone design project.',
        parentContact: '+91 94123 45678',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (!res.data.leave?.id) throw new Error('Leave pass failed');
    createdLeaveId = res.data.leave.id;
  });

  await test('Warden Authorizes Gate Pass', async () => {
    const res = await axios.patch(
      `${BASE_URL}/housing/leaves/${createdLeaveId}`,
      {
        status: 'APPROVED',
        remarks: 'Confirmed with student mentor. Authorized for exit before 08:30 PM.',
      },
      { headers: { Authorization: `Bearer ${wardenToken}` } }
    );
    if (res.data.leave.status !== 'APPROVED') throw new Error('Leave pass authorization failed');
  });

  // 5. Complaints
  let complaintId = '';
  await test('Student Files Maintenance Complaint', async () => {
    const res = await axios.post(
      `${BASE_URL}/complaints`,
      {
        category: 'ELECTRICAL',
        title: 'Study Lamp Fixture Replacement',
        description: 'Bulb socket in desk lamp loose in Takshashila Room 204.',
        location: 'Takshashila Hall, Room 204',
        priority: 'MEDIUM',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (!res.data.complaint?.id) throw new Error('Complaint filing failed');
    complaintId = res.data.complaint.id;
  });

  await test('Warden Resolves Maintenance Complaint', async () => {
    const res = await axios.patch(
      `${BASE_URL}/complaints/${complaintId}`,
      {
        status: 'RESOLVED',
        resolutionNotes: 'Electrician installed new LED bulb and tightened fixture bracket.',
      },
      { headers: { Authorization: `Bearer ${wardenToken}` } }
    );
    if (res.data.complaint.status !== 'RESOLVED') throw new Error('Complaint status not resolved');
  });

  // 6. Fees
  let pendingInvoiceId = '';
  await test('Fetch Student Fees & Summary', async () => {
    const res = await axios.get(`${BASE_URL}/fees`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!res.data.invoices || !res.data.summary) throw new Error('Fees data missing');
    const pending = res.data.invoices.find((i: any) => i.status === 'PENDING');
    if (pending) pendingInvoiceId = pending.id;
  });

  if (pendingInvoiceId) {
    await test('Student Pays Fee Invoice & Generates Receipt', async () => {
      const res = await axios.post(
        `${BASE_URL}/fees/${pendingInvoiceId}/pay`,
        { paymentMethod: 'UPI Instant NetBanking' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      if (res.data.invoice.status !== 'PAID' || !res.data.invoice.transactionRef) {
        throw new Error('Payment transaction verification failed');
      }
    });
  }

  // 7. Dining Menu
  await test('Fetch Weekly Dining Schedule', async () => {
    const res = await axios.get(`${BASE_URL}/dining/menu`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!res.data.weeklyMenu?.MONDAY) throw new Error('Dining menu empty');
  });

  await test('Warden Updates Dining Menu', async () => {
    const res = await axios.put(
      `${BASE_URL}/dining/menu`,
      {
        dayOfWeek: 'MONDAY',
        mealType: 'DINNER',
        items: 'Paneer Makhani, Dal Panchratna, Kashmiri Pulao, Butter Naan, Gulab Jamun',
        specialDiet: 'Vegetarian & Jain Available',
        timing: '08:00 PM - 10:00 PM',
      },
      { headers: { Authorization: `Bearer ${wardenToken}` } }
    );
    if (!res.data.item) throw new Error('Failed to update menu');
  });

  // 8. Campus Events
  let eventId = '';
  await test('Fetch Campus Events & RSVP Status', async () => {
    const res = await axios.get(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.data.events.length === 0) throw new Error('Events list empty');
    eventId = res.data.events[0].id;
  });

  await test('Student Toggles Event RSVP', async () => {
    const res = await axios.post(
      `${BASE_URL}/events/${eventId}/rsvp`,
      {},
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.data.registered === undefined) throw new Error('RSVP toggle failed');
  });

  // 9. Admin Console & Analytics
  await test('Fetch University-Wide Administrative KPIs', async () => {
    const res = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.data.counts || !res.data.housing || !res.data.finance) {
      throw new Error('Admin stats schema mismatch');
    }
  });

  await test('Admin Queries User Directory', async () => {
    const res = await axios.get(`${BASE_URL}/admin/users?role=ALL`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!Array.isArray(res.data.users) || res.data.users.length === 0) {
      throw new Error('Users directory empty');
    }
  });

  console.log(`\n========================================`);
  console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});

