import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightCircle, RefreshCw } from 'lucide-react';
import { ticketsApi } from '../api';
import { emitTicketResolved } from '../utils/ticketEvents';
import { Ticket } from '../types';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await ticketsApi.list();
      setTickets(data.results ?? data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const navigate = useNavigate();

  const updateStatus = async (ticketId: number, nextStatus: string) => {
    await ticketsApi.updateStatus(ticketId, nextStatus);
    if (nextStatus === 'RESOLVED') {
      emitTicketResolved();
    }
    loadTickets();
  };

  const viewTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}`);
  };

  const nextStatus = (current: string) => {
    if (current === 'OPEN') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'RESOLVED';
    return '';
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <ArrowRightCircle className="text-primary" size={28} /> Clinical Tickets
        </h1>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={loadTickets}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon"><ArrowRightCircle size={48} className="text-primary" /></div>
            <div className="empty-title">No clinical tickets yet.</div>
            <div className="empty-desc">Tickets will appear here after doctors and nurses report clinical issues.</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Patient</th>
                    <th>Created by</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const next = nextStatus(ticket.status);
                    return (
                      <tr key={ticket.id}>
                        <td>{ticket.title}</td>
                        <td>
                          <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td>{ticket.patient_number ? `${ticket.patient_number} — ${ticket.patient_name}` : 'Unassigned'}</td>
                        <td>{ticket.created_by_name} ({ticket.created_by_role})</td>
                        <td>{STATUS_LABELS[ticket.status] ?? ticket.status}</td>
                        <td>{new Date(ticket.created_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => viewTicket(ticket.id)}
                            style={{ marginRight: 8 }}
                          >
                            View
                          </button>
                          {next ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => updateStatus(ticket.id, next)}
                            >
                              Mark {next === 'IN_PROGRESS' ? 'In Progress' : 'Resolved'}
                            </button>
                          ) : (
                            <span className="badge badge-success">Complete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
