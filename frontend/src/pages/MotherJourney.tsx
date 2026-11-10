import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  FileText, 
  Heart, 
  Baby, 
  Stethoscope,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  TestTube,
  Pill,
  Info
} from 'lucide-react';
import { motherApi } from '../api';
import { formatDate } from '../utils';

interface ANCVisit {
  id: number;
  visit_number: number;
  visit_date: string;
  weight_kg: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_rate: number | null;
  temperature_c: number | null;
  fundal_height_cm: number | null;
  fetal_heart_rate: number | null;
  fetal_presentation: string;
  fetal_presentation_display: string;
  blood_group_confirmed: string;
  blood_group_confirmed_display: string;
  hemoglobin_gdl: number | null;
  anemia_severity: string;
  anemia_severity_display: string;
  blood_sugar_mgdl: number | null;
  blood_sugar_type: string;
  blood_sugar_type_display: string;
  urine_protein: string;
  urine_glucose: string;
  urine_ketones: string;
  hiv_status: string;
  hiv_status_display: string;
  syphilis_status: string;
  syphilis_status_display: string;
  hepatitis_b_surface_ag: string;
  hepatitis_b_surface_ag_display: string;
  rubella_igg: string;
  rubella_igg_display: string;
  ultrasound_results: string;
  complications_noted: string;
  medication_prescribed: string;
  supplements_given: string;
  health_education_given: string;
  general_notes: string;
  remarks: string;
  next_appointment_date: string;
  attending_staff_name: string;
  created_at: string;
  lab_results_summary: string;
}

