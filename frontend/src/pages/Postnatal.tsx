import { useEffect, useState } from 'react';
import { 
  Baby, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Stethoscope,
  Activity,
  CalendarCheck,
  CalendarClock,
  Check,
  FileDown
} from 'lucide-react';
import { postnatalApi, patientsApi } from '../api';
import { PostnatalRecord, Patient } from '../types';
import { formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';
import DeliveryForm from '../components/DeliveryForm';
import HighRiskBadge from '../components/HighRiskBadge';

export default function Postnatal() {
  const { isAdmin, isDoctor } = useAuth();
  const canEdit = isAdmin || isDoctor;
  const [records, setRecords] = useState<PostnatalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PostnatalRecord | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([postnatalApi.list(), patientsApi.list()]);
      setRecords(rRes.data.results ?? rRes.data);
      setPatients(pRes.data.results ?? pRes.data);
    } catch (err) {
      console.error('Postnatal load error:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const mark7Day  = async (id: number) => { await postnatalApi.mark7Day(id);  flash('7-day review marked');  load(); };
  const mark6Week = async (id: number) => { await postnatalApi.mark6Week(id); flash('6-week review marked'); load(); };

  const handleSaved = () => { setShowModal(false); flash('Delivery record saved'); load(); };

  const exportRecordCSV = (r: PostnatalRecord) => {
    let csv = `Postnatal Record\n\n`;
    csv += `Patient Name,${r.patient_name}\n`;
    csv += `Patient No.,${r.patient_number}\n`;
    csv += `Delivery Date,${r.delivery_date}\n`;
    csv += `Delivery Type,${r.delivery_type}\n`;
    csv += `Mother Condition,${r.mother_condition}\n`;
    csv += `Baby Name,${r.baby_first_name} ${r.baby_last_name}\n`;
    csv += `Baby Gender,${r.baby_gender}\n`;
    csv += `Baby Weight (kg),${r.baby_weight_kg || 'N/A'}\n`;
    csv += `Baby Condition,${r.baby_condition}\n`;
    csv += `\nImmunizations Given at Birth\n`;
    csv += `BCG,${r.bcg_given ? 'Yes' : 'No'}\n`;
    csv += `OPV 0,${r.opv0_given ? 'Yes' : 'No'}\n`;
    csv += `Hep B,${r.hep_b_given ? 'Yes' : 'No'}\n`;
    csv += `\nFollow-Up Reviews\n`;
    csv += `7-Day Review,${r.review_7day_date || 'N/A'},${r.review_7day_attended ? 'Attended' : 'Pending'}\n`;
    csv += `6-Week Review,${r.review_6week_date || 'N/A'},${r.review_6week_attended ? 'Attended' : 'Pending'}\n`;
    csv += `\nNotes\n"${r.notes}"\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Delivery_Record_${r.patient_number}_${r.delivery_date}.csv`;
    a.click();
  };

  const exportRecordPDF = async (r: PostnatalRecord) => {
    const el = document.getElementById(`record-${r.id}`);
    if (!el) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Title
      pdf.setFontSize(16);
      pdf.text(`Delivery Record: ${r.patient_name}`, 10, 15);
      
      pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight * ((pdfWidth - 20) / pdfWidth));
      pdf.save(`Delivery_Record_${r.patient_number}_${r.delivery_date}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };




  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2">
          <Baby className="text-primary" /> Postnatal Follow-Up
        </h1>
        <div className="header-actions">
          <button id="add-postnatal-btn" className="btn btn-primary flex items-center gap-2" onClick={() => { setSelectedRecord(null); setShowModal(true); }}>
            <Plus size={18} /> Add Record
          </button>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && <div className="alert alert-success flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>}

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : records.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon"><Baby size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No postnatal records yet</div>
            <div className="empty-desc">Add a postnatal record after a patient delivers.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {records.map(r => (
              <div id={`record-${r.id}`} key={r.id} className="card" style={{ borderLeft: `4px solid ${r.review_7day_overdue || r.review_6week_overdue ? 'var(--danger)' : 'var(--success)'}` }}>
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-bold text-lg">{r.patient_name}</span>
                      {(r as any).pregnancy_number > 1 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                          Pregnancy #{(r as any).pregnancy_number}
                        </span>
                      )}
                    </div>
                    <div className="text-muted text-sm flex items-center gap-2">
                       <Stethoscope size={14} /> {r.patient_number} · <Calendar size={14} /> Delivered {formatDate(r.delivery_date)} ({r.delivery_type})
                    </div>
                    {r.baby_weight_kg && <div className="text-muted text-sm flex items-center gap-2">
                      <Baby size={14} /> Baby: {r.baby_first_name} {r.baby_last_name} · {r.baby_weight_kg}kg · Sex: {r.baby_gender}
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.review_7day_overdue  && <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> 7-Day Overdue!</span>}
                    {r.review_6week_overdue && <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> 6-Week Overdue!</span>}
                    
                    <div className="flex gap-2 border-l border-slate-200 pl-4 ml-2">
                      {canEdit && (
                        <button 
                          className="btn btn-ghost btn-sm flex items-center gap-1 text-primary" 
                          onClick={() => { setSelectedRecord(r); setShowModal(true); }}
                          title="Edit Record"
                        >
                          Edit
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm flex items-center gap-1 text-slate-500" onClick={() => exportRecordCSV(r)} title="Export CSV">
                        <FileDown size={14} /> CSV
                      </button>
                      <button className="btn btn-ghost btn-sm flex items-center gap-1 text-slate-500" onClick={() => exportRecordPDF(r)} title="Export PDF">
                        <FileDown size={14} /> PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 7-Day Review */}
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <CalendarClock size={16} className="text-primary" /> 7-Day Review — {formatDate(r.review_7day_date)}
                    </div>
                      {r.review_7day_attended
                        ? <span className="badge badge-success flex items-center gap-1 w-fit"><Check size={12} /> Attended</span>
                        : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className={`badge badge-${r.review_7day_overdue ? 'danger' : 'warning'}`}>Pending</span>
                            <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => mark7Day(r.id)}>
                              <Check size={14} /> Mark Attended
                            </button>
                          </div>
                    }
                  </div>
                  {/* 6-Week Review */}
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <CalendarCheck size={16} className="text-primary" /> 6-Week Review — {formatDate(r.review_6week_date)}
                    </div>
                    {r.review_6week_attended
                      ? <span className="badge badge-success flex items-center gap-1 w-fit"><Check size={12} /> Attended</span>
                      : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className={`badge badge-${r.review_6week_overdue ? 'danger' : 'warning'}`}>Pending</span>
                          <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => mark6Week(r.id)}>
                            <Check size={14} /> Mark Attended
                          </button>
                        </div>
                    }
                  </div>
                </div>

                {/* Immunizations */}
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {([['BCG', r.bcg_given], ['OPV-0', r.opv0_given], ['Hep B', r.hep_b_given]] as const).map(
                    ([label, checked]) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: checked ? 'var(--success)' : 'var(--text-muted)' }}>
                        {checked ? <Check size={14} /> : <div style={{ width: 14, height: 14, border: '1px solid currentColor', borderRadius: 2 }} />} {label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DeliveryForm
          patients={patients}
          initialData={selectedRecord}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
