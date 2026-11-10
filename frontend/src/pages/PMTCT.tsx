import { useEffect, useState, FormEvent } from 'react';
import { 
  ShieldAlert, 
  User, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  X,
  Lock,
  Heart,
  Baby
} from 'lucide-react';
import { pmtctApi, patientsApi } from '../api';
import { Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils';

interface PMTCTRecord {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  hiv_status: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN' | 'DECLINED_TEST';
  test_date: string | null;
  arv_regimen: string;
  arv_start_date: string | null;
  viral_load: string | null;
  viral_load_date: string | null;
  cd4_count: number | null;
  infant_prophylaxis: boolean;
  infant_test_at_6wk: string;
  infant_test_at_18mo: string;
  disclosure_status: 'DISCLOSED' | 'NOT_DISCLOSED';
  counselor: number;
  counselor_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function PMTCT() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PMTCTRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState<number | ''>('');
  const [hivStatus, setHivStatus] = useState<PMTCTRecord['hiv_status']>('UNKNOWN');
  const [testDate, setTestDate] = useState('');
  const [arvRegimen, setArvRegimen] = useState('');
  const [arvStartDate, setArvStartDate] = useState('');
  const [viralLoad, setViralLoad] = useState('');
  const [viralLoadDate, setViralLoadDate] = useState('');
  const [cd4Count, setCd4Count] = useState('');
  const [infantProphylaxis, setInfantProphylaxis] = useState(false);
  const [infantTest6wk, setInfantTest6wk] = useState('');
  const [infantTest18mo, setInfantTest18mo] = useState('');
  const [disclosureStatus, setDisclosureStatus] = useState<PMTCTRecord['disclosure_status']>('NOT_DISCLOSED');
  const [notes, setNotes] = useState('');

  // Access Control: check if ADMIN or DOCTOR, or NURSE with permission
  const hasAccess = 
    user && (user.role === 'ADMIN' || user.role === 'DOCTOR' || (user.role === 'NURSE' && user.has_pmtct_permission));

  const loadData = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [pmtctRes, pRes] = await Promise.all([
        pmtctApi.list(),
        patientsApi.list({ limit: '100' })
      ]);
      setRecords(pmtctRes.data.results ?? pmtctRes.data);
      
      // Filter out patients who already have a PMTCT record to avoid duplicate registry logs
      const rawPatients: Patient[] = pRes.data.results ?? pRes.data;
      const registeredIds = new Set((pmtctRes.data.results ?? pmtctRes.data).map((r: PMTCTRecord) => r.patient));
      setPatients(rawPatients.filter(p => !registeredIds.has(p.id)));
    } catch (err) {
      setError('Access denied or failed to load PMTCT data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!hasAccess) {
    return (
      <div className="card empty-state" style={{ padding: '60px 40px', marginTop: '40px' }}>
        <Lock size={64} className="text-danger mb-4" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
        <p className="text-muted" style={{ maxWidth: '500px', margin: '8px auto 24px' }}>
          You do not have administrative or delegated permissions to access the PMTCT (Prevention of Mother-to-Child Transmission) Registry. Contact system admin to assign permissions.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    try {
      await pmtctApi.create({
        patient: patientId,
        hiv_status: hivStatus,
        test_date: testDate || null,
        arv_regimen: arvRegimen,
        arv_start_date: arvStartDate || null,
        viral_load: viralLoad || null,
        viral_load_date: viralLoadDate || null,
        cd4_count: cd4Count ? parseInt(cd4Count, 10) : null,
        infant_prophylaxis: infantProphylaxis,
        infant_test_at_6wk: infantTest6wk,
        infant_test_at_18mo: infantTest18mo,
        disclosure_status: disclosureStatus,
        notes,
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to register PMTCT details.');
    }
  };

  const resetForm = () => {
    setPatientId('');
    setHivStatus('UNKNOWN');
    setTestDate('');
    setArvRegimen('');
    setArvStartDate('');
    setViralLoad('');
    setViralLoadDate('');
    setCd4Count('');
    setInfantProphylaxis(false);
    setInfantTest6wk('');
    setInfantTest18mo('');
    setDisclosureStatus('NOT_DISCLOSED');
    setNotes('');
    setError('');
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <ShieldAlert className="text-primary" size={28} /> PMTCT Compliance Registry
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
          >
            <Plus size={16} /> Register Patient
          </button>
        </div>
      </header>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger flex items-center gap-2 mb-4">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="card empty-state" style={{ padding: '40px' }}>
            <ShieldAlert size={48} className="text-muted opacity-20 mb-3" />
            <h3>No registry records recorded</h3>
            <p className="text-muted">Register a patient to track maternal and infant PMTCT interventions.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((rec) => (
              <div key={rec.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex-between flex-wrap gap-4 mb-3">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }} className="flex items-center gap-2 text-primary">
                        <User size={16} /> {rec.patient_name} ({rec.patient_number})
                      </h3>
                      <div className="text-muted flex items-center gap-2 mt-1" style={{ fontSize: '0.85rem' }}>
                        <span>Disclosure status: <strong>{rec.disclosure_status}</strong></span>
                        <span>•</span>
                        <span>Counselor: <strong>{rec.counselor_name || 'Staff'}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${rec.hiv_status === 'POSITIVE' ? 'badge-danger' : 'badge-success'}`}>
                        {rec.hiv_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted block">HIV Test Details</span>
                      <strong>Date: {formatDate(rec.test_date) || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Maternal ARVs</span>
                      <strong>{rec.arv_regimen || 'Not Prescribed'}</strong>
                      {rec.arv_start_date && <span className="block text-xs text-muted">Started: {formatDate(rec.arv_start_date)}</span>}
                    </div>
                    <div>
                      <span className="text-muted block">Viral Load & CD4</span>
                      <strong>{rec.viral_load ? `${rec.viral_load} c/ml` : 'VL: —'}</strong>
                      <span className="block text-xs text-muted">CD4 Count: {rec.cd4_count || '—'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div>
                      <span className="text-muted block flex items-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        <Baby size={14} className="text-primary" /> Infant Interventions
                      </span>
                      <div className="mt-1" style={{ fontSize: '0.85rem' }}>
                        <div>Infant Prophylaxis: <strong>{rec.infant_prophylaxis ? 'Administered' : 'Not Administered'}</strong></div>
                        <div>PCR Test 6 Weeks: <strong className="text-warning">{rec.infant_test_at_6wk || 'Pending'}</strong></div>
                        <div>Antibody Test 18 Months: <strong className="text-warning">{rec.infant_test_at_18mo || 'Pending'}</strong></div>
                      </div>
                    </div>

                    {rec.notes && (
                      <div>
                        <span className="text-muted block" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clinical Notes</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{rec.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGISTRY MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header">
              <h3>Register PMTCT Record</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
                <label className="form-label mb-3">
                  Select Patient *
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="form-label">
                    HIV Status *
                    <select
                      value={hivStatus}
                      onChange={(e) => setHivStatus(e.target.value as any)}
                      className="form-select"
                      required
                    >
                      <option value="UNKNOWN">Unknown</option>
                      <option value="NEGATIVE">HIV Negative</option>
                      <option value="POSITIVE">HIV Positive</option>
                      <option value="DECLINED_TEST">Declined Test</option>
                    </select>
                  </label>

                  <label className="form-label">
                    HIV Test Date
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="form-input"
                    />
                  </label>
                </div>

                {hivStatus === 'POSITIVE' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.04)', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>Positive Mother Interventions</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <label className="form-label">
                        ARV Regimen
                        <input
                          type="text"
                          value={arvRegimen}
                          onChange={(e) => setArvRegimen(e.target.value)}
                          placeholder="e.g. TDF/3TC/DTG"
                          className="form-input"
                        />
                      </label>

                      <label className="form-label">
                        ARV Start Date
                        <input
                          type="date"
                          value={arvStartDate}
                          onChange={(e) => setArvStartDate(e.target.value)}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <label className="form-label">
                        Viral Load (copies/ml)
                        <input
                          type="number"
                          value={viralLoad}
                          onChange={(e) => setViralLoad(e.target.value)}
                          className="form-input"
                        />
                      </label>

                      <label className="form-label">
                        Viral Load Date
                        <input
                          type="date"
                          value={viralLoadDate}
                          onChange={(e) => setViralLoadDate(e.target.value)}
                          className="form-input"
                        />
                      </label>

                      <label className="form-label">
                        CD4 Cell Count
                        <input
                          type="number"
                          value={cd4Count}
                          onChange={(e) => setCd4Count(e.target.value)}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="divider" style={{ margin: '14px 0' }} />
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>Infant & Partner Interventions</h4>

                    <label className="flex items-center gap-2 mb-3 cursor-pointer" style={{ fontSize: '0.95rem' }}>
                      <input
                        type="checkbox"
                        checked={infantProphylaxis}
                        onChange={(e) => setInfantProphylaxis(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Infant ARV Prophylaxis Administered
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="form-label">
                        Infant PCR Test at 6 Weeks
                        <input
                          type="text"
                          value={infantTest6wk}
                          onChange={(e) => setInfantTest6wk(e.target.value)}
                          placeholder="e.g. Negative, Positive, Pending"
                          className="form-input"
                        />
                      </label>

                      <label className="form-label">
                        Infant Antibody Test at 18 Months
                        <input
                          type="text"
                          value={infantTest18mo}
                          onChange={(e) => setInfantTest18mo(e.target.value)}
                          placeholder="e.g. Negative, Positive, Pending"
                          className="form-input"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="form-label">
                    HIV Disclosure Status
                    <select
                      value={disclosureStatus}
                      onChange={(e) => setDisclosureStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="NOT_DISCLOSED">Not Disclosed to Partner</option>
                      <option value="DISCLOSED">Disclosed to Partner</option>
                    </select>
                  </label>
                </div>

                <label className="form-label mb-3">
                  Counseling Notes & Partner Status details
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter details on partner test referral, nutrition counseling, etc..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Registry Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
