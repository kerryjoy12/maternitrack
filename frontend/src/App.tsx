import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SupabaseProvider } from './context/SupabaseContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Postnatal from './pages/Postnatal';
import Reminders from './pages/Reminders';
import Partograph from './pages/Partograph';
import Alerts from './pages/Alerts';
import AdminUsers from './pages/AdminUsers';
import AuditLog from './pages/AuditLog';
import ClinicalNotes from './pages/ClinicalNotes';
import Documents from './pages/Documents';
import CreateTicket from './pages/CreateTicket';
import TicketDashboard from './pages/TicketDashboard';
import Notifications from './pages/Notifications';
import TicketDetail from './pages/TicketDetail';
import Nutrition from './pages/Nutrition';
import Procedures from './pages/Procedures';
import ChildProfile from './pages/ChildProfile';
import Children from './pages/Children';
import UserProfile from './pages/UserProfile';
import Referrals from './pages/Referrals';
import MortalityReview from './pages/MortalityReview';
import PMTCT from './pages/PMTCT';
import Education from './pages/Education';
import EducationDetail from './pages/EducationDetail';
import HospitalSettings from './pages/HospitalSettings';

// Mother Portal Pages
import MotherDashboard from './pages/MotherDashboard';
import MotherPregnancy from './pages/MotherPregnancy';
import MotherJourney from './pages/MotherJourney';
import MotherAppointments from './pages/MotherAppointments';
import MotherMedicalRecords from './pages/MotherMedicalRecords';
import MotherSymptoms from './pages/MotherSymptoms';
import MotherLearn from './pages/MotherLearn';
import MotherLayout from './components/MotherLayout';

// Global Realtime toast for clinical alerts
import RealtimeAlertToast from './components/RealtimeAlertToast';

import { useLocation } from 'react-router-dom';
import { useAppointmentReminders } from './hooks/useAppointmentReminders';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Smart redirect: Mothers trying to access staff pages
  if (user?.role === 'MOTHER' && !location.pathname.startsWith('/mother')) {
    return <Navigate to="/mother/dashboard" replace />;
  }

  // Smart redirect: Staff trying to access mother portal
  if (user && user.role !== 'MOTHER' && location.pathname.startsWith('/mother')) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * RoleRoute — only renders children if the user's role is in the allowed list.
 * Redirects to Dashboard otherwise.
 */
function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function IndexRoute() {
  const { user } = useAuth();
  if (user?.role === 'MOTHER') {
    return <Navigate to="/mother/dashboard" replace />;
  }
  return <Dashboard />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  useAppointmentReminders();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Mother Portal routes (detached from staff Layout) */}
      <Route path="/mother" element={
        <PrivateRoute>
          <RoleRoute roles={['MOTHER']}>
            <MotherLayout />
          </RoleRoute>
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MotherDashboard />} />
        <Route path="pregnancy" element={<MotherPregnancy />} />
        <Route path="journey" element={<MotherJourney />} />
        <Route path="appointments" element={<MotherAppointments />} />
        <Route path="records" element={<MotherMedicalRecords />} />
        <Route path="symptoms" element={<MotherSymptoms />} />
        <Route path="learn" element={<MotherLearn />} />
      </Route>

      {/* Staff routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<IndexRoute />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/partograph" element={<Partograph />} />
        <Route path="patients/:id/nutrition" element={<Nutrition />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="postnatal" element={<Postnatal />} />
        <Route path="children" element={<Children />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="clinical-notes" element={<ClinicalNotes />} />
        <Route path="documents" element={<Documents />} />
        <Route path="procedures" element={<Procedures />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="pmtct" element={<PMTCT />} />
        <Route path="education" element={<Education />} />
        <Route path="education/:slug" element={<EducationDetail />} />
        {/* Admin-only routes */}
        <Route path="admin/users" element={
          <RoleRoute roles={['ADMIN']}><AdminUsers /></RoleRoute>
        } />
        <Route path="admin/settings" element={
          <RoleRoute roles={['ADMIN']}><HospitalSettings /></RoleRoute>
        } />
        <Route path="admin/audit" element={
          <RoleRoute roles={['ADMIN']}><AuditLog /></RoleRoute>
        } />
        <Route path="tickets/create" element={
          <RoleRoute roles={['DOCTOR', 'NURSE']}><CreateTicket /></RoleRoute>
        } />
        <Route path="tickets" element={
          <RoleRoute roles={['ADMIN']}><TicketDashboard /></RoleRoute>
        } />
        <Route path="tickets/:id" element={
          <RoleRoute roles={['ADMIN', 'DOCTOR', 'NURSE']}><TicketDetail /></RoleRoute>
        } />
        <Route path="notifications" element={
          <RoleRoute roles={['ADMIN', 'DOCTOR', 'NURSE']}><Notifications /></RoleRoute>
        } />
        <Route path="mortality-review" element={
          <RoleRoute roles={['ADMIN', 'DOCTOR']}><MortalityReview /></RoleRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { AccessibilityProvider } from './context/AccessibilityContext';

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          {/*
            SupabaseProvider must be:
            - Inside AuthProvider (reads user/supabaseTokens from AuthContext)
            - Inside BrowserRouter (children use React Router hooks)
          */}
          <SupabaseProvider>
            <AppRoutes />
            {/* Global realtime alert toast — shows critical clinical alerts to staff */}
            <RealtimeAlertToast />
          </SupabaseProvider>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
