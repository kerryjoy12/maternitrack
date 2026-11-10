import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clinicalApi, patientsApi } from '../api';
import { formatDate } from '../utils';
import { 
  FlaskConical, 
  Camera, 
  Microscope, 
  Pill, 
  Link as LinkIcon, 
  FileText, 
  Fingerprint, 
  Paperclip,
  Plus,
  Trash2,
  FileIcon,
  Download,
  X,
  Upload,
  CheckCircle,
  RefreshCw,
  Check
} from 'lucide-react';

interface PatientDoc {
  id: number;
  patient: number;
  patient_name: string;
  document_type: string;
  document_type_display: string;
  title: string;
  description: string;
  file: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by_name: string | null;
  created_at: string;
}

const DOC_ICONS: Record<string, React.ReactNode> = {
  LAB_REPORT: <FlaskConical size={18} className="text-blue-500" />,
  ULTRASOUND: <Camera size={18} className="text-purple-500" />,
  SCAN: <Microscope size={18} className="text-teal-500" />,
  PRESCRIPTION: <Pill size={18} className="text-red-500" />,
  REFERRAL: <LinkIcon size={18} className="text-indigo-500" />,
  CONSENT: <FileText size={18} className="text-slate-500" />,
  ID_DOCUMENT: <Fingerprint size={18} className="text-orange-500" />,
  OTHER: <Paperclip size={18} className="text-slate-400" />,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [docs, setDocs] = useState<PatientDoc[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const [form, setForm] = useState({
    patient: patientId || '',
    document_type: 'OTHER',
    title: '',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (patientId) params.patient = patientId;
    const [dRes, pRes] = await Promise.all([
      clinicalApi.listDocs(params),
      patientsApi.list(),
    ]);
    setDocs(dRes.data.results ?? dRes.data);
    setPatients((pRes.data.results ?? pRes.data));
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setSaving(true);
    setError('');
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('patient', form.patient);
    fd.append('document_type', form.document_type);
    fd.append('title', form.title);
    fd.append('description', form.description);
    try {
      await clinicalApi.uploadDoc(fd);
      setShowForm(false);
      setSelectedFile(null);
      flash('Document uploaded ✓');
      load();
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to upload document. Please check your connection and try again.';
      setError(errMsg);
    }
    finally { setSaving(false); }
  };


  const handleDelete = (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await clinicalApi.deleteDoc(id);
          flash('Document deleted');
          load();
        } catch {
          alert('Failed to delete document.');
        }
      }
    });
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2 italic-none"><FileIcon className="text-primary" /> Patient Documents</h1>
        <div className="header-actions">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(v => !v)}>
            {showForm ? <><X size={18} /> Close</> : <><Plus size={18} /> Upload Document</>}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && (
          <div className="alert alert-success italic-none flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {error && (
          <div className="alert alert-danger italic-none flex items-center gap-2 mb-4">
            <X size={18} /> {error}
          </div>
        )}


        {/* Upload Form */}
        {showForm && (
          <div className="card mb-6 border-l-4 border-primary shadow-sm italic-none">
            <div className="section-title flex items-center gap-2">
               <Plus size={20} className="text-primary" /> Upload New Document
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patient} onChange={e => set('patient', e.target.value)} required>
                    <option value="">Select patient…</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select className="form-select" value={form.document_type} onChange={e => set('document_type', e.target.value)}>
                    {Object.keys(DOC_ICONS).map((k) => (
                      <option key={k} value={k}>{k.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Ultrasound Week 20" />
                </div>
                <div className="form-group">
                  <label className="form-label">File * (max 10MB)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                  {selectedFile && (
                    <span className="form-hint">{selectedFile.name} — {formatSize(selectedFile.size)}</span>
                  )}
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving || !selectedFile}>
                  {saving ? 'Uploading…' : <><Upload size={18} /> Upload Document</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Documents Grid */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileIcon size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No documents uploaded</div>
            <div className="empty-desc">Upload lab reports, ultrasounds, or scans.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 italic-none">
            {docs.map(d => (
              <div key={d.id} className="card hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    {DOC_ICONS[d.document_type] || <Paperclip size={18} className="text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate" title={d.title}>
                      {d.title}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{d.patient_name}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge badge-primary text-[10px]">{d.document_type_display}</span>
                  <span className="badge badge-neutral text-[10px]">{formatSize(d.file_size_bytes)}</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 border-t border-slate-50 pt-2">
                  {formatDate(d.created_at)}
                  {d.uploaded_by_name && ` · by ${d.uploaded_by_name}`}
                </div>
                {d.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{d.description}</p>}
                <div className="flex gap-2 mt-auto pt-3 border-t border-slate-50">
                  <a href={d.file} target="_blank" rel="noopener" className="btn btn-ghost btn-xs flex-1 flex items-center justify-center gap-2">
                    <Download size={14} /> Download
                  </a>
                  <button className="btn btn-ghost btn-xs text-red-500 px-2" onClick={() => handleDelete(d.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
