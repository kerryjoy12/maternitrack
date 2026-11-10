import { useEffect, useRef, useState } from 'react';
import { Mail, Phone, User as UserIcon, LogOut, Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api';
import { Notification, User } from '../types';

interface Props {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onClose, onLogout }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const shouldShowProfileReminder = user && !user.profile_completed;

  const handleViewProfile = () => {
    navigate('/profile');
    onClose();
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data } = await notificationsApi.list({ unread: 'true' });
      setNotifications(data.results ?? data);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
    } catch {
      // ignore failure for now
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data } = await notificationsApi.unreadCount();
      setUnreadCount(data?.unread_count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const handleToggleNotifications = async () => {
    if (!showNotification) {
      await loadNotifications();
      await markAllNotificationsRead();
    }
    setShowNotification((current) => !current);
  };

  const markNotificationRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      await loadNotifications();
      await loadUnreadCount();
    } catch {
      // ignore failure for now
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, []);

  return (
    <div style={{ position: 'fixed', top: '76px', right: 20, zIndex: 200, maxWidth: 'calc(100vw - 40px)' }}>
      <div ref={ref} className="user-menu card" style={{ width: 320, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        {/* Notification Alert Banner */}
        {shouldShowProfileReminder && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
            borderBottom: '1px solid var(--border)',
            color: 'var(--hosp-blue)',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}>
            <Bell size={16} />
            <span>Complete your profile to get started</span>
          </div>
        )}

        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 12, padding: 16, alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,var(--hosp-blue),var(--purple))', color: 'white' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{user?.full_name || 'Unknown'}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{user?.role || 'NURSE'}</div>
          </div>
        </div>

        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><Mail size={16} /></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email || 'n/a'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><Phone size={16} /></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.phone_number || 'n/a'}</div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          {/* Notification Bell Button */}
          <button 
            className="btn"
            style={{
              justifyContent: 'flex-start',
              gap: 12,
              position: 'relative',
            }}
            onClick={handleToggleNotifications}
            title="View notifications"
          >
            <Bell size={18} />
            Notifications
            {(shouldShowProfileReminder || unreadCount > 0) && (
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                marginLeft: 'auto',
              }} />
            )}
          </button>

          {/* View Profile Button */}
          <button 
            className="btn"
            style={{ justifyContent: 'flex-start', gap: 12 }}
            onClick={handleViewProfile}
          >
            <UserIcon size={18} /> View Profile
          </button>
          
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 12, color: 'var(--danger)' }} onClick={onLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Notification Drawer */}
        {showNotification && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '12px 16px',
            background: 'var(--bg-hover)',
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {loadingNotifications ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} style={{
                  marginBottom: 12,
                  padding: '12px',
                  borderRadius: 10,
                  background: notification.is_read ? 'var(--bg-base)' : 'rgba(238, 68, 68, 0.06)',
                  border: notification.is_read ? '1px solid var(--border)' : '1px solid rgba(239, 68, 68, 0.15)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{notification.message}</p>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {notification.ticket_title ? `Ticket: ${notification.ticket_title}` : 'General notification'}
                      </p>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'var(--hosp-blue)',
                          color: 'white',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : shouldShowProfileReminder ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}>
                No new notifications.
              </div>
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}>
                No new notifications.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