export default function MotherJourney() {
  const [visits, setVisits] = useState<ANCVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const res = await motherApi.listAncVisits();
      setVisits(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load ANC visit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleDownloadPDF = async (visitId: number, visitNumber: number) => {
    try {
      setDownloading(visitId);
      const response = await motherApi.getAncVisitPDF(visitId);
      const contentType = String(response.headers?.['content-type'] || '');
      const isHtml = contentType.includes('text/html');
      const blob = new Blob([response.data], { type: isHtml ? 'text/html' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (isHtml) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ANC_Visit_${visitNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const toggleVisit = (visitId: number) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId);
  };

  const getLabResultStatus = (value: string, normalValues: string[]) => {
    if (normalValues.includes(value)) return 'normal';
    return 'abnormal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !visits.length) {
    return (
      <div className="p-6 text-center">
        <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
          <div className="relative z-10 p-8 max-w-2xl mx-auto">
            <div className="card p-12 text-center border-dashed">
              <ClipboardList className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No ANC Visits Recorded Yet</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Your antenatal care visit records will appear here once your healthcare provider completes an ANC consultation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-teal-500/10 dark:from-primary/20 dark:to-teal-500/20 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
              <Heart className="text-primary fill-primary/20 animate-pulse" size={32} />
              My ANC Journey
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
              Track your antenatal care visits, lab results, and pregnancy progress
            </p>
          </div>
        </div>

        {/* Visit Cards */}
        <div className="space-y-6">
          {visits.map((visit, index) => (
            <div key={visit.id} className="card p-0 overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#1A1F4A]">
              
              {/* Card Header - Always Visible */}
              <div 
                className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                onClick={() => toggleVisit(visit.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20">
                      <Baby className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          ANC Visit {visit.visit_number}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-emerald-600 dark:text-emerald-400">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(visit.visit_date)}
                        </span>
                        {visit.attending_staff_name && (
                          <span className="flex items-center gap-1">
                            <Stethoscope size={14} />
                            {visit.attending_staff_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(visit.id, visit.visit_number);
                      }}
                      disabled={downloading === visit.id}
                      className="p-2 rounded-xl transition-all flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                      title="Download PDF Report"
                    >
                      {downloading === visit.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Download size={16} />
                          <span className="hidden sm:inline text-sm font-semibold">PDF</span>
                        </>
                      )}
                    </button>
                    {expandedVisit === visit.id ? (
                      <ChevronUp className="text-slate-400 dark:text-slate-600" size={20} />
                    ) : (
                      <ChevronDown className="text-slate-400 dark:text-slate-600" size={20} />
                    )}
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visit.hemoglobin_gdl && (
                    <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Hemoglobin</p>
                      <p className="text-slate-800 dark:text-white font-bold">{visit.hemoglobin_gdl} g/dL</p>
                    </div>
                  )}
                  {visit.bp_systolic && visit.bp_diastolic && (
                    <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Blood Pressure</p>
                      <p className="text-slate-800 dark:text-white font-bold">{visit.bp_systolic}/{visit.bp_diastolic}</p>
                    </div>
                  )}
                  {visit.blood_sugar_mgdl && (
                    <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Blood Sugar</p>
                      <p className="text-slate-800 dark:text-white font-bold">{visit.blood_sugar_mgdl} mg/dL</p>
                    </div>
                  )}
                  {visit.weight_kg && (
                    <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Weight</p>
                      <p className="text-slate-800 dark:text-white font-bold">{visit.weight_kg} kg</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedVisit === visit.id && (
                <div className="border-t border-slate-200 dark:border-slate-700/50 p-6 bg-slate-50/50 dark:bg-[#1A1F4A]/50">
                  {/* Lab Results Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <TestTube className="text-primary" size={20} />
                      Laboratory Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Blood Group */}
                      {visit.blood_group_confirmed && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Blood Group</p>
                          <p className="text-slate-800 dark:text-white font-bold text-lg">{visit.blood_group_confirmed_display}</p>
                        </div>
                      )}
                      
                      {/* Hemoglobin */}
                      {visit.hemoglobin_gdl !== null && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Hemoglobin (Anemia Check)</p>
                          <p className="text-slate-800 dark:text-white font-bold text-lg mb-2">{visit.hemoglobin_gdl} g/dL</p>
                          {visit.anemia_severity_display && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              visit.anemia_severity === 'NORMAL' 
                                ? 'bg-green-500/10 border border-green-500/20 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              {visit.anemia_severity_display}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Blood Sugar */}
                      {visit.blood_sugar_mgdl !== null && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Blood Sugar</p>
                          <p className="text-slate-800 dark:text-white font-bold text-lg">{visit.blood_sugar_mgdl} mg/dL</p>
                          {visit.blood_sugar_type_display && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">({visit.blood_sugar_type_display})</span>
                          )}
                        </div>
                      )}
                      
                      {/* Urine Tests */}
                      {(visit.urine_protein !== 'NIL' || visit.urine_glucose !== 'NIL' || visit.urine_ketones !== 'NIL') && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Urine Analysis</p>
                          <div className="space-y-1">
                            {visit.urine_protein !== 'NIL' && (
                              <p className="text-slate-700 dark:text-slate-200 text-sm">Protein: <span className="text-amber-600 dark:text-amber-400 font-bold">{visit.urine_protein}</span></p>
                            )}
                            {visit.urine_glucose !== 'NIL' && (
                              <p className="text-slate-700 dark:text-slate-200 text-sm">Glucose: <span className="text-amber-600 dark:text-amber-400 font-bold">{visit.urine_glucose}</span></p>
                            )}
                            {visit.urine_ketones !== 'NIL' && (
                              <p className="text-slate-700 dark:text-slate-200 text-sm">Ketones: <span className="text-amber-600 dark:text-amber-400 font-bold">{visit.urine_ketones}</span></p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* HIV Status */}
                      {visit.hiv_status && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">HIV Screening</p>
                          <p className={`font-bold text-lg ${
                            visit.hiv_status === 'NEGATIVE' ? 'text-emerald-600 dark:text-emerald-400' : 
                            visit.hiv_status === 'POSITIVE' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {visit.hiv_status_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Syphilis Status */}
                      {visit.syphilis_status && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Syphilis Screening</p>
                          <p className={`font-bold text-lg ${
                            visit.syphilis_status === 'NON-REACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 
                            visit.syphilis_status === 'REACTIVE' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {visit.syphilis_status_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Hepatitis B */}
                      {visit.hepatitis_b_surface_ag && visit.hepatitis_b_surface_ag !== 'NOT_TESTED' && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Hepatitis B</p>
                          <p className={`font-bold text-lg ${
                            visit.hepatitis_b_surface_ag === 'NEGATIVE' ? 'text-emerald-600 dark:text-emerald-400' : 
                            visit.hepatitis_b_surface_ag === 'POSITIVE' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {visit.hepatitis_b_surface_ag_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Rubella */}
                      {visit.rubella_igg && visit.rubella_igg !== 'NOT_TESTED' && (
                        <div className="rounded-2xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Rubella Immunity</p>
                          <p className={`font-bold text-lg ${
                            visit.rubella_igg === 'IMMUNE' ? 'text-emerald-600 dark:text-emerald-400' : 
                            visit.rubella_igg === 'NON-IMMUNE' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-850 dark:text-slate-100'
                          }`}>
                            {visit.rubella_igg_display}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
 
                  {/* Vitals Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Heart className="text-primary" size={20} />
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {visit.weight_kg && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Weight</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.weight_kg} kg</p>
                        </div>
                      )}
                      {visit.bp_systolic && visit.bp_diastolic && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Blood Pressure</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.bp_systolic}/{visit.bp_diastolic} mmHg</p>
                        </div>
                      )}
                      {visit.pulse_rate && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Pulse</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.pulse_rate} bpm</p>
                        </div>
                      )}
                      {visit.temperature_c && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Temperature</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.temperature_c} °C</p>
                        </div>
                      )}
                    </div>
                  </div>
 
                  {/* Pregnancy Assessment */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Baby className="text-primary" size={20} />
                      Pregnancy Assessment
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {visit.fundal_height_cm && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Fundal Height</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.fundal_height_cm} cm</p>
                        </div>
                      )}
                      {visit.fetal_heart_rate && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Fetal Heart Rate</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.fetal_heart_rate} bpm</p>
                        </div>
                      )}
                      {visit.fetal_presentation && (
                        <div className="rounded-xl p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Fetal Presentation</p>
                          <p className="text-slate-800 dark:text-white font-bold">{visit.fetal_presentation_display}</p>
                        </div>
                      )}
                    </div>
                    {visit.ultrasound_results && (
                      <div className="mt-4 rounded-xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Ultrasound Results</p>
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.ultrasound_results}</p>
                      </div>
                    )}
                  </div>
 
                  {/* Clinical Management */}
                  {(visit.medication_prescribed || visit.supplements_given || visit.health_education_given || visit.complications_noted) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Pill className="text-primary" size={20} />
                        Clinical Management
                      </h4>
                      <div className="space-y-3">
                        {visit.medication_prescribed && (
                          <div className="rounded-xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Medications</p>
                            <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.medication_prescribed}</p>
                          </div>
                        )}
                        {visit.supplements_given && (
                          <div className="rounded-xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Supplements</p>
                            <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.supplements_given}</p>
                          </div>
                        )}
                        {visit.health_education_given && (
                          <div className="rounded-xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Health Education</p>
                            <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.health_education_given}</p>
                          </div>
                        )}
                        {visit.complications_noted && (
                          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
                              <div>
                                <p className="text-red-600 dark:text-red-400 text-xs uppercase tracking-wider mb-1 font-bold">Complications Noted</p>
                                <p className="text-red-800 dark:text-red-200 text-sm">{visit.complications_noted}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
 
                  {/* Notes */}
                  {(visit.general_notes || visit.remarks) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="text-slate-500" size={20} />
                        Notes
                      </h4>
                      {visit.general_notes && (
                        <div className="rounded-xl p-4 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.general_notes}</p>
                        </div>
                      )}
                      {visit.remarks && (
                        <div className="rounded-xl p-4 mt-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Remarks</p>
                          <p className="text-slate-700 dark:text-slate-200 text-sm">{visit.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
 
                  {/* Next Appointment */}
                  {visit.next_appointment_date && (
                    <div className="rounded-2xl p-4 flex items-center gap-4 bg-green-500/10 border border-green-500/20">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20">
                        <Clock className="text-green-600 dark:text-green-400" size={20} />
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Next Appointment</p>
                        <p className="text-slate-800 dark:text-white font-bold">{formatDate(visit.next_appointment_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
 
        {/* Info Footer */}
        <div className="mt-8 rounded-2xl p-4 flex items-start gap-3 bg-blue-500/10 border border-blue-500/20">
          <Info className="text-primary flex-shrink-0 mt-0.5" size={18} />
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            These records contain your antenatal care visit information including lab results, vital signs, and clinical assessments. 
            Download the PDF report to keep a copy for your records or to share with other healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
}