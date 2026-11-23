const API_BASE = '/api';

function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'ALL') {
      searchParams.append(key, String(val));
    }
  });
  const res = searchParams.toString();
  return res ? `?${res}` : '';
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('ru_auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Network request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback to text
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; role?: string; department?: string; phone?: string; identifierNo?: string }) {
    return this.request<{ token: string; user: any; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async quickLogin(role: string) {
    return this.request<{ token: string; user: any }>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Academic
  async getCourses() {
    return this.request<{ courses: any[] }>('/academic/courses');
  }

  async createCourse(data: any) {
    return this.request<{ course: any }>('/academic/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAttendance(params?: { courseId?: string; studentId?: string }) {
    const query = toQueryString(params);
    return this.request<any>(`/academic/attendance${query}`);
  }

  async markAttendance(data: { courseId: string; date: string; sessionTopic?: string; attendees: any[] }) {
    return this.request<any>('/academic/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTimetable() {
    return this.request<{ slots: any[] }>('/academic/timetable');
  }

  async addTimetableSlot(data: any) {
    return this.request<any>('/academic/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignments() {
    return this.request<{ assignments: any[] }>('/academic/assignments');
  }

  async createAssignment(data: any) {
    return this.request<any>('/academic/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitAssignment(id: string, data: { submissionText?: string; fileUrl?: string }) {
    return this.request<any>(`/academic/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async gradeAssignment(id: string, data: { submissionId: string; marksObtained: number; feedback?: string }) {
    return this.request<any>(`/academic/assignments/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getResults(studentId?: string) {
    const query = studentId && studentId !== 'undefined' ? `?studentId=${studentId}` : '';
    return this.request<any>(`/academic/results${query}`);
  }

  async createResult(data: any) {
    return this.request<any>('/academic/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Housing
  async getHousingOverview() {
    return this.request<{ blocks: any[]; metrics: any }>('/housing/overview');
  }

  async getMyRoom() {
    return this.request<{ allocation: any; roommates: any[] }>('/housing/my-room');
  }

  async getHostelApplications() {
    return this.request<{ applications: any[] }>('/housing/applications');
  }

  async applyHostel(data: { preferredBlockId: string; preferredRoomType: string; reason?: string }) {
    return this.request<any>('/housing/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewHostelApplication(id: string, data: { status: string; wardenRemarks?: string; assignRoomId?: string }) {
    return this.request<any>(`/housing/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async allocateRoom(data: { studentId: string; roomId: string; semester?: number; academicYear?: string }) {
    return this.request<any>('/housing/allocate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async vacateRoom(allocationId: string) {
    return this.request<any>('/housing/vacate', {
      method: 'POST',
      body: JSON.stringify({ allocationId }),
    });
  }

  async getLeaves() {
    return this.request<{ leaves: any[] }>('/housing/leaves');
  }

  async submitLeave(data: any) {
    return this.request<any>('/housing/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeaveStatus(id: string, data: { status: string; remarks?: string }) {
    return this.request<any>(`/housing/leaves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Complaints
  async getComplaints(params?: { status?: string; category?: string; priority?: string }) {
    const query = toQueryString(params);
    return this.request<{ complaints: any[]; metrics: any }>(`/complaints${query}`);
  }

  async createComplaint(data: any) {
    return this.request<any>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComplaint(id: string, data: any) {
    return this.request<any>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Fees
  async getFees() {
    return this.request<{ invoices: any[]; summary: any }>('/fees');
  }

  async payFee(id: string, paymentMethod?: string) {
    return this.request<any>(`/fees/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  }

  async createFeeInvoice(data: any) {
    return this.request<any>('/fees/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dining
  async getDiningMenu() {
    return this.request<{ rawMenu: any[]; weeklyMenu: Record<string, any[]> }>('/dining/menu');
  }

  async updateDiningMenu(data: any) {
    return this.request<any>('/dining/menu', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Events
  async getEvents() {
    return this.request<{ events: any[] }>('/events');
  }

  async createEvent(data: any) {
    return this.request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rsvpEvent(id: string) {
    return this.request<{ registered: boolean; message: string }>(`/events/${id}/rsvp`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async broadcastNotification(data: { title: string; message: string; category?: string; targetRole?: string }) {
    return this.request<any>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getUsers(params?: { role?: string; search?: string }) {
    const query = toQueryString(params);
    return this.request<{ users: any[] }>(`/admin/users${query}`);
  }

  async createUser(data: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
