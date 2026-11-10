import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))) {
    return 'https://maternitrack-backend.onrender.com/api/v1';
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth interceptor ─────────────────────────────────────────────────────────
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const original = error.config;

    // Handle offline / network errors for specific forms to queue them
    if (!navigator.onLine || error.message === 'Network Error' || !error.response) {
      if (original && original.method === 'post') {
        const url = original.url || '';
        const isMotherPortalRequest = url.includes('/patients/mother/');
        if (
          !isMotherPortalRequest &&
          (url.includes('/patients/') || url.includes('/appointments/') || url.includes('/clinical/anc-visits/'))
        ) {
          try {
            const dataObj = typeof original.data === 'string' ? JSON.parse(original.data) : original.data;
            const { addToOfflineQueue } = await import('../utils/offlineQueue');
            addToOfflineQueue(url, dataObj);
            
            return Promise.resolve({
              data: { id: 'offline-queued', ...dataObj, _offline: true },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: original,
            });
          } catch (queueErr) {
            console.error('Failed to queue offline request:', queueErr);
          }
        }
      }
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${getApiBaseUrl()}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  refresh: (refresh: string) =>
    api.post('/auth/refresh/', { refresh }),
  me: () => api.get('/users/me/'),
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/patients/', { params }),
  get: (id: number) => api.get(`/patients/${id}/`),
  create: (data: object) => api.post('/patients/', data),
  update: (id: number, data: object) => api.patch(`/patients/${id}/`, data),
  delete: (id: number) => api.delete(`/patients/${id}/`),
  stats: (id: number) => api.get(`/patients/${id}/stats/`),
  timeline: (id: number) => api.get(`/patients/${id}/timeline/`),
};

// ─── Pregnancies ──────────────────────────────────────────────────────────────
export const pregnanciesApi = {
  list: (patientId: number) => api.get(`/patients/${patientId}/pregnancies/`),
  create: (patientId: number, data: object) => api.post(`/patients/${patientId}/pregnancies/`, data),
  get: (id: number) => api.get(`/patients/pregnancies/${id}/`),
  update: (id: number, data: object) => api.patch(`/patients/pregnancies/${id}/`, data),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/appointments/', { params }),
  get: (id: number) => api.get(`/appointments/${id}/`),
  create: (data: object) => api.post('/appointments/', data),
  update: (id: number, data: object) => api.patch(`/appointments/${id}/`, data),
  markAttended: (id: number) => api.post(`/appointments/${id}/attend/`),
  markMissed: (id: number) => api.post(`/appointments/${id}/miss/`),
  reschedule: (id: number, data: object) => api.post(`/appointments/${id}/reschedule/`, data),
};

// ─── Postnatal ────────────────────────────────────────────────────────────────
export const postnatalApi = {
  list: () => api.get('/postnatal/'),
  get: (id: number) => api.get(`/postnatal/${id}/`),
  create: (data: object) => api.post('/postnatal/', data),
  update: (id: number, data: object) => api.patch(`/postnatal/${id}/`, data),
  mark7Day: (id: number, notes?: string) =>
    api.post(`/postnatal/${id}/7day-attended/`, { notes }),
  mark6Week: (id: number, notes?: string) =>
    api.post(`/postnatal/${id}/6week-attended/`, { notes }),
};

// ─── Pediatrics ─────────────────────────────────────────────────────────────
export const pediatricsApi = {
  listProfiles: (params?: Record<string, string>) =>
    api.get('/pediatrics/profiles/', { params }),
  getProfile: (id: number) => api.get(`/pediatrics/profiles/${id}/`),
  listGrowth: (params?: Record<string, string>) =>
    api.get('/pediatrics/growth/', { params }),
  createGrowth: (data: object) => api.post('/pediatrics/growth/', data),
  listVaccinations: (params?: Record<string, string>) =>
    api.get('/pediatrics/vaccinations/', { params }),
  updateVaccination: (id: number, data: object) =>
    api.patch(`/pediatrics/vaccinations/${id}/`, data),
  updateProfile: (id: number, data: object) =>
    api.patch(`/pediatrics/profiles/${id}/`, data),
  listClinicVisits: (params?: Record<string, string>) =>
    api.get('/pediatrics/clinic-visits/', { params }),
  createClinicVisit: (data: object) => api.post('/pediatrics/clinic-visits/', data),
};

// ─── Reminders ────────────────────────────────────────────────────────────────
export const remindersApi = {
  list: () => api.get('/reminders/'),
  send: (data: object) => api.post('/reminders/send/', data),
  preview: (data: object) => api.post('/reminders/preview/', data),
  bulk: (data: object) => api.post('/reminders/bulk/', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary/'),
  nurseSummary: () => api.get('/dashboard/summary/nurse/'),
  doctorSummary: () => api.get('/dashboard/summary/doctor/'),
  dueSoon: (days?: number) => api.get('/dashboard/due-soon/', { params: { days } }),
  overdueDelivery: () => api.get('/dashboard/overdue-delivery/'),
  recentActivity: () => api.get('/dashboard/recent-activity/'),
  trends: (period = 'weekly', weeks = 12) =>
    api.get('/dashboard/trends/', { params: { period, weeks } }),
  publicStats: () => api.get('/dashboard/public-stats/'),
};

// ─── Partograph ───────────────────────────────────────────────────────────────
export const partographApi = {
  list:   (patientId: number) => api.get(`/patients/${patientId}/partograph/`),
  create: (patientId: number, data: object) => api.post(`/patients/${patientId}/partograph/`, data),
  update: (patientId: number, entryId: number, data: object) =>
    api.patch(`/patients/${patientId}/partograph/${entryId}/`, data),
  delete: (patientId: number, entryId: number) =>
    api.delete(`/patients/${patientId}/partograph/${entryId}/`),
  exportPdf: (patientId: number) => api.get(`/patients/${patientId}/partograph/pdf/`, { responseType: 'blob' }),
};

// ─── Clinical Alerts ──────────────────────────────────────────────────────────
export const alertsApi = {
  list:         (params?: Record<string, string>) => api.get('/alerts/', { params }),
  count:        () => api.get('/alerts/count/'),
  acknowledge:  (id: number) => api.post(`/alerts/${id}/acknowledge/`),
  followUp:     (id: number, message: string) => api.post(`/alerts/${id}/follow-up/`, { message }),
};

// ─── Staff Management (admin) ─────────────────────────────────────────────────
export const staffApi = {
  list:           (params?: Record<string, string>) => api.get('/users/staff/', { params }),
  get:            (id: string) => api.get(`/users/staff/${id}/`),
  update:         (id: string, data: object) => api.patch(`/users/staff/${id}/`, data),
  delete:         (id: string) => api.delete(`/users/staff/${id}/`),
  register:       (data: object) => api.post('/users/register/', data),
  deactivate:     (id: string) => api.post(`/users/staff/${id}/deactivate/`),
  reactivate:     (id: string) => api.post(`/users/staff/${id}/reactivate/`),
  changeRole:     (id: string, role: string) => api.patch(`/users/staff/${id}/role/`, { role }),
  togglePMTCTPermission: (id: string, has_pmtct_permission: boolean) => api.patch(`/users/staff/${id}/pmtct-permission/`, { has_pmtct_permission }),
  updateProfile:  (data: object) => api.patch('/users/me/', data),
  getProfile:     () => api.get('/users/me/'),
};

// ─── Audit Trail (admin) ──────────────────────────────────────────────────────
export const auditApi = {
  getHistory: (modelName: string, pk: number, params?: object) =>
    api.get(`/core/audit/${modelName}/${pk}/`, { params }),
};

// ─── Clinical Notes & Documents (Phase 3A/3B) ────────────────────────────────
export const clinicalApi = {
  // Notes
  listNotes:   (params?: object) => api.get('/clinical/notes/', { params }),
  createNote:  (data: object) => api.post('/clinical/notes/', data),
  getNote:     (id: number) => api.get(`/clinical/notes/${id}/`),
  updateNote:  (id: number, data: object) => api.patch(`/clinical/notes/${id}/`, data),
  deleteNote:  (id: number) => api.delete(`/clinical/notes/${id}/`),
  // ANC visits
  listAncVisits: (params?: object) => api.get('/clinical/anc-visits/', { params }),
  createAncVisit: (data: object) => api.post('/clinical/anc-visits/', data),
  getAncVisit: (id: number) => api.get(`/clinical/anc-visits/${id}/`),
  updateAncVisit: (id: number, data: object) => api.patch(`/clinical/anc-visits/${id}/`, data),
  deleteAncVisit: (id: number) => api.delete(`/clinical/anc-visits/${id}/`),
  getAncVisitPDF: (id: number) => api.get(`/clinical/anc-visits/${id}/pdf/`, { responseType: 'blob' }),
  // Documents
  listDocs:    (params?: object) => api.get('/clinical/documents/', { params }),
  uploadDoc:   (formData: FormData) => api.post('/clinical/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteDoc:   (id: number) => api.delete(`/clinical/documents/${id}/`),
};

// ─── Clinical Ticketing & Notifications ───────────────────────────────────
export const ticketsApi = {
  create: (data: object) => api.post('/tickets/create/', data),
  list: (params?: Record<string, string>) => api.get('/tickets/', { params }),
  get: (id: number) => api.get(`/tickets/${id}/`),
  updateStatus: (id: number, status: string) => api.patch(`/tickets/${id}/status/`, { status }),
  reply: (id: number, message: string) => api.post(`/tickets/${id}/reply/`, { message }),
  unresolvedCount: () => api.get('/tickets/unresolved_count/'),
};

export const notificationsApi = {
  list: (params?: Record<string, string>) => api.get('/tickets/notifications/', { params }),
  markRead: (id: number) => api.patch(`/tickets/notifications/${id}/read/`, {}),
  markAllRead: () => api.patch('/tickets/notifications/read_all/', {}),
  unreadCount: () => api.get('/tickets/notifications/unread_count/'),
};

// ─── FHIR R4 Export (Phase 3G) ────────────────────────────────────────────────
export const fhirApi = {
  patient: (id: number) => api.get(`/core/fhir/patient/${id}/`),
  bundle:  () => api.get('/core/fhir/patients/'),
};

// ─── Nutrition (Phase 4) ──────────────────────────────────────────────────────
export const nutritionApi = {
  listCategories: () => api.get('/nutrition/categories/'),
  getProfile: (patientId: number) => api.get(`/nutrition/profile/${patientId}/`),
  updateProfile: (patientId: number, data: object) => api.patch(`/nutrition/profile/${patientId}/`, data),
  getRecommendations: (patientId: number) => api.get(`/nutrition/recommendations/${patientId}/`),
  generateRecommendations: (patientId: number) => api.post(`/nutrition/recommendations/${patientId}/generate/`),
  listPlans: (params?: object) => api.get('/nutrition/plans/', { params }),
  getWeightLogs: (patientId: number) => api.get(`/nutrition/weight/${patientId}/`),
  addWeightLog: (patientId: number, data: object) => api.post(`/nutrition/weight/${patientId}/`, data),
  seedPlans: () => api.post('/nutrition/seed/'),
};

// ─── Procedures & Emergencies (Phase 5) ───────────────────────────────────────
export const proceduresApi = {
  listProcedures: (params?: object) => api.get('/procedures/', { params }),
  getProcedure: (id: number) => api.get(`/procedures/${id}/`),
  listEmergencies: (params?: object) => api.get('/procedures/emergencies/', { params }),
  getEmergency: (id: number, patientId?: number) => api.get(`/procedures/emergencies/${id}/`, { params: { patient: patientId } }),
  getAccessLogs: () => api.get('/procedures/access-logs/'),
};

// ─── Referrals (Phase 5) ──────────────────────────────────────────────────────
export const referralsApi = {
  list: (params?: Record<string, string>) => api.get('/referrals/', { params }),
  get: (id: number) => api.get(`/referrals/${id}/`),
  create: (data: object) => api.post('/referrals/', data),
  update: (id: number, data: object) => api.patch(`/referrals/${id}/`, data),
  delete: (id: number) => api.delete(`/referrals/${id}/`),
  facilities: (search: string) => api.get('/referrals/facilities/', { params: { search } }),
};

// ─── Mortality Reviews (Phase 5) ──────────────────────────────────────────────
export const mortalityApi = {
  list: (params?: Record<string, string>) => api.get('/mortality/', { params }),
  get: (id: number) => api.get(`/mortality/${id}/`),
  create: (data: object) => api.post('/mortality/', data),
  update: (id: number, data: object) => api.patch(`/mortality/${id}/`, data),
  delete: (id: number) => api.delete(`/mortality/${id}/`),
};

// ─── PMTCT Registry (Phase 5) ──────────────────────────────────────────────────
export const pmtctApi = {
  list: (params?: Record<string, string>) => api.get('/pmtct/', { params }),
  get: (id: number) => api.get(`/pmtct/${id}/`),
  create: (data: object) => api.post('/pmtct/', data),
  update: (id: number, data: object) => api.patch(`/pmtct/${id}/`, data),
  delete: (id: number) => api.delete(`/pmtct/${id}/`),
};

// ─── Education Module ─────────────────────────────────────────────────────────
export const educationApi = {
  listCategories: () => api.get('/education/categories/'),
  listResources: (params?: Record<string, string>) => api.get('/education/resources/', { params }),
  getResource: (slug: string) => api.get(`/education/resources/${slug}/`),
};

// ─── Mother Portal (Patient Portal) ──────────────────────────────────────────
export const motherApi = {
  dashboard: () => api.get('/patients/mother/dashboard/'),
  appointments: () => api.get('/patients/mother/appointments/'),
  rescheduleAppointment: (id: number, scheduled_date: string, scheduled_time: string | null, reason: string) =>
    api.post(`/patients/mother/appointments/${id}/reschedule/`, { scheduled_date, scheduled_time, reason }),
  pregnancyTracking: () => api.get('/patients/mother/pregnancy-tracking/'),
  medicalRecords: () => api.get('/patients/mother/medical-records/'),
  listSymptoms: () => api.get('/patients/mother/symptoms/'),
  reportSymptoms: (data: object) => api.post('/patients/mother/symptoms/', data),
  listMessages: () => api.get('/patients/mother/messages/'),
  sendMessage: (message: string, parent_message?: number | null) =>
    api.post('/patients/mother/messages/', { message, parent_message }),
  markCareAlertRead: (id: number) => api.post(`/patients/mother/care-alerts/${id}/read/`),
  // ANC Visits (Journey Page)
  listAncVisits: () => api.get('/clinical/mother/anc-visits/'),
  getAncVisit: (id: number) => api.get(`/clinical/mother/anc-visits/${id}/`),
  getAncVisitPDF: (id: number) => api.get(`/clinical/anc-visits/${id}/pdf/`, { responseType: 'blob' }),
};


// ─── Hospital Customization Settings ──────────────────────────────────────────
export const hospitalSettingsApi = {
  get: () => api.get('/core/hospital-settings/'),
  update: (formData: FormData) => api.post('/core/hospital-settings/update/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
