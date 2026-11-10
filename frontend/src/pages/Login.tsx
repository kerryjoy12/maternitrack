import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, AlertCircle, LogIn, Activity, CheckCircle, Hospital, ShieldCheck } from 'lucide-react';
import { authApi, dashboardApi, hospitalSettingsApi } from '../api';
import { useAuth } from '../context/AuthContext';

// Vite static asset import for the left login panel
const loginPanelImage = new URL('../../images/login_image.jpg', import.meta.url).href;

interface PublicStats {
  patients_count: number;
  active_deliveries: number;
  clinic_reminders_sent: number;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [branding, setBranding] = useState<{
    hospital_name: string;
    hospital_abbreviation: string;
    logo_url: string | null;
    login_image_url: string | null;
  } | null>(null);

  useEffect(() => {
    dashboardApi.publicStats()
      .then(({ data }: { data: any }) => setStats(data))
      .catch((err: any) => console.error('Failed to load public stats:', err));

    hospitalSettingsApi.get()
      .then(({ data }: { data: any }) => setBranding(data))
      .catch((err: any) => console.error('Failed to load hospital settings:', err));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      // Pass supabase_session alongside Django JWT so SupabaseContext
      // can call supabase.auth.setSession() for Realtime auth
      login({
        access: data.access,
        refresh: data.refresh,
        user: data.user,
        supabase_session: data.supabase_session,
      });
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split-page">
      {/* ── Left panel ── */}
      <div className="login-image-panel">
        <div className="login-image-overlay">
          <div className="login-image-content">
            <div className="login-image-badge flex items-center gap-2">
               <Building2 size={16} /> {branding?.hospital_name || 'Itierio Nursing Home'}
            </div>
            <h2 className="login-image-headline">
              Compassionate Care<br />
              <span>for Every Mother</span>
            </h2>
            <p className="login-image-sub">
              Tracking maternal health journeys from antenatal to postnatal care
              with precision and empathy.
            </p>
            <div className="login-stats-row">
              <div className="login-stat">
                <span className="login-stat-value">{stats ? stats.patients_count : '—'}</span>
                <span className="login-stat-label">Registered Patients</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">{stats ? stats.active_deliveries : '—'}</span>
                <span className="login-stat-label">Active Deliveries</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">{stats ? stats.clinic_reminders_sent : '—'}</span>
                <span className="login-stat-label">SMS Reminders Sent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          {/* Logo */}
          <div className="login-form-logo">
            <div className="login-form-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: branding?.logo_url ? 0 : 6 }}>
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Activity size={32} />
              )}
            </div>
            <h1>Materni<span>Track</span></h1>
            <p>Maternity Follow-Up Tracker</p>
            <span className="login-form-org">{branding?.hospital_name || 'Itierio Nursing Home'}</span>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger flex items-center gap-2" style={{ marginBottom: 20 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input login-input outline-none"
                placeholder="nurse@itierionursing.co.ke"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="login-pass-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn login-submit-btn flex items-center justify-center gap-2 italic-none"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Signing in…</>
                : <><LogIn size={18} /> Sign In to MaterniTrack</>
              }
            </button>
          </form>

          <p className="login-footer-note">
            Authorized staff only. Contact your administrator for access.
          </p>

          <div className="login-divider" />
          <div className="login-trust-badges">
            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-success" /> Secure Login</span>
            <span className="flex items-center gap-1" title="Compliant with Kenya Data Protection Act 2019">
              <ShieldCheck size={14} className="text-primary" /> Kenya DPA Compliant
            </span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-success" /> Data Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
