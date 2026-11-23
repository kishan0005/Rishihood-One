import { PrismaClient, Role, DayOfWeek, AttendanceStatus, SubmissionStatus, ExamType, GenderType, RoomType, RoomStatus, AllocationStatus, LeaveType, LeaveStatus, ComplaintCategory, ComplaintPriority, ComplaintStatus, FeeType, InvoiceStatus, MealType, EventCategory, NotificationCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Rishihood One database seeding...');

  // Clear existing records in correct order
  await prisma.notification.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.campusEvent.deleteMany();
  await prisma.diningMenu.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.hostelApplication.deleteMany();
  await prisma.hostelAllocation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostelBlock.deleteMany();
  await prisma.academicResult.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Rishihood@123', 10);

  // 1. Create Core Users
  const studentAarav = await prisma.user.create({
    data: {
      email: 'student@rishihood.edu.in',
      passwordHash,
      name: 'Aarav Sharma',
      role: Role.STUDENT,
      phone: '+91 98765 43210',
      department: 'Computer Science & Engineering',
      identifierNo: 'RU2023CSE042',
      semester: 6,
      batch: '2022-2026',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });

  const studentPriya = await prisma.user.create({
    data: {
      email: 'priya@rishihood.edu.in',
      passwordHash,
      name: 'Priya Nair',
      role: Role.STUDENT,
      phone: '+91 98765 43211',
      department: 'Data Science & AI',
      identifierNo: 'RU2023DSAI019',
      semester: 6,
      batch: '2022-2026',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const facultyDrRoy = await prisma.user.create({
    data: {
      email: 'faculty@rishihood.edu.in',
      passwordHash,
      name: 'Dr. Ananya Roy',
      role: Role.FACULTY,
      phone: '+91 98765 43212',
      department: 'Computer Science & Engineering',
      identifierNo: 'FAC-CSE-004',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const wardenRajesh = await prisma.user.create({
    data: {
      email: 'warden@rishihood.edu.in',
      passwordHash,
      name: 'Col. Rajesh Verma (Retd.)',
      role: Role.WARDEN,
      phone: '+91 98765 43213',
      department: 'Student Housing & Discipline',
      identifierNo: 'WRD-TAK-001',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const adminMalhotra = await prisma.user.create({
    data: {
      email: 'admin@rishihood.edu.in',
      passwordHash,
      name: 'Dean Vikram Malhotra',
      role: Role.ADMIN,
      phone: '+91 98765 43214',
      department: 'Dean of Academic Affairs',
      identifierNo: 'ADM-RU-001',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  console.log('✅ Users created');

  // 2. Create Courses
  const cse301 = await prisma.course.create({
    data: {
      code: 'CS301',
      name: 'Artificial Intelligence & Deep Learning',
      credits: 4,
      department: 'Computer Science & Engineering',
      semester: 6,
      facultyId: facultyDrRoy.id,
      description: 'Foundations of Neural Networks, CNNs, Transformers, LLMs, and Computer Vision pipelines.',
      syllabus: 'Unit 1: Optimization & Backpropagation; Unit 2: CNN & Vision; Unit 3: Attention & Transformers; Unit 4: Reinforcement Learning & Ethics.',
    },
  });

  const cse302 = await prisma.course.create({
    data: {
      code: 'CS302',
      name: 'Cloud Architecture & Distributed Systems',
      credits: 4,
      department: 'Computer Science & Engineering',
      semester: 6,
      facultyId: facultyDrRoy.id,
      description: 'Distributed consensus algorithms, microservices, containerization with Kubernetes, and multi-cloud resilience.',
      syllabus: 'Unit 1: Distributed Storage & CAP; Unit 2: Consensus (Raft/Paxos); Unit 3: Kubernetes internals; Unit 4: Cloud-native observability.',
    },
  });

  const cse304 = await prisma.course.create({
    data: {
      code: 'CS304',
      name: 'Advanced Database Systems & Performance',
      credits: 3,
      department: 'Computer Science & Engineering',
      semester: 6,
      facultyId: facultyDrRoy.id,
      description: 'Query optimization, indexing strategies, distributed transactions, and modern vector storage.',
      syllabus: 'Unit 1: B-Trees & LSM Trees; Unit 2: Query Optimization; Unit 3: ACID vs BASE; Unit 4: Vector Embeddings & Graph DBs.',
    },
  });

  const des201 = await prisma.course.create({
    data: {
      code: 'DES201',
      name: 'Design Thinking & Social Innovation',
      credits: 2,
      department: 'Rishihood Interdisciplinary Core',
      semester: 6,
      description: 'Human-centric design paradigms, empathy mapping, rapid prototyping for societal impact.',
      syllabus: 'Empathy research, problem framing, iterative prototyping, user testing, and field impact measurements.',
    },
  });

  console.log('✅ Courses created');

  // 3. Enrollments
  for (const course of [cse301, cse302, cse304, des201]) {
    await prisma.enrollment.create({
      data: {
        studentId: studentAarav.id,
        courseId: course.id,
        semester: 6,
        academicYear: '2024-2025',
      },
    });
    await prisma.enrollment.create({
      data: {
        studentId: studentPriya.id,
        courseId: course.id,
        semester: 6,
        academicYear: '2024-2025',
      },
    });
  }
  console.log('✅ Enrollments created');

  // 4. Timetable Slots
  const timetableData = [
    { courseId: cse301.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '10:15', roomNo: 'LH-102', batch: 'B.Tech CSE-6A' },
    { courseId: cse302.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.MONDAY, startTime: '10:30', endTime: '11:45', roomNo: 'LH-104', batch: 'B.Tech CSE-6A' },
    { courseId: cse304.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '11:00', endTime: '12:15', roomNo: 'Lab-301', batch: 'B.Tech CSE-6A' },
    { courseId: cse301.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '10:15', roomNo: 'LH-102', batch: 'B.Tech CSE-6A' },
    { courseId: des201.id, facultyId: null, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '15:30', roomNo: 'Design Studio 1', batch: 'RU-Core' },
    { courseId: cse302.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '11:45', roomNo: 'LH-104', batch: 'B.Tech CSE-6A' },
    { courseId: cse304.id, facultyId: facultyDrRoy.id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:30', endTime: '11:00', roomNo: 'Lab-301', batch: 'B.Tech CSE-6A' },
  ];

  for (const slot of timetableData) {
    await prisma.timetableSlot.create({ data: slot });
  }
  console.log('✅ Timetable created');

  // 5. Attendance Records
  const attendanceDates = [
    { date: new Date('2025-02-10T09:00:00Z'), topic: 'Introduction to Backpropagation & Loss Landscape' },
    { date: new Date('2025-02-12T09:00:00Z'), topic: 'Convolutional Neural Networks & ResNets' },
    { date: new Date('2025-02-17T09:00:00Z'), topic: 'Self-Attention Mechanisms & Multi-Head Attention' },
    { date: new Date('2025-02-19T09:00:00Z'), topic: 'Transformer Encoders (BERT) & Decoders (GPT)' },
    { date: new Date('2025-02-24T09:00:00Z'), topic: 'Diffusion Models & Generative Adversarial Networks' },
    { date: new Date('2025-02-26T09:00:00Z'), topic: 'Fine-Tuning LLMs with LoRA & QLoRA' },
    { date: new Date('2025-03-03T09:00:00Z'), topic: 'Retrieval Augmented Generation (RAG) Architecture' },
    { date: new Date('2025-03-05T09:00:00Z'), topic: 'Model Evaluation, Perplexity & Hallucination Mitigation' },
  ];

  for (let i = 0; i < attendanceDates.length; i++) {
    const item = attendanceDates[i];
    // Aarav was absent on lecture 4
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        courseId: cse301.id,
        date: item.date,
        status: i === 3 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        sessionTopic: item.topic,
        remarks: i === 3 ? 'Medical leave slip submitted' : 'Active participant',
      },
    });

    // Priya attended all
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentPriya.id,
        courseId: cse301.id,
        date: item.date,
        status: AttendanceStatus.PRESENT,
        sessionTopic: item.topic,
      },
    });
  }

  // Attendance for CS302 as well
  const cs302Dates = [
    { date: new Date('2025-02-11T10:30:00Z'), topic: 'Distributed Consensus & Raft Protocol' },
    { date: new Date('2025-02-13T10:30:00Z'), topic: 'Kubernetes Pod Architecture & Service Mesh' },
    { date: new Date('2025-02-18T10:30:00Z'), topic: 'Event Streaming with Apache Kafka' },
    { date: new Date('2025-02-20T10:30:00Z'), topic: 'CQRS and Event Sourcing Paradigms' },
  ];
  for (const item of cs302Dates) {
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        courseId: cse302.id,
        date: item.date,
        status: AttendanceStatus.PRESENT,
        sessionTopic: item.topic,
      },
    });
  }
  console.log('✅ Attendance records created');

  // 6. Assignments
  const asgn1 = await prisma.assignment.create({
    data: {
      courseId: cse301.id,
      title: 'Attention Mechanism Implementation from Scratch',
      description: 'Implement scaled dot-product attention and multi-head attention in PyTorch without using torch.nn.MultiheadAttention. Submit Jupyter notebook and benchmark results against PyTorch baseline.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      maxMarks: 100,
      attachmentUrl: 'https://cdn.rishihood.edu.in/assignments/cs301_asgn1.pdf',
    },
  });

  const asgn2 = await prisma.assignment.create({
    data: {
      courseId: cse302.id,
      title: 'High-Availability Microservice Cluster Deployment',
      description: 'Design a microservices pipeline with Envoy proxy, Redis caching, and PostgreSQL read-replicas deployed on a local k3s/Minikube cluster. Include Helm charts and load testing report.',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // in 12 days
      maxMarks: 100,
    },
  });

  const asgn3 = await prisma.assignment.create({
    data: {
      courseId: des201.id,
      title: 'Field Research & Empathy Report: Campus Waste Sorting',
      description: 'Conduct 10 in-depth user interviews across campus dining and dorms. Formulate customer journey maps and propose a low-friction behavioral nudge.',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // was due 3 days ago
      maxMarks: 50,
    },
  });

  // Submissions
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: asgn3.id,
      studentId: studentAarav.id,
      submissionText: 'Completed field survey across Takshashila Block and Central Mess. Attached full PDF report and prototype diagram.',
      fileUrl: 'https://cdn.rishihood.edu.in/submissions/aarav_des201_report.pdf',
      status: SubmissionStatus.GRADED,
      marksObtained: 48,
      feedback: 'Outstanding interview synthesis and actionable behavioral nudge prototype. Well done!',
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: asgn1.id,
      studentId: studentAarav.id,
      submissionText: 'Draft implementation with unit tests completed. Validated matrix multiplication shapes.',
      fileUrl: 'https://cdn.rishihood.edu.in/submissions/aarav_attention_draft.ipynb',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  console.log('✅ Assignments and submissions created');

  // 7. Academic Results (Prior semesters)
  const resultsData = [
    { studentId: studentAarav.id, courseId: cse301.id, semester: 5, examType: ExamType.END_TERM, marksObtained: 92, totalMarks: 100, gradePoint: 9.5, letterGrade: 'A+' },
    { studentId: studentAarav.id, courseId: cse302.id, semester: 5, examType: ExamType.END_TERM, marksObtained: 88, totalMarks: 100, gradePoint: 9.0, letterGrade: 'A' },
    { studentId: studentAarav.id, courseId: cse304.id, semester: 5, examType: ExamType.END_TERM, marksObtained: 96, totalMarks: 100, gradePoint: 10.0, letterGrade: 'O' },
    { studentId: studentAarav.id, courseId: des201.id, semester: 5, examType: ExamType.END_TERM, marksObtained: 85, totalMarks: 100, gradePoint: 8.5, letterGrade: 'A' },
    { studentId: studentPriya.id, courseId: cse301.id, semester: 5, examType: ExamType.END_TERM, marksObtained: 94, totalMarks: 100, gradePoint: 9.5, letterGrade: 'A+' },
  ];

  for (const res of resultsData) {
    await prisma.academicResult.create({ data: res });
  }
  console.log('✅ Academic results created');

  // 8. Hostel Blocks & Rooms
  const blockTakshashila = await prisma.hostelBlock.create({
    data: {
      name: 'Takshashila Hall of Residence (Boys)',
      code: 'TAK-B',
      genderType: GenderType.BOYS,
      totalRooms: 80,
      wardenId: wardenRajesh.id,
      description: 'Modern residential wing featuring air-conditioned suites, high-speed Wi-Fi 6, soundproof study lounges, and direct access to Central Sports Complex.',
    },
  });

  const blockGargi = await prisma.hostelBlock.create({
    data: {
      name: 'Gargi Bhavan (Girls)',
      code: 'GAR-G',
      genderType: GenderType.GIRLS,
      totalRooms: 75,
      wardenId: wardenRajesh.id,
      description: 'State-of-the-art secure residential wing with smart access control, solar hot water system, indoor recreation arena, and dedicated reading pods.',
    },
  });

  const blockNalanda = await prisma.hostelBlock.create({
    data: {
      name: 'Nalanda Scholars Block',
      code: 'NAL-B',
      genderType: GenderType.BOYS,
      totalRooms: 60,
      description: 'Quiet scholar community wing designed for senior undergraduate and postgraduate researchers.',
    },
  });

  // Create Rooms
  const roomTak204 = await prisma.room.create({
    data: {
      hostelBlockId: blockTakshashila.id,
      roomNumber: '204',
      floor: 2,
      roomType: RoomType.DOUBLE,
      capacity: 2,
      occupied: 1,
      feePerSemester: 55000,
      amenities: 'Dual Inverter AC, Balcony, Ergonomic Study Desks, Wardrobes, En-suite Bathroom, Wi-Fi 6 AP',
      status: RoomStatus.AVAILABLE,
    },
  });

  const roomTak205 = await prisma.room.create({
    data: {
      hostelBlockId: blockTakshashila.id,
      roomNumber: '205',
      floor: 2,
      roomType: RoomType.SINGLE,
      capacity: 1,
      occupied: 0,
      feePerSemester: 75000,
      amenities: 'Executive Single AC, Personal Refrigerator, Study Ergonomics, En-suite Bath, Lake View',
      status: RoomStatus.AVAILABLE,
    },
  });

  const roomTak301 = await prisma.room.create({
    data: {
      hostelBlockId: blockTakshashila.id,
      roomNumber: '301',
      floor: 3,
      roomType: RoomType.DOUBLE,
      capacity: 2,
      occupied: 2,
      feePerSemester: 55000,
      amenities: 'AC, Study Desks, Balcony, Attached Bath',
      status: RoomStatus.FULL,
    },
  });

  const roomGargi201 = await prisma.room.create({
    data: {
      hostelBlockId: blockGargi.id,
      roomNumber: '201',
      floor: 2,
      roomType: RoomType.DOUBLE,
      capacity: 2,
      occupied: 1,
      feePerSemester: 55000,
      amenities: 'Dual Inverter AC, Garden View, Ergonomic Workstations, Attached Bath',
      status: RoomStatus.AVAILABLE,
    },
  });

  const roomGargi202 = await prisma.room.create({
    data: {
      hostelBlockId: blockGargi.id,
      roomNumber: '202',
      floor: 2,
      roomType: RoomType.SINGLE,
      capacity: 1,
      occupied: 1,
      feePerSemester: 75000,
      amenities: 'Single AC, Private Balcony, Attached Bath',
      status: RoomStatus.FULL,
    },
  });

  console.log('✅ Hostel blocks and rooms created');

  // 9. Hostel Allocations
  await prisma.hostelAllocation.create({
    data: {
      studentId: studentAarav.id,
      roomId: roomTak204.id,
      academicYear: '2024-2025',
      semester: 6,
      status: AllocationStatus.ACTIVE,
      checkInDate: new Date('2025-01-08T10:00:00Z'),
    },
  });

  await prisma.hostelAllocation.create({
    data: {
      studentId: studentPriya.id,
      roomId: roomGargi201.id,
      academicYear: '2024-2025',
      semester: 6,
      status: AllocationStatus.ACTIVE,
      checkInDate: new Date('2025-01-08T10:00:00Z'),
    },
  });

  console.log('✅ Hostel allocations created');

  // 10. Leave Requests
  await prisma.leaveRequest.create({
    data: {
      studentId: studentAarav.id,
      leaveType: LeaveType.NIGHT_OUT,
      departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      destination: 'IIT Delhi Campus, Hauz Khas, New Delhi',
      reason: 'Representing Rishihood University at the North India Inter-College Hackathon (Team Lead).',
      parentContact: '+91 94123 45678',
      emergencyContact: '+91 98111 22334',
      status: LeaveStatus.APPROVED,
      wardenId: wardenRajesh.id,
      remarks: 'Verified with Hackathon Faculty Advisor Dr. Roy. Gate pass granted.',
      reviewedAt: new Date(),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      studentId: studentAarav.id,
      leaveType: LeaveType.HOME_VISIT,
      departureDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      destination: 'Chandigarh (Home)',
      reason: 'Cousin wedding and family celebration.',
      parentContact: '+91 94123 45678',
      emergencyContact: '+91 94123 45679',
      status: LeaveStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      studentId: studentPriya.id,
      leaveType: LeaveType.DAY_OUTING,
      departureDate: new Date(),
      returnDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // today 6 hrs
      destination: 'Omaxe Mall & Sector 14 Sonipat',
      reason: 'Academic stationery and personal groceries.',
      parentContact: '+91 98987 65432',
      status: LeaveStatus.APPROVED,
      wardenId: wardenRajesh.id,
      remarks: 'Return before 08:30 PM curfew enforced.',
      reviewedAt: new Date(),
    },
  });

  console.log('✅ Leave requests created');

  // 11. Complaints
  await prisma.complaint.create({
    data: {
      studentId: studentAarav.id,
      category: ComplaintCategory.WIFI,
      title: 'Periodic 5GHz Wi-Fi Drop in Takshashila Room 204',
      description: 'The access point right outside room 204 keeps rebooting during peak study hours (09:00 PM - 11:30 PM), causing disconnection during coding assessments.',
      location: 'Takshashila Hall, Room 204 (2nd Floor)',
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.IN_PROGRESS,
      resolutionNotes: 'Campus IT team dispatched technician to re-terminate RJ45 patch cable and update AP firmware.',
    },
  });

  await prisma.complaint.create({
    data: {
      studentId: studentAarav.id,
      category: ComplaintCategory.ELECTRICAL,
      title: 'AC Thermostat Remote Sensor Erratic',
      description: 'The wall-mounted thermostat shows temperature fluctuations and does not respond to remote adjustment.',
      location: 'Takshashila Hall, Room 204',
      priority: ComplaintPriority.MEDIUM,
      status: ComplaintStatus.OPEN,
    },
  });

  await prisma.complaint.create({
    data: {
      studentId: studentPriya.id,
      category: ComplaintCategory.PLUMBING,
      title: 'Solar Water Heater Mixer Tap Valve Jammed',
      description: 'The hot water mixer tap in the washroom was stiff and leaking slowly.',
      location: 'Gargi Bhavan, Room 201',
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.RESOLVED,
      resolutionNotes: 'Maintenance plumber replaced ceramic cartridge and tightened water gasket. Fully functional now.',
      resolvedAt: new Date(),
    },
  });

  console.log('✅ Complaints created');

  // 12. Fee Invoices
  await prisma.feeInvoice.create({
    data: {
      studentId: studentAarav.id,
      invoiceNo: 'RU-INV-2025-0142',
      title: 'Spring Semester 2025 Tuition & Academic Lab Fee',
      feeType: FeeType.TUITION,
      amount: 185000,
      paidAmount: 185000,
      dueDate: new Date('2025-01-15T00:00:00Z'),
      status: InvoiceStatus.PAID,
      paymentMethod: 'UPI / HDFC NetBanking',
      transactionRef: 'RU_TXN_99812401',
      paidAt: new Date('2025-01-10T14:22:10Z'),
    },
  });

  await prisma.feeInvoice.create({
    data: {
      studentId: studentAarav.id,
      invoiceNo: 'RU-INV-2025-0143',
      title: 'Hostel Accommodation & Dining Fee (Takshashila AC Double)',
      feeType: FeeType.HOSTEL,
      amount: 75000,
      paidAmount: 75000,
      dueDate: new Date('2025-01-15T00:00:00Z'),
      status: InvoiceStatus.PAID,
      paymentMethod: 'Razorpay Instant UPI',
      transactionRef: 'RU_TXN_99812402',
      paidAt: new Date('2025-01-10T14:25:30Z'),
    },
  });

  await prisma.feeInvoice.create({
    data: {
      studentId: studentAarav.id,
      invoiceNo: 'RU-INV-2025-0988',
      title: 'Annual Examination, Sports & Library Amenities Fee',
      feeType: FeeType.AMENITIES,
      amount: 15000,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // in 14 days
      status: InvoiceStatus.PENDING,
    },
  });

  console.log('✅ Fee invoices created');

  // 13. Dining Menu (Full Weekly Rotation)
  const menuList = [
    // Monday
    { dayOfWeek: DayOfWeek.MONDAY, mealType: MealType.BREAKFAST, items: 'Aloo Paratha with White Butter, Curd, Poha with Peanuts, Boiled Eggs, Tea & Fresh Fruit Juice', timing: '07:30 AM - 09:30 AM' },
    { dayOfWeek: DayOfWeek.MONDAY, mealType: MealType.LUNCH, items: 'Paneer Butter Masala, Yellow Dal Tadka, Seasonal Veg, Steamed Basmati Rice, Butter Phulka, Green Salad, Gulab Jamun', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.MONDAY, mealType: MealType.SNACKS, items: 'Vegetable Cutlets, Masala Chai, Filter Coffee, Digestive Biscuits', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.MONDAY, mealType: MealType.DINNER, items: 'Kadhai Mushroom, Dal Makhani, Jeera Pulao, Chapati, Boondi Raita, Kheer', timing: '07:45 PM - 09:45 PM' },

    // Tuesday
    { dayOfWeek: DayOfWeek.TUESDAY, mealType: MealType.BREAKFAST, items: 'Idli, Medu Vada, Coconut Chutney, Tomato Rasam, Upma, Seasonal Fruits, Milk & Coffee', timing: '07:30 AM - 09:30 AM' },
    { dayOfWeek: DayOfWeek.TUESDAY, mealType: MealType.LUNCH, items: 'Rajma Masala (Punjabi Style), Palak Paneer, Fragrant Jeera Rice, Tawa Roti, Sirka Onion, Moong Dal Halwa', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.TUESDAY, mealType: MealType.SNACKS, items: 'Crispy Veg Samosa with Mint & Saunth Chutney, Adrak Chai', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.TUESDAY, mealType: MealType.DINNER, items: 'Kashmiri Dum Aloo, Panchratna Dal, Veg Biryani, Raita, Whole Wheat Roti, Ice Cream', timing: '07:45 PM - 09:45 PM' },

    // Wednesday
    { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.BREAKFAST, items: 'Masala Dosa with Sambar & 3 Chutneys, Cornflakes with Hot Milk, Bananas & Herbal Tea', timing: '07:30 AM - 09:30 AM' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.LUNCH, items: 'Malai Kofta, Dal Fry, Bhindi Do Pyaza, Steamed Rice, Roti, Cucumber Mint Raita, Rasgulla', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.SNACKS, items: 'Dhokla with Green Chilli, Masala Tea, Cold Coffee', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.DINNER, items: 'Shahi Paneer, Chana Dal Palak, Peas Pulao, Missi Roti, Papad, Gajar Halwa', timing: '07:45 PM - 09:45 PM' },

    // Thursday
    { dayOfWeek: DayOfWeek.THURSDAY, mealType: MealType.BREAKFAST, items: 'Methi Paratha with Pickle, Sprouts Chaat, Boiled Eggs, Fresh Papaya, Tea & Coffee', timing: '07:30 AM - 09:30 AM' },
    { dayOfWeek: DayOfWeek.THURSDAY, mealType: MealType.LUNCH, items: 'Chole Bhature with Pickled Green Chilli, Veg Pulao, Curd, Mixed Salad, Jalebi with Rabri', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.THURSDAY, mealType: MealType.SNACKS, items: 'Grilled Veg Sandwiches with Mint Mayo, Hot Bournvita, Masala Tea', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.THURSDAY, mealType: MealType.DINNER, items: 'Mutter Paneer, Dal Tadka, Gobi Masala, Steamed Rice, Tandoori Roti, Custard with Fruits', timing: '07:45 PM - 09:45 PM' },

    // Friday
    { dayOfWeek: DayOfWeek.FRIDAY, mealType: MealType.BREAKFAST, items: 'Puri Bhaji (Nagori Style), Vermicelli Upma, Fresh Watermelon, Tea & Milk', timing: '07:30 AM - 09:30 AM' },
    { dayOfWeek: DayOfWeek.FRIDAY, mealType: MealType.LUNCH, items: 'Paneer Lababdar, Dal Palak, Aloo Shimla Mirch, Steamed Rice, Roti, Onion Raita, Sewaiyan', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.FRIDAY, mealType: MealType.SNACKS, items: 'Bread Pakora with Sweet Chutney, Adrak Chai', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.FRIDAY, mealType: MealType.DINNER, items: 'Hyderabadi Veg Dum Biryani, Mirchi Ka Salan, Burani Raita, Paneer Tikka Gravy, Shahi Tukda', timing: '07:45 PM - 09:45 PM' },

    // Saturday
    { dayOfWeek: DayOfWeek.SATURDAY, mealType: MealType.BREAKFAST, items: 'Uttapam with Sambar & Coconut Chutney, Boiled Eggs, Oats Porridge, Seasonal Fruits, Coffee', timing: '08:00 AM - 10:00 AM' },
    { dayOfWeek: DayOfWeek.SATURDAY, mealType: MealType.LUNCH, items: 'Kadhi Pakora, Aloo Jeera, Steamed Rice, Tawa Paratha, Roasted Papad, Sweet Lassi', timing: '12:30 PM - 02:30 PM' },
    { dayOfWeek: DayOfWeek.SATURDAY, mealType: MealType.SNACKS, items: 'Pav Bhaji with Lemon & Chopped Onions, Filter Coffee', timing: '05:00 PM - 06:15 PM' },
    { dayOfWeek: DayOfWeek.SATURDAY, mealType: MealType.DINNER, items: 'Dal Makhani, Kadhai Paneer, Kashmiri Pulao, Butter Naan, Gulab Jamun', timing: '08:00 PM - 10:00 PM' },

    // Sunday
    { dayOfWeek: DayOfWeek.SUNDAY, mealType: MealType.BREAKFAST, items: 'Special Sunday Brunch: Chole Kulche, Bedmi Puri with Aloo Sabzi, Sweet Lassi, Fresh Seasonal Juice', timing: '08:00 AM - 10:30 AM' },
    { dayOfWeek: DayOfWeek.SUNDAY, mealType: MealType.LUNCH, items: 'Paneer Makhani, Dal Panchratna, Kashmiri Pulao, Butter Naan, Mixed Raita, Ice Cream Sundae', timing: '12:45 PM - 02:45 PM' },
    { dayOfWeek: DayOfWeek.SUNDAY, mealType: MealType.SNACKS, items: 'Cookies, Rusks, Herbal Green Tea, Espresso Coffee', timing: '05:00 PM - 06:00 PM' },
    { dayOfWeek: DayOfWeek.SUNDAY, mealType: MealType.DINNER, items: 'Special Continental Night: Penne Arrabbiata, Herb Garlic Bread, Cheesy Baked Veggies, Brownie with Fudge', timing: '08:00 PM - 10:00 PM' },
  ];

  for (const menu of menuList) {
    await prisma.diningMenu.create({ data: menu });
  }
  console.log('✅ Dining menu created');

  // 14. Campus Events
  const evt1 = await prisma.campusEvent.create({
    data: {
      title: 'Rishihood Innovation Conclave & Startup Expo 2025',
      description: 'Annual flagship symposium hosting 40+ national venture capitalists, deeptech founders, and Rishihood incubatees. Features pitching rounds, demo stalls, and keynote fireside chats.',
      category: EventCategory.WORKSHOP,
      venue: 'Newton Auditorium & Incubation Arena',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      organizer: 'Centre for Entrepreneurship & Innovation',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      capacity: 350,
      registeredCount: 142,
    },
  });

  const evt2 = await prisma.campusEvent.create({
    data: {
      title: 'HackRishi 2025: 36-Hour National AI & Civic Hackathon',
      description: 'Collaborate to build intelligent software solutions solving healthcare access, clean logistics, and educational equity in North India. Prizes worth ₹3,00,000.',
      category: EventCategory.ACADEMIC,
      venue: 'Design Studio & Cloud Computing Labs',
      startTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      organizer: 'School of Technology (Rishihood One Dev Chapter)',
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      capacity: 250,
      registeredCount: 198,
    },
  });

  const evt3 = await prisma.campusEvent.create({
    data: {
      title: 'Sanskriti 2025: Grand Annual Cultural Festival',
      description: 'A vibrant weekend of classical and contemporary music, battle of the bands, pro-night with renowned artists, dramatic theater, and multi-state culinary street.',
      category: EventCategory.CULTURAL,
      venue: 'Central Amphitheatre & Lawns',
      startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      organizer: 'Student Council & Cultural Directorate',
      bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      capacity: 800,
      registeredCount: 420,
    },
  });

  // Event Registrations
  await prisma.eventRegistration.create({
    data: {
      eventId: evt1.id,
      userId: studentAarav.id,
    },
  });
  await prisma.eventRegistration.create({
    data: {
      eventId: evt2.id,
      userId: studentAarav.id,
    },
  });

  console.log('✅ Campus events created');

  // 15. Notifications
  const notificationsData = [
    {
      userId: studentAarav.id,
      title: 'Hostel Leave Request Approved',
      message: 'Your night out pass to IIT Delhi (North India Hackathon) has been approved by Warden Col. Rajesh Verma.',
      category: NotificationCategory.HOUSING,
      isRead: false,
    },
    {
      userId: studentAarav.id,
      title: 'New Course Assignment Published',
      message: 'Dr. Ananya Roy assigned "Attention Mechanism Implementation from Scratch" due in 5 days for CS301.',
      category: NotificationCategory.ACADEMIC,
      isRead: false,
    },
    {
      userId: studentAarav.id,
      title: 'Fee Invoice Generated: Amenities & Exam Fee',
      message: 'Invoice RU-INV-2025-0988 for ₹15,000 has been issued with due date in 14 days.',
      category: NotificationCategory.FEES,
      isRead: true,
    },
    {
      userId: null,
      targetRole: null,
      title: 'Campus Advisory: Library Extended Study Hours',
      message: 'In view of upcoming mid-term examinations, the Tagore Central Library will remain open 24x7 with overnight shuttle service.',
      category: NotificationCategory.GENERAL,
      isRead: false,
    },
    {
      userId: null,
      targetRole: Role.FACULTY,
      title: 'Mid-Term Grade Submission Portal Open',
      message: 'Faculty members are requested to upload continuous assessment and internal marks by next Friday.',
      category: NotificationCategory.ACADEMIC,
      isRead: false,
    },
    {
      userId: null,
      targetRole: Role.WARDEN,
      title: 'Hostel Night Roll Call Audit',
      message: 'Monthly biometric and gate pass reconciliation report is ready for Takshashila and Gargi Bhavan.',
      category: NotificationCategory.HOUSING,
      isRead: false,
    },
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({ data: notif });
  }
  console.log('✅ Notifications created');

  console.log('✨ Rishihood One database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

