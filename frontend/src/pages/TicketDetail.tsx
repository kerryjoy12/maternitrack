import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ShieldAlert } from 'lucide-react';
import { ticketsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Ticket } from '../types';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const loadTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await ticketsApi.get(Number(id));
      setTicket(data);
    } catch (err) {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleReplySubmit = async () => {
    if (!ticket || !replyMessage.trim()) {
      setError('Please enter a reply message.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await ticketsApi.reply(ticket.id, replyMessage.trim());
      setTicket(data);
      setReplyMessage('');
    } catch (err) {
      setError('Unable to send reply. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="flex items-center gap-3">
          <ShieldAlert className="text-primary" size={28} /> Ticket Details
        </h1>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : !ticket ? (
          <div className="card empty-state">
            <div className="empty-icon"><ShieldAlert size={48} className="text-primary" /></div>
            <div className="empty-title">Ticket not found</div>
            <div className="empty-desc">This ticket may not exist or you do not have permission to view it.</div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{ticket.title}</h2>
              <div className="flex gap-2 flex-wrap">
                <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                <span className={`badge badge-${ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'info'}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-sm text-muted">Raised by</p>
                  <p>{ticket.created_by_name} ({ticket.created_by_role})</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Created</p>
                  <p>{new Date(ticket.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Updated</p>
                  <p>{new Date(ticket.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Patient</p>
                  <p>{ticket.patient ? `${ticket.patient_number ?? ''}${ticket.patient_number ? ' — ' : ''}${ticket.patient_name ?? 'Unassigned'}` : 'Unassigned'}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted">Description</p>
                <div className="prose max-w-none whitespace-pre-wrap rounded-xl border border-base-200 bg-base-100 p-4 text-sm">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Admin reply</h3>
                  {ticket.reply ? (
                    <div className="rounded-xl border border-base-200 bg-base-100 p-4">
                      <p className="text-sm text-muted">By {ticket.reply.author_name} on {new Date(ticket.reply.created_at).toLocaleString()}</p>
                      <div className="mt-3 whitespace-pre-wrap text-sm">{ticket.reply.message}</div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-base-200 bg-base-100 p-4 text-sm text-muted">
                      No reply has been posted yet.
                    </div>
                  )}
                </div>

                {isAdmin && !ticket.reply && (
                  <div className="rounded-xl border border-base-200 bg-base-100 p-4">
                    <h3 className="text-lg font-semibold">Post an admin reply</h3>
                    <textarea
                      rows={5}
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      className="textarea textarea-bordered w-full mt-3"
                      placeholder="Write your reply to the ticket creator..."
                      style={{
                        background: 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        caretColor: 'var(--text-primary)',
                      }}
                    />
                    {error && <p className="text-sm text-error mt-2">{error}</p>}
                    <button
                      className="btn btn-primary mt-4"
                      onClick={handleReplySubmit}
                      disabled={saving}
                    >
                      <MessageCircle size={16} />
                      <span style={{ marginLeft: 8 }}>{saving ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
