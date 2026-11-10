import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Mail } from 'lucide-react';
import { notificationsApi } from '../api';
import { Notification } from '../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data.results ?? data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id);
    loadNotifications();
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <Bell className="text-primary" size={28} /> Notifications
        </h1>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon"><Mail size={48} className="text-primary" /></div>
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">No notifications have been generated yet.</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Ticket</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td style={{ maxWidth: 340 }}>{notification.message}</td>
                      <td>{notification.ticket_title || 'N/A'}</td>
                      <td>
                        {notification.is_read ? (
                          <span className="badge badge-success">Read</span>
                        ) : (
                          <span className="badge badge-warning">Unread</span>
                        )}
                      </td>
                      <td>{new Date(notification.created_at).toLocaleString()}</td>
                      <td>
                        {!notification.is_read && (
                          <button className="btn btn-sm btn-primary" onClick={() => markRead(notification.id)}>
                            <CheckCircle2 size={14} /> Mark read
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
