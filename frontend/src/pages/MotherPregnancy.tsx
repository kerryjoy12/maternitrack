import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Baby, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Droplets,
  Activity,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherPregnancyTrackingData } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

// Compute the trimester at a given visit date, based on the mother's LMP.
function getTrimesterAtDate(lmpIso: string, visitDateIso: string): 'First' | 'Second' | 'Third' {
  if (!lmpIso || !visitDateIso) return 'First';
  const lmp = new Date(lmpIso).getTime();
  const visit = new Date(visitDateIso).getTime();
  const days = (visit - lmp) / (1000 * 60 * 60 * 24);
  const weeks = days / 7;
  if (weeks <= 13) return 'First';
  if (weeks <= 27) return 'Second';
  return 'Third';
}

export default function MotherPregnancy() {
  const [data, setData] = useState<MotherPregnancyTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPregnancyData = async () => {
    try {
      setLoading(true);
      const res = await motherApi.pregnancyTracking();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load pregnancy journey data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPregnancyData();
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

  const { weeks_pregnant, edd, lmp, trimester_info, milestones, anc_visits } = data;

  // Calculate days remaining
  const daysRemaining = edd ? Math.ceil((new Date(edd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercent = weeks_pregnant ? (weeks_pregnant / 40) * 100 : 0;

  // Baby size comparisons by week
  const babySizeComparisons: { [key: number]: { size: string; length: string; weight: string } } = {
    8: { size: 'Raspberry', length: '1.6 cm', weight: '1 g' },
    12: { size: 'Plum', length: '6.1 cm', weight: '14 g' },
    16: { size: 'Avocado', length: '11.6 cm', weight: '100 g' },
    20: { size: 'Banana', length: '16.4 cm', weight: '300 g' },
    24: { size: 'Corn', length: '21 cm', weight: '600 g' },
    28: { size: 'Eggplant', length: '25 cm', weight: '1 kg' },
    32: { size: 'Squash', length: '29 cm', weight: '1.7 kg' },
    36: { size: 'Romaine Lettuce', length: '33 cm', weight: '2.6 kg' },
    40: { size: 'Watermelon', length: '36 cm', weight: '3.5 kg' }
  };

  const closestWeek = Object.keys(babySizeComparisons)
    .map(Number)
    .reduce((prev, curr) => 
      Math.abs(curr - (weeks_pregnant || 0)) < Math.abs(prev - (weeks_pregnant || 0)) ? curr : prev
    );
  const babyInfo = babySizeComparisons[closestWeek] || { size: 'Growing', length: 'TBD', weight: 'TBD' };

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto">
        {/* HERO SECTION */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-slate-900">
              <div style={{
                backgroundImage: `url(${motherPortalImages.pregnancy})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.4) saturate(1.2)'
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full text-white">
              {/* Top Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Left: Week & Days Info */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-md">{weeks_pregnant || '—'}</span>
                    <span className="text-xl text-white/90 drop-shadow-md">weeks</span>
                  </div>
                  <p className="text-white/80 drop-shadow-sm text-sm">of 40-week pregnancy</p>
                </div>

                {/* Center: Trimester Badge */}
                <div className="px-6 py-3 rounded-full bg-primary/80 border border-primary/50 backdrop-blur-md">
                  <span className="font-bold text-white">{trimester_info || 'Trimester Info'}</span>
                </div>

                {/* Right: Days Remaining */}
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-extrabold text-blue-300 drop-shadow-md">{daysRemaining}</div>
                  <p className="text-white/80 drop-shadow-sm text-sm">days until EDD</p>
                </div>
              </div>

              {/* Bottom Section: Baby Size */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-widest mb-3 drop-shadow-sm">Your baby is about the size of</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white drop-shadow-md">{babyInfo.size}</h3>
                    <div className="flex gap-6 mt-2 text-sm">
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest">Length</p>
                        <p className="text-white font-semibold">{babyInfo.length}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest">Weight</p>
                        <p className="text-white font-semibold">{babyInfo.weight}</p>
                      </div>
                    </div>
                  </div>
                  <Baby className="text-blue-200" size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREGNANCY PROGRESS CARD */}
        <div className="card p-6 md:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pregnancy Progress</h2>
            <span className="text-2xl font-extrabold text-primary">{Math.round(progressPercent)}%</span>
          </div>
          
          {/* Large Progress Bar */}
          <div className="relative h-8 rounded-full overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-primary shadow-[0_0_12px_rgba(37,99,235,0.3)]"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Week {Math.floor(progressPercent / 2.5)}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Week 40</span>
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* BABY DEVELOPMENT CARD */}
          <div className="card p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Baby className="text-primary" size={24} />
              Baby Development
            </h2>
            
            {/* Placeholder Image Area */}
            <div className="relative mb-4 aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Baby className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={40} />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Baby Photo</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Length</p>
                <p className="text-slate-800 dark:text-white font-bold text-lg">{babyInfo.length}</p>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Weight</p>
                <p className="text-slate-800 dark:text-white font-bold text-lg">{babyInfo.weight}</p>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Week</p>
                <p className="text-slate-800 dark:text-white font-bold text-lg">{closestWeek}</p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 leading-relaxed">
              Your baby is developing beautifully. All systems are forming and growing stronger each day.
            </p>
          </div>

          {/* QUICK STATS CARD */}
          <div className="card p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="text-primary" size={24} />
              Key Dates
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Last Menstrual Period</p>
                <p className="text-slate-800 dark:text-white font-bold text-lg">{formatDate(lmp)}</p>
              </div>

              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Expected Delivery Date</p>
                <p className="text-primary font-bold text-lg">{formatDate(edd)}</p>
              </div>

              <div className="text-center py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-800 dark:text-blue-300 text-xs uppercase tracking-widest mb-2 font-bold">Time to Meet Baby</p>
                <p className="text-2xl font-bold text-primary">{Math.max(0, daysRemaining)} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* JOURNEY TIMELINE - VERTICAL MOBILE-FIRST */}
        <div className="card p-6 md:p-8 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            Pregnancy Journey
          </h2>

          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 md:left-1/2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-teal-400/50" />

            {/* Timeline Items */}
            <div className="space-y-6">
              {milestones.slice(0, 5).map((milestone, i) => (
                <div key={milestone.id} className="relative pl-20 md:pl-0">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 md:left-1/2 top-0 w-12 h-12 rounded-full flex items-center justify-center md:-ml-6 transition-transform ${
                    milestone.completed 
                      ? 'scale-100' 
                      : 'scale-75'
                  }`}
                    style={{
                      background: milestone.completed 
                        ? 'var(--primary)'
                        : 'var(--bg-base)',
                      border: milestone.completed 
                        ? '2px solid var(--bg-card)'
                        : '2px solid var(--border)'
                    }}>
                    {milestone.completed ? (
                      <CheckCircle2 size={24} className="text-white" />
                    ) : (
                      <Circle size={20} className="text-slate-400" />
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:ml-auto md:pr-12 text-left md:text-right' : 'md:pr-auto md:pl-12 text-left'}`}>
                    <div className={`rounded-2xl p-4 border ${
                      milestone.completed
                        ? 'bg-primary/10 border-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
                    }`}>
                      <h3 className={`font-bold mb-1 ${milestone.completed ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {milestone.name}
                      </h3>
                      {milestone.date && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(milestone.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ANC VISITS - RESPONSIVE CARDS */}
        <div className="card p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            Antenatal Care Visits
          </h2>

          {anc_visits && anc_visits.length > 0 ? (
            <div className="space-y-4">
              {anc_visits.map((visit) => (
                <div key={visit.id} className="rounded-2xl p-4 md:p-5 transition-all hover:shadow-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 cursor-pointer">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">Trimester: {getTrimesterAtDate(lmp, visit.visit_date)}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{formatDate(visit.visit_date)}</p>
                    </div>
                    <ChevronRight className="text-slate-400 dark:text-slate-600 flex-shrink-0" size={20} />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">Weight</p>
                      <p className="text-slate-800 dark:text-white font-semibold">{visit.weight_kg ? `${visit.weight_kg} kg` : '—'}</p>
                    </div>

                    <div className="rounded-lg p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">BP</p>
                      <p className="text-slate-800 dark:text-white font-semibold">
                        {visit.bp_systolic && visit.bp_diastolic ? `${visit.bp_systolic}/${visit.bp_diastolic}` : '—'}
                      </p>
                    </div>

                    <div className="rounded-lg p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">FH</p>
                      <p className="text-slate-800 dark:text-white font-semibold">{visit.fundal_height_cm ? `${visit.fundal_height_cm} cm` : '—'}</p>
                    </div>

                    <div className="rounded-lg p-3 bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-700/50">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">FHR</p>
                      <p className="text-slate-800 dark:text-white font-semibold">{visit.fetal_heart_rate ? `${visit.fetal_heart_rate} bpm` : '—'}</p>
                    </div>
                  </div>

                  {/* Remarks */}
                  {visit.remarks && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                      <p className="text-slate-600 dark:text-slate-300 text-sm italic">{visit.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={32} />
              <p className="text-slate-500 dark:text-slate-400">No antenatal care visits logged yet.</p>
            </div>
          )}
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
