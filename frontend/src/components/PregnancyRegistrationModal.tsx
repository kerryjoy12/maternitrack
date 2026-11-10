import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Baby, CheckCircle2, ShieldAlert } from 'lucide-react';
import { pregnanciesApi } from '../api';
import { Pregnancy } from '../types';

interface PregnancyRegistrationModalProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pregnancy: Pregnancy) => void;
}

export const PregnancyRegistrationModal: React.FC<PregnancyRegistrationModalProps> = ({
  patientId,
  patientName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [gravida, setGravida] = useState<number>(1);
  const [parity, setParity] = useState<number>(0);
  const [lmp, setLmp] = useState<string>('');
  const [isMultiple, setIsMultiple] = useState<boolean>(false);
  const [numFetuses, setNumFetuses] = useState<number>(1);
  const [isHighRisk, setIsHighRisk] = useState<boolean>(false);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [riskFactors, setRiskFactors] = useState<string>('');
  const [previousObstetricHistory, setPreviousObstetricHistory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate estimated EDD and gestational weeks for preview
  const calculateEDDAndWeeks = (lmpDateStr: string) => {
    if (!lmpDateStr) return { edd: '—', weeks: '—' };
    const lmpDate = new Date(lmpDateStr);
    if (isNaN(lmpDate.getTime())) return { edd: '—', weeks: '—' };
    
    // Naegele's rule: +280 days
    const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
    const eddStr = eddDate.toISOString().split('T')[0];

    // Weeks pregnant
    const diffMs = Date.now() - lmpDate.getTime();
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

    return { edd: eddStr, weeks: `${weeks} wks` };
  };

  const preview = calculateEDDAndWeeks(lmp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmp) {
      setError('Please select Last Menstrual Period (LMP) date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await pregnanciesApi.create(patientId, {
        patient: patientId,
        gravida,
        parity,
        lmp,
        is_multiple: isMultiple,
        num_fetuses: numFetuses,
        is_high_risk: isHighRisk,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        previous_obstetric_history: previousObstetricHistory,
        notes,
      });

      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      console.error('Failed to create pregnancy:', err);
      setError(err.response?.data?.detail || err.response?.data?.lmp?.[0] || 'Failed to register pregnancy episode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 bottom-sheet-modal">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Baby className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Register New Pregnancy Episode</h2>
              <p className="text-xs text-emerald-100">Patient: <span className="font-semibold text-white">{patientName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* EDD Calculation Live Banner */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">WHO Automated Calculation</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">Estimated Delivery Date (EDD): <strong className="text-emerald-600 dark:text-emerald-400">{preview.edd}</strong></p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-full">
              {preview.weeks}
            </div>
          </div>

          {/* Obstetric History Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LMP (Last Menstrual Period) *
              </label>
              <input
                type="date"
                value={lmp}
                onChange={(e) => setLmp(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gravida (Total Pregnancies)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={gravida}
                onChange={(e) => setGravida(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parity (Births &ge; 28 wks)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={parity}
                onChange={(e) => setParity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Multiple Gestation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isMultiple}
                  onChange={(e) => {
                    setIsMultiple(e.target.checked);
                    if (!e.target.checked) setNumFetuses(1);
                    else setNumFetuses(2);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <span>Multiple Gestation (Twins / Triplets)</span>
              </label>

              {isMultiple && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Fetuses:</span>
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={numFetuses}
                    onChange={(e) => setNumFetuses(parseInt(e.target.value) || 2)}
                    className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risk Classification */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Risk Assessment</h3>
              </div>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isHighRisk}
                  onChange={(e) => {
                    setIsHighRisk(e.target.checked);
                    if (e.target.checked && riskLevel === 'LOW') setRiskLevel('HIGH');
                  }}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
                />
                <span className="text-rose-600 dark:text-rose-400">Flag as High Risk Pregnancy</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Risk Category
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => {
                    const val = e.target.value as 'LOW' | 'MEDIUM' | 'HIGH';
                    setRiskLevel(val);
                    if (val === 'HIGH') setIsHighRisk(true);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Risk Factors (if any)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Previous C-section, Advanced Maternal Age, Chronic HTN"
                  value={riskFactors}
                  onChange={(e) => setRiskFactors(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Previous Obstetric History & Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Previous Obstetric History
              </label>
              <textarea
                rows={2}
                placeholder="Details of previous pregnancies, complications, delivery modes..."
                value={previousObstetricHistory}
                onChange={(e) => setPreviousObstetricHistory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Notes / Comments
              </label>
              <textarea
                rows={2}
                placeholder="Additional instructions or initial observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Pregnancy Episode</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
