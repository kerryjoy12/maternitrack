import React, { useEffect, useState } from 'react';
import { staffApi } from '../api';
import { StaffUser } from '../types';
import { Users, UserPlus, ShieldCheck, Trash2, Mail, Phone, Shield, Edit2, Eye, Lock, Unlock, X } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--hosp-red, #ef4444)',
  DOCTOR: 'var(--hosp-teal, #14b8a6)',
  NURSE: 'var(--hosp-green, #22c55e)',
  MOTHER: 'var(--primary, #2563EB)',
};

const BLANK_FORM: { email: string; full_name: string; password?: string; role: 'ADMIN' | 'NURSE' | 'DOCTOR' | 'MOTHER'; phone_number: string } = { email: '', full_name: '', password: '', role: 'NURSE', phone_number: '' };

export default function AdminUsers() {
  const [users, setUsers]     = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(BLANK_FORM);
  const [editId, setEditId]   = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<StaffUser | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await staffApi.list();
      setUsers(data.results ?? data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        // Exclude password from update if it's empty
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        await staffApi.update(editId, payload);
        setSuccess('Staff member updated');
      } else {
        await staffApi.register(form);
        setSuccess('Staff member created');
      }
      setTimeout(() => setSuccess(''), 3000);
      setForm(BLANK_FORM);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: StaffUser) => {
    setForm({
      email: u.email,
      full_name: u.full_name,
      password: '', // Optional for updates
      role: u.role,
      phone_number: u.phone_number || ''
    });
    setEditId(u.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLock = (u: StaffUser) => {
    const action = u.is_active ? 'Deactivate' : 'Reactivate';
    setConfirmModal({
      show: true,
      title: `${action} Staff Member`,
      message: `Are you sure you want to ${action.toLowerCase()} ${u.full_name}?`,
      onConfirm: async () => {
        try {
          if (u.is_active) {
            await staffApi.deactivate(u.id);
          } else {
            await staffApi.reactivate(u.id);
          }
          load();
        } catch (err: any) {
          alert(err.response?.data?.error ?? `Failed to ${action.toLowerCase()} user.`);
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Staff Member',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await staffApi.delete(id);
          setSuccess('Staff member deleted successfully.');
          setTimeout(() => setSuccess(''), 3000);
          load();
        } catch (err: any) {
          alert(err.response?.data?.error ?? 'Failed to delete user.');
        }
      }
    });
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await staffApi.changeRole(id, newRole);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed.');
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2 italic-none"><Users className="text-primary" /> User Management</h1>
        <div className="header-actions">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Close' : <><UserPlus size={18} /> Add Staff</>}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && <div className="alert alert-success italic-none flex items-center gap-2"><ShieldCheck size={18} /> {success}</div>}

        {showForm && (
          <div className="card mb-6 border-l-4 border-teal-500 shadow-sm italic-none">
            <div className="section-title flex items-center gap-2">
               <UserPlus size={20} className="text-teal-500" /> Register New Staff Member
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input" style={{ paddingLeft: '38px' }} type="email" required value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input" style={{ paddingLeft: '38px' }} value={form.phone_number}
                      onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+254..." />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input className="form-input" type="password" required value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select className="form-select text-xs font-bold" style={{ paddingLeft: '38px' }} value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                      <option value="NURSE">NURSE</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="MOTHER">MOTHER</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 italic-none">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                   {saving ? 'Registering...' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : (
          <div className="card shadow-sm border-none italic-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="uppercase text-[11px] font-bold tracking-wider text-slate-500">
                    <th className="px-4 py-3">User / Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">Contact</th>
                    <th className="px-4 py-3 text-center">PMTCT Access</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 italic-none">
                        <div className="font-bold text-sm text-slate-900">{u.full_name || 'Staff Member'}</div>
                        <div className="text-slate-400 text-xs">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="bg-transparent border-none font-bold text-[10px] cursor-pointer focus:ring-0 p-0 outline-none"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ color: ROLE_COLORS[u.role] }}
                        >
                          <option value="NURSE">NURSE</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="MOTHER">MOTHER</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                           <Phone size={12} className="text-slate-400" /> {u.phone_number || '—'}
                         </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {u.role === 'NURSE' ? (
                          <input
                            type="checkbox"
                            checked={!!u.has_pmtct_permission}
                            onChange={async (e) => {
                              try {
                                await staffApi.togglePMTCTPermission(u.id, e.target.checked);
                                load();
                              } catch {
                                alert('Failed to update PMTCT permission.');
                              }
                            }}
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">Full Access</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {new Date(u.date_joined).toLocaleDateString('en-KE')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-ghost btn-xs hover:bg-slate-100"
                            style={{ color: '#2563eb' }}
                            onClick={() => setViewUser(u)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs hover:bg-amber-50"
                            style={{ color: '#d97706' }}
                            onClick={() => handleEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs hover:bg-purple-50"
                            style={{ color: u.is_active ? '#7c3aed' : '#ef4444' }}
                            onClick={() => handleToggleLock(u)}
                            title={u.is_active ? "Lock User" : "Unlock User"}
                          >
                            {u.is_active ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-xs hover:bg-red-50"
                            style={{ color: '#dc2626' }}
                            onClick={() => handleDelete(u.id)}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewUser(null)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title flex items-center gap-2">
                <Users size={20} className="text-primary" /> User Details
              </div>
              <button className="modal-close" onClick={() => setViewUser(null)}><X size={20} /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                  {viewUser.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewUser.full_name}</h3>
                  <div className="text-sm text-slate-500">{viewUser.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Role</span>
                  <span className="badge" style={{ backgroundColor: ROLE_COLORS[viewUser.role], color: 'white' }}>
                    {viewUser.role}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Status</span>
                  <span className={`badge ${viewUser.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {viewUser.is_active ? 'Active' : 'Locked'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Phone Number</span>
                  <span className="font-medium">{viewUser.phone_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Joined</span>
                  <span className="font-medium">{new Date(viewUser.date_joined).toLocaleDateString('en-KE')}</span>
                </div>
                {viewUser.role === 'NURSE' && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block mb-1">PMTCT Access</span>
                    <span className="font-medium">{viewUser.has_pmtct_permission ? 'Granted' : 'Revoked'}</span>
                  </div>
                )}
                <div className="col-span-2 mt-2">
                  <span className="text-slate-500 block mb-1">Bio</span>
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-700 min-h-[60px]">
                    {viewUser.bio || 'No bio provided.'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmModal(prev => ({ ...prev, show: false }))}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
                {confirmModal.title}
              </div>
            </div>
            <div className="modal-body py-4 text-slate-600 dark:text-slate-300">
              {confirmModal.message}
            </div>
            <div className="modal-footer flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button className="btn btn-ghost" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, show: false }));
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
