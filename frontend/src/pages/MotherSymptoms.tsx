import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  AlertTriangle, 
  CheckCircle, 
  History, 
  AlertCircle,
  PlusCircle,
  Activity,
  Heart,
  Droplets,
  Brain,
  Eye,
  Zap,
  Waves,
  Thermometer,
  Baby,
  Send,
  Loader2,
  Circle
} from 'lucide-react';
import { motherApi } from '../api';
import { SymptomReport } from '../types';
import { extractListData, formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

const SYMPTOM_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'bleeding', label: 'Vaginal bleeding / spotting', icon: Droplets },
  { id: 'headache', label: 'Severe headache', icon: Brain },
  { id: 'vision_changes', label: 'Vision changes', icon: Eye },
  { id: 'abdominal_pain', label: 'Severe abdominal pain', icon: Zap },
  { id: 'swelling', label: 'Sudden swelling', icon: Waves },
  { id: 'fever', label: 'High fever or chills', icon: Thermometer },
  { id: 'reduced_movement', label: 'Reduced fetal movement', icon: Baby },
];

export default function MotherSymptoms() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await motherApi.listSymptoms();
      setReports(extractListData<SymptomReport>(res.data));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load symptom reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSymptomToggle = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !description.trim()) {
      setError('Please select at least one symptom or describe your symptoms.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        symptoms: selectedSymptoms.join(', '),
        description,
        severity
      };
      await motherApi.reportSymptoms(payload);
      setSubmitSuccess('Symptom report submitted successfully.');
      setTimeout(() => {
        setSelectedSymptoms([]);
        setDescription('');
        setSeverity('LOW');
        setSubmitSuccess('');
        loadReports();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const apiError = err.response?.data;
      const message = typeof apiError === 'string'
        ? apiError
        : apiError?.detail
        || (Array.isArray(apiError?.non_field_errors) ? apiError.non_field_errors[0] : null)
        || (typeof apiError === 'object' ? Object.values(apiError).flat()[0] : null);
      setError(message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Hero Section with Alert Status */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-pink-500/10 dark:from-primary/20 dark:to-pink-500/20">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.symptoms})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.65) saturate(1.1)',
                opacity: 0.15
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2">Health Monitoring</h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Report any symptoms for immediate care</p>
                </div>
                <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Monitoring Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Symptoms Reporting Form (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-primary" size={20} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Overall Status</p>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">Good</p>
              </div>

              <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-primary" size={20} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Reports</p>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{reports.length}</p>
              </div>

              <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-primary" size={20} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Reviewed</p>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{reports.filter(r => r.status === 'REVIEWED').length}</p>
              </div>
            </div>

            {/* Main Form Card */}
            <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8">
              
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <PlusCircle className="text-primary" size={24} />
                Report Symptoms
              </h2>

              {submitSuccess && (
                <div className="p-4 mb-6 rounded-2xl border flex items-center gap-3 bg-green-500/10 border-green-500/20">
                  <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">{submitSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Symptom Selection Grid */}
                <div className="flex flex-col gap-3">
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">Select Symptoms You're Experiencing</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SYMPTOM_OPTIONS.map(opt => {
                      const checked = selectedSymptoms.includes(opt.id);
                      const SymptomIcon = opt.icon;
                      return (
                        <button
                          key={opt.id} 
                          type="button"
                          onClick={() => handleSymptomToggle(opt.id)}
                          className={`relative p-4 rounded-2xl text-left transition-all group border ${
                            checked
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <SymptomIcon size={20} className={checked ? 'text-primary' : 'text-slate-400 dark:text-slate-500'} />
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${checked ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {opt.label}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              checked 
                                ? 'border-primary bg-primary text-white' 
                                : 'border-slate-350 dark:border-slate-600 group-hover:border-slate-400'
                            }`}>
                              {checked && <CheckCircle size={16} className="text-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity Selection */}
                <div className="flex flex-col gap-3">
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">How Severe Is This?</label>
                  <div className="flex gap-3">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-3 text-sm font-bold rounded-2xl border transition-all ${
                          severity === sev
                            ? sev === 'HIGH'
                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm'
                              : sev === 'MEDIUM'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                              : 'bg-green-500/10 border-green-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Circle size={10} fill="currentColor" />
                          {sev === 'LOW' ? 'Low' : sev === 'MEDIUM' ? 'Medium' : 'High'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Details */}
                <div className="flex flex-col gap-3">
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">Additional Details</label>
                  <textarea 
                    placeholder="Describe when symptoms started, how long they've been occurring, and any other relevant details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-28 resize-none transition-all"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/20">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-400 text-sm font-semibold">{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base bg-primary hover:bg-primary/95 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting Report...' : 'Report Symptoms Now'}
                  </span>
                </button>

              </form>
            </div>
          </div>

          {/* RIGHT: Recent Reports Sidebar */}
          <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8 h-fit">
            
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <History className="text-primary" size={24} />
              Recent Reports
            </h2>

            {reports && reports.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {reports.slice(0, 10).map((report) => (
                  <div key={report.id} 
                    className={`rounded-2xl p-4 transition-all hover:shadow-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700/50 border-l-4 ${
                      report.severity === 'HIGH'
                        ? 'border-l-red-500'
                        : report.severity === 'MEDIUM'
                        ? 'border-l-amber-500'
                        : 'border-l-emerald-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          report.severity === 'HIGH' 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                            : report.severity === 'MEDIUM'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-green-500/10 border border-green-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-bold">{formatDate(report.reported_at)}</span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-white font-semibold mb-2 line-clamp-2">
                      {report.symptoms || 'Custom report'}
                    </p>

                    {report.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3 line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/55 text-[10px] font-semibold">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        report.status === 'PENDING' 
                          ? 'bg-amber-500 animate-pulse' 
                          : 'bg-emerald-500'
                      }`} />
                      <span className={report.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <AlertCircle className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={32} />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No reports submitted yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
