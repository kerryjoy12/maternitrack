import { useState, ReactNode, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Baby,
  Stethoscope,
  Folder,
  Hospital,
  MessageSquare,
  AlertCircle,
  UserCog,
  FileText,
  Search,
  Menu,
  ChevronUp,
  Activity,
  HeartPulse,
  FolderOpen,
  Ticket,
  Bell,
  ArrowUpRight,
  AlertOctagon,
  ShieldAlert,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils';
import AlertBanner from './AlertBanner';
import OfflineBanner from './OfflineBanner';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import ProfileOnboardingModal from './ProfileOnboardingModal';
import NotificationBell from './NotificationBell';
import { ticketsApi, hospitalSettingsApi } from '../api';
import { onTicketResolved } from '../utils/ticketEvents';
import AccessibilityWidget from './AccessibilityWidget';

interface NavItem { to: string; icon: ReactNode; label: string; roles?: string[] }

interface NavSection {
  label: string;
  roles?: string[];
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'DASHBOARD',
    roles: ['ADMIN', 'NURSE', 'DOCTOR'],
    items: [
      { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    ]
  },
  {
    label: 'RECEPTION',
    roles: ['ADMIN', 'NURSE', 'DOCTOR'],
    items: [
      { to: '/patients', icon: <Users size={18} />, label: 'Patients Management' },
      { to: '/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
    ]
  },
  {
    label: 'OUTPATIENT',
    roles: ['ADMIN', 'NURSE', 'DOCTOR'],
    items: [
      { to: '/postnatal', icon: <Activity size={18} />, label: 'Postnatal' },
      { to: '/children', icon: <Baby size={18} />, label: 'Child Profiles' },
      { to: '/clinical-notes', icon: <Stethoscope size={18} />, label: 'Clinical Notes' },
      { to: '/documents', icon: <Folder size={18} />, label: 'Documents' },
      { to: '/procedures', icon: <Hospital size={18} />, label: 'Procedures' },
      { to: '/referrals', icon: <ArrowUpRight size={18} />, label: 'Referrals' },
      { to: '/pmtct', icon: <ShieldAlert size={18} />, label: 'PMTCT Registry', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
    ]
  },
  {
    label: 'KNOWLEDGE CENTER',
    roles: ['ADMIN', 'NURSE', 'DOCTOR'],
    items: [
      { to: '/education', icon: <BookOpen size={18} />, label: 'Educational Modules' },
    ]
  },
  {
    label: 'SYSTEM',
    roles: ['ADMIN', 'NURSE', 'DOCTOR'],
    items: [
      { to: '/reminders', icon: <MessageSquare size={18} />, label: 'SMS Reminders', roles: ['ADMIN', 'NURSE'] },
      { to: '/alerts', icon: <AlertCircle size={18} />, label: 'Clinical Alerts' },
      { to: '/tickets/create', icon: <Ticket size={18} />, label: 'Raise Ticket', roles: ['DOCTOR', 'NURSE'] },
      { to: '/tickets', icon: <Ticket size={18} />, label: 'Ticket Dashboard', roles: ['ADMIN'] },
      { to: '/admin/users', icon: <UserCog size={18} />, label: 'User Management', roles: ['ADMIN'] },
      { to: '/admin/settings', icon: <Hospital size={18} />, label: 'Hospital Settings', roles: ['ADMIN'] },
      { to: '/admin/audit', icon: <FileText size={18} />, label: 'Audit Trail', roles: ['ADMIN'] },
      { to: '/mortality-review', icon: <AlertOctagon size={18} />, label: 'Mortality Audit', roles: ['ADMIN', 'DOCTOR'] },
    ]
  },
  {
    label: 'PATIENT PORTAL',
    roles: ['MOTHER'],
    items: [
      { to: '/mother/dashboard', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' },
      { to: '/mother/pregnancy', icon: <Activity size={18} />, label: 'Pregnancy Journey' },
      { to: '/mother/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
      { to: '/mother/records', icon: <Stethoscope size={18} />, label: 'Medical Records' },
      { to: '/mother/symptoms', icon: <AlertCircle size={18} />, label: 'Report Symptoms' },
      { to: '/mother/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [branding, setBranding] = useState<{
    hospital_name: string;
    hospital_abbreviation: string;
    logo_url: string | null;
    login_image_url: string | null;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0);
  const [navSearch, setNavSearch] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data } = await hospitalSettingsApi.get();
        setBranding(data);
      } catch (err) {
        console.error('Failed to load hospital settings:', err);
      }
    };
    fetchBranding();
    window.addEventListener('hospital-settings-updated', fetchBranding);
    return () => {
      window.removeEventListener('hospital-settings-updated', fetchBranding);
    };
  }, []);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    const updateQueueSize = async () => {
      const { getOfflineQueue } = await import('../utils/offlineQueue');
      setQueueSize(getOfflineQueue().length);
    };
    updateQueueSize();
    window.addEventListener('offline-queue-changed', updateQueueSize);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('offline-queue-changed', updateQueueSize);
    };
  }, []);

  // Show onboarding modal only if profile is not completed
  useEffect(() => {
    if (user && !user.profile_completed) {
      // Small delay to ensure page has rendered
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    } else {
      // Hide modal if profile becomes completed
      setShowOnboarding(false);
    }
  }, [user?.profile_completed, user?.id]);

  const userRole = user?.role ?? '';
  const location = useLocation();
  const isMotherPortal = location.pathname.startsWith('/mother');

  // Load unresolved tickets count for admin badge
  useEffect(() => {
    let mounted = true;
    const loadUnresolved = async () => {
      if (userRole !== 'ADMIN') return;
      try {
        const { data } = await ticketsApi.unresolvedCount();
        if (mounted) setUnresolvedCount(data?.unresolved_count ?? 0);
      } catch (err) {
        if (mounted) setUnresolvedCount(0);
      }
    };
    loadUnresolved();
    const interval = window.setInterval(loadUnresolved, 60000);
    const removeListener = onTicketResolved(() => {
      setUnresolvedCount(count => Math.max(0, count - 1));
    });
    return () => { mounted = false; window.clearInterval(interval); removeListener(); };
  }, [userRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className={`layout${isMotherPortal ? ' mother-portal' : ''}`}>
      {/* ── Mobile Backdrop ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ background: 'var(--bg-card)', padding: branding?.logo_url ? '2px' : '6px', borderRadius: '8px', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
              ) : (
                <HeartPulse size={20} />
              )}
            </div>
            <div className="logo-text" style={{ fontSize: '0.75rem', lineHeight: '1.2', maxWidth: '140px', color: 'var(--text-primary)', fontWeight: 700 }}>
              {branding?.hospital_name || 'ITIERIO MATERNITY AND NURSING HOME'}
            </div>
          </div>
        </div>

        {/* Search menu */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search menu..." value={navSearch} onChange={e => setNavSearch(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)' }} />
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            if (section.roles && !section.roles.includes(userRole)) return null;
            const visibleItems = section.items.filter(item =>
              (!item.roles || item.roles.includes(userRole)) &&
              (item.to !== '/pmtct' || userRole !== 'NURSE' || !!user?.has_pmtct_permission) &&
              (!navSearch || item.label.toLowerCase().includes(navSearch.toLowerCase()))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} style={{ marginBottom: 16 }}>
                <div className="nav-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderOpen size={12} /> {section.label}
                </div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {item.to === '/tickets' && userRole === 'ADMIN' && unresolvedCount > 0 && (
                      <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                        {unresolvedCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div 
            className="user-card cursor-pointer" 
            style={{ marginBottom: 10, background: 'transparent', padding: '0 8px' }} 
            onClick={() => setShowProfile(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowProfile(true);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="User Menu"
          >
            <div className="user-avatar" style={{ background: '#3B82F6', width: 40, height: 40 }}>{initials}</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.full_name || ''}</div>
              <div className='email-name' style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user?.email || ''}</div>
            </div>
            <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="main-content"
        style={{
          background: 'var(--bg-base)',
        }}
      >
        {/* Top Header */}
        <header className="page-header" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          <button 
            className="lg:hidden p-2 -ml-2 text-primary"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className="hidden md:flex" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', alignItems: 'center', gap: '8px', width: '100%', maxWidth: 'min(420px, 100%)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>
            </div>
          </div>
          <div className="header-actions" style={{ gap: '20px', color: 'var(--text-muted)' }}>
            {/* Sync & Connection Status Indicator */}
            <div className="hidden sm:flex items-center gap-2" style={{
              background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isOnline ? '#22c55e' : '#ef4444',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isOnline ? (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  <span>Online</span>
                  {queueSize > 0 && (
                    <span style={{ marginLeft: '4px', background: '#3B82F6', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>
                      {queueSize}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span>Offline {queueSize > 0 ? `(${queueSize} queued)` : ''}</span>
                </>
              )}
            </div>

            {user?.role === 'ADMIN' && <NotificationBell />}
            <ThemeToggle />
            <button
              className="btn btn-ghost hidden sm:inline-flex"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 6px rgba(2,6,23,0.04)'
              }}
            >
              <Calendar size={16} /> {formatDate(new Date().toISOString().split('T')[0])}
            </button>
            <span className="cursor-pointer hidden sm:inline flex items-center gap-2">
              <Hospital size={16} /> {branding?.hospital_abbreviation || 'IMNH'}
            </span>


            <div 
              className="cursor-pointer" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }} 
              onClick={() => setShowProfile(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowProfile(true);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="User Menu"
            >
              <div style={{ width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{initials}</div>
              <span className="hidden sm:inline" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{user?.full_name || 'User'}</span>
            </div>
          </div>
        </header>

        <div style={{ padding: '0' }}>
          <OfflineBanner />
          {userRole !== 'MOTHER' && <AlertBanner />}
          <Outlet />
        </div>
      </main>

      {/* ── User Menu (hamburger-style dropdown) ── */}
      {showProfile && (
        <UserMenu user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout} />
      )}

      {/* ── Profile Onboarding Modal ── */}
      <ProfileOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onProfileClick={() => {
          setShowOnboarding(false);
          navigate('/profile');
        }}
      />

      {/* ── Accessibility Toolbar ── */}
      <AccessibilityWidget />
    </div>
  );
}
