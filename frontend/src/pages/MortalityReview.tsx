import { useEffect, useState, FormEvent } from 'react';
import { 
  AlertOctagon, 
  User, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  X,
  ShieldAlert
} from 'lucide-react';
import { mortalityApi, patientsApi } from '../api';
import { Patient } from '../types';
import { formatDate } from '../utils';

interface MortalityRecord {
  id: number;
  patient: number | null;
  patient_name: string;
  patient_number: string;
  date_of_death: string;
  cause_of_death: string;
  avoidable_factors: string;
  three_delays: string;
  recommendations: string;
  reviewed_by: number;
  reviewed_by_name: string;
  review_date: string;
  is_near_miss: boolean;
  created_at: string;
  updated_at: string;
}

export default function MortalityReview() {
  const [reviews, setReviews] = useState<MortalityRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState<number | ''>('');
  const [dateOfEvent, setDateOfEvent] = useState(new Date().toISOString().split('T')[0]);
  const [cause, setCause] = useState('');
  const [avoidableFactors, setAvoidableFactors] = useState('');
  const [threeDelays, setThreeDelays] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNearMiss, setIsNearMiss] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        mortalityApi.list(),
        patientsApi.list({ limit: '100' })
      ]);
      setReviews(mRes.data.results ?? mRes.data);
      setPatients(pRes.data.results ?? pRes.data);
    } catch (err) {
      setError('Access denied or failed to load reviews data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await mortalityApi.create({
        patient: patientId || null,
        date_of_death: dateOfEvent,
        cause_of_death: cause,
        avoidable_factors: avoidableFactors,
        three_delays: threeDelays,
        recommendations: recommendations,
        review_date: reviewDate,
        is_near_miss: isNearMiss,
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit review.');
    }
  };

  const resetForm = () => {
    setPatientId('');
    setDateOfEvent(new Date().toISOString().split('T')[0]);
    setCause('');
    setAvoidableFactors('');
    setThreeDelays('');
    setRecommendations('');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setIsNearMiss(false);
    setError('');
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <AlertOctagon className="text-danger" size={28} /> Maternal Mortality & Near-Miss Audit
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-danger flex items-center gap-2"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
          >
            <Plus size={16} /> Log Audit Review
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
        ) : reviews.length === 0 ? (
          <div className="card empty-state" style={{ padding: '40px' }}>
            <AlertOctagon size={48} className="text-muted opacity-20 mb-3" />
            <h3>No audit reviews registered</h3>
            <p className="text-muted">Document maternal deaths and near-misses for facility audit and compliance.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex-between flex-wrap gap-4 mb-3">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }} className="flex items-center gap-2">
                        <User size={16} className="text-primary" /> Patient: {rev.patient_name} {rev.patient_number !== '—' && `(${rev.patient_number})`}
                      </h3>
                      <div className="text-muted flex items-center gap-1 mt-1" style={{ fontSize: '0.85rem' }}>
                        <Calendar size={14} /> Date of Event: <strong>{formatDate(rev.date_of_death)}</strong>
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${rev.is_near_miss ? 'badge-warning' : 'badge-danger'}`}>
                        {rev.is_near_miss ? 'Maternal Near-Miss' : 'Maternal Death'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted block" style={{ fontWeight: 600 }}>Cause / Clinical Scenario</span>
                      <p style={{ margin: '4px 0 0 0' }}>{rev.cause_of_death}</p>
                    </div>
                    <div>
                      <span className="text-muted block" style={{ fontWeight: 600 }}>Three Delays Assessment</span>
                      <p style={{ margin: '4px 0 0 0' }}>{rev.three_delays || 'No delays identified.'}</p>
                    </div>
                  </div>

                  {rev.avoidable_factors && (
                    <div className="mt-3">
                      <span className="text-muted block" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avoidable Factors / Missed Opportunities</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}>{rev.avoidable_factors}</p>
                    </div>
                  )}

                  {rev.recommendations && (
                    <div className="mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span className="text-success block" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recommendations & Action Points</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}>{rev.recommendations}</p>
                    </div>
                  )}

                  <div className="flex-between mt-4 pt-3 text-muted" style={{ borderTop: '1px solid var(--border)', fontSize: '0.8rem' }}>
                    <span>Audited on: <strong>{formatDate(rev.review_date)}</strong></span>
                    <span>Audited by: <strong>Dr. {rev.reviewed_by_name || 'Staff'}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE REVIEW MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header">
              <h3>Log Maternal Death or Near-Miss Audit</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
                
                <label className="flex items-center gap-2 mb-4 cursor-pointer" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isNearMiss}
                    onChange={(e) => setIsNearMiss(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  This was a Maternal Near-Miss (Patient survived a life-threatening complication)
                </label>

                <label className="form-label mb-3">
                  Select Patient (Optional)
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                    className="form-select"
                  >
                    <option value="">Anonymous / Unlinked Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="form-label">
                    Date of Event *
                    <input
                      type="date"
                      value={dateOfEvent}
                      onChange={(e) => setDateOfEvent(e.target.value)}
                      className="form-input"
                      required
                    />
                  </label>

                  <label className="form-label">
                    Review / Audit Date *
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </label>
                </div>

                <label className="form-label mb-3">
                  Cause of Death / Near-Miss Event *
                  <textarea
                    value={cause}
                    onChange={(e) => setCause(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Severe PPH secondary to uterine atony, Eclampsia, Ruptured uterus..."
                    required
                  />
                </label>

                <label className="form-label mb-3">
                  Three Delays Model Analysis
                  <span className="text-muted block" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    Analyze: 1. Delay in seeking care (community), 2. Delay in reaching care (transport), 3. Delay in receiving care (facility)
                  </span>
                  <textarea
                    value={threeDelays}
                    onChange={(e) => setThreeDelays(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe any delays at the three levels..."
                  />
                </label>

                <label className="form-label mb-3">
                  Avoidable Factors / Missed Opportunities
                  <textarea
                    value={avoidableFactors}
                    onChange={(e) => setAvoidableFactors(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Substandard monitoring in labour ward, delay in blood transfusion..."
                  />
                </label>

                <label className="form-label mb-3">
                  Recommendations & Facility Preventive Strategy
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Proposed strategy to prevent a similar event in the future..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Save Audit Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
