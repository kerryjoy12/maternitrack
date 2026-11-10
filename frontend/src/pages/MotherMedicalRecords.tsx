import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Stethoscope, 
  Info,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherMedicalRecordsData } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

export default function MotherMedicalRecords() {
  const [data, setData] = useState<MotherMedicalRecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await motherApi.medicalRecords();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error || 'No data available.'}</p>
      </div>
    );
  }

  const { demographics_and_history, clinical_notes, uploaded_documents } = data;

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden p-6 md:p-8">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.records})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.65) saturate(1.1)',
                opacity: 0.15
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2">Medical Records</h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Your complete health profile and clinical documentation</p>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                <ShieldCheck size={16} />
                Secure
              </div>
            </div>
          </div>
        </div>

        {/* Demographics Summary */}
        <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="text-primary" size={24} />
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Full Name</p>
              <p className="text-slate-800 dark:text-white font-bold">{demographics_and_history.full_name}</p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Patient Number</p>
              <p className="text-slate-800 dark:text-white font-bold">{demographics_and_history.patient_number}</p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Blood Group</p>
              <p className="text-slate-800 dark:text-white font-bold">{demographics_and_history.blood_group}</p>
            </div>
            <div className="rounded-2xl p-4 lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Next of Kin</p>
              <p className="text-slate-800 dark:text-white font-bold">
                {demographics_and_history.next_of_kin_name} • {demographics_and_history.next_of_kin_phone}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">LMP Date</p>
              <p className="text-slate-800 dark:text-white font-bold">{formatDate(demographics_and_history.lmp)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clinical Notes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Stethoscope className="text-primary" size={24} />
              Clinical Notes & Consultations
            </h2>
            {clinical_notes && clinical_notes.length > 0 ? (
              clinical_notes.map((note) => (
                <div key={note.id} className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">
                      {note.category}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-bold">
                      <Calendar size={14} />
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{note.title}</h3>
                  <p className="text-slate-605 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <Stethoscope className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-400">No clinical notes recorded yet</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8 h-fit">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              Documents
            </h2>
            {uploaded_documents && uploaded_documents.length > 0 ? (
              <div className="space-y-3">
                {uploaded_documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-white truncate flex items-center gap-1.5" title={doc.title}>
                        <FileText size={14} className="text-slate-400 dark:text-slate-500" />
                        {doc.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">
                        {doc.document_type}
                      </div>
                    </div>
                    <a 
                      href={doc.file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 rounded-lg transition-all ml-2 flex-shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <FileText className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={28} />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
