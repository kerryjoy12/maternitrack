import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mail, Phone, UserIcon, Bell, BellOff } from 'lucide-react';
import { staffApi } from '../api';

export default function UserProfile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const isMother = user?.role === 'MOTHER';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setNotifPermission(Notification.permission);
    setNotifEnabled(Notification.permission === 'granted' && localStorage.getItem('notif_enabled') !== 'false');
  }, []);

  const handleNotifToggle = async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked by your browser. Please enable them in your browser/device settings.');
      return;
    }

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        localStorage.setItem('notif_enabled', 'true');
        setNotifEnabled(true);
        new Notification('MaterniTrack', {
          body: 'Notifications enabled! You will receive clinical alerts.',
          icon: '/favicon.png',
        });
      }
      return;
    }

    // Permission already granted — just toggle on/off
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem('notif_enabled', String(next));
    if (next) {
      new Notification('MaterniTrack', {
        body: 'Notifications re-enabled.',
        icon: '/favicon.png',
      });
    }
  };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = isMother
        ? {
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          profile_completed: true,
        }
        : {
          ...formData,
          profile_completed: true,
        };

      const response = await staffApi.updateProfile(updateData);

      // Update the auth context with the new user data
      if (response.data) {
        const accessToken = localStorage.getItem('access_token') || '';
        const refreshToken = localStorage.getItem('refresh_token') || '';
        login({
          access: accessToken,
          refresh: refreshToken,
          user: response.data,
        });
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        navigate(isMother ? '/mother/dashboard' : '/');
      }, 1500);
    } catch (err: any) {
      let detail = 'Failed to update profile';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          detail = err.response.data;
        } else if (err.response.data.detail) {
          detail = err.response.data.detail;
        } else if (err.response.data.error) {
          detail = err.response.data.error;
        } else if (typeof err.response.data === 'object') {
          detail = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
      } else if (err.message) {
        detail = err.message;
      }
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</h1>
      </header>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        {error && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#DC2626',
            marginBottom: 24,
            border: '1px solid #FCA5A5',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#16A34A',
            marginBottom: 24,
            border: '1px solid #86EFAC',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Profile Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid var(--border)',
          }}>
            {/* Avatar Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
              paddingBottom: 32,
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--hosp-blue), var(--purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'white',
              }}>
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {user?.role} • Joined {new Date(user?.date_joined || '').toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  <UserIcon size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  <Mail size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              {/* Phone Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  <Phone size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {!isMother && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    Professional Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about your professional background, specialties, or interests..."
                    rows={6}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notifications Settings */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} /> Notification Settings
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Push Notifications</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {notifPermission === 'denied'
                    ? 'Blocked by browser — enable in device settings'
                    : notifEnabled
                      ? 'Appointment reminders: 3 days, 2 days, 1 day before & on the day'
                      : 'Enable to receive appointment reminders in your notification bar'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleNotifToggle}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  fontWeight: 600, fontSize: '0.85rem', cursor: notifPermission === 'denied' ? 'not-allowed' : 'pointer',
                  background: notifEnabled ? 'var(--success)' : 'var(--bg-input)',
                  color: notifEnabled ? '#fff' : 'var(--text-secondary)',

                  transition: 'all 0.2s',
                  opacity: notifPermission === 'denied' ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {notifEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                {notifEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: loading ? 'var(--text-muted)' : 'var(--hosp-blue)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => !loading && (e.currentTarget.style.opacity = '1')}
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
