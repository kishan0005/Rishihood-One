import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Modules
import authRoutes from './routes/auth.routes.js';
import studentsRoutes from './routes/students.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import hostelRoutes from './routes/hostel.routes.js';
import roomAllocationRoutes from './routes/room-allocation.routes.js';
import complaintsRoutes from './routes/complaints.routes.js';
import leaveApplicationsRoutes from './routes/leave-applications.routes.js';
import feesRoutes from './routes/fees.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Legacy / Combined Route modules for full frontend backwards-compatibility
import academicRoutes from './routes/academic.routes.js';
import housingRoutes from './routes/housing.routes.js';
import diningRoutes from './routes/dining.routes.js';
import eventsRoutes from './routes/events.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Rishihood One backend is running',
  });
});

// 2. Primary Standard Modular Endpoints (All 14 Task Modules)
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/room-allocation', roomAllocationRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/leave-applications', leaveApplicationsRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// 3. Complementary & Frontend Aliased Endpoints
app.use('/api/academic', academicRoutes);
app.use('/api/housing', housingRoutes);
app.use('/api/dining', diningRoutes);
app.use('/api/events', eventsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🏛️ Rishihood One Backend running on http://localhost:${PORT}`);
  console.log(`📍 Institution: Rishihood University, Sonipat, Haryana`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
