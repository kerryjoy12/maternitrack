import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Apple, 
  RefreshCw, 
  User, 
  Activity, 
  HeartPulse, 
  FileText, 
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { nutritionApi, patientsApi } from '../api';
import { formatDate } from '../utils';

export default function Nutrition() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, profRes, recRes] = await Promise.all([
        patientsApi.get(Number(id)),
        nutritionApi.getProfile(Number(id)),
        nutritionApi.getRecommendations(Number(id)),
      ]);
      setPatient(pRes.data);
      setProfile(profRes.data);
      setRecommendations(recRes.data);
    } catch (err: any) {
      setError('Failed to load nutrition data. Please check your connection and refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await nutritionApi.generateRecommendations(Number(id));
      flash('Diet recommendations generated successfully ✓');
      load();
    } catch (err: any) {
      setError('Failed to generate recommendations. Please try again or contact support if the issue persists.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="page-body"><div className="loading-wrap"><div className="spinner" /></div></div>;
  }

  if (!patient || !profile) {
    return <div className="page-body"><div className="alert alert-danger">Failed to load nutrition profile.</div></div>;
  }

  const groupedRecs = recommendations.reduce((acc, rec) => {
    const day = rec.diet_plan_detail.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(rec);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <Apple className="text-primary" /> Nutrition Profile: {patient.full_name}
          </h1>
          <div className="text-muted text-sm mt-1">
            <Link to={`/patients/${patient.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <ChevronRight size={14} className="rotate-180" /> Back to Patient Dashboard
            </Link>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary flex items-center gap-2" onClick={handleGenerate} disabled={generating}>
            {generating ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {generating ? 'Generating…' : 'Update Recommendations'}
          </button>
        </div>
      </header>

      <div className="page-body">
        {error && <div className="alert alert-danger flex items-center gap-2 mb-4">
          <AlertTriangle size={16} /> {error}
        </div>}
        {success && <div className="alert alert-success flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>}

        <div className="form-grid-2" style={{ marginBottom: 24 }}>
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="section-title flex items-center gap-2">
              <Activity size={20} className="text-primary" /> Clinical Profile
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div className="text-muted text-sm">Phase</div>
                <div style={{ fontWeight: 600 }}>{profile.phase_display}</div>
              </div>
              <div>
                <div className="text-muted text-sm">Calorie Target</div>
                <div style={{ fontWeight: 600 }}>{profile.calorie_target} kcal/day</div>
              </div>
              <div>
                <div className="text-muted text-sm">Current Weight</div>
                <div style={{ fontWeight: 600 }}>{profile.current_weight_kg ? `${profile.current_weight_kg} kg` : 'Not recorded'}</div>
              </div>
              <div>
                <div className="text-muted text-sm">BMI</div>
                <div style={{ fontWeight: 600 }}>{profile.bmi || 'Not recorded'}</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="text-muted text-sm mb-2">Detected Conditions</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {profile.is_anaemic && <span className="badge badge-danger">Anaemia</span>}
                {profile.is_hypertensive && <span className="badge badge-warning">Hypertension</span>}
                {profile.is_diabetic && <span className="badge badge-warning">Diabetes</span>}
                {profile.is_post_caesarean && <span className="badge badge-primary">Post-Caesarean</span>}
                {profile.is_lactating && <span className="badge badge-success">Lactating</span>}
                {!profile.is_anaemic && !profile.is_hypertensive && !profile.is_diabetic && !profile.is_post_caesarean && !profile.is_lactating && (
                  <span className="text-muted text-sm">No special conditions detected.</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="section-title flex items-center gap-2">
              <Sparkles size={20} className="text-primary" /> Dietary Preferences & Allergies
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <AlertCircle size={14} className="text-danger" /> Allergies
              </label>
              <textarea className="form-textarea" readOnly value={profile.allergies || 'None recorded'} rows={2} style={{ background: 'var(--bg-card)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferences</label>
              <textarea className="form-textarea" readOnly value={profile.dietary_preferences || 'None recorded'} rows={2} style={{ background: 'var(--bg-card)' }} />
            </div>
          </div>
        </div>

        <div className="section-title flex items-center gap-2 mb-4">
          <FileText size={20} className="text-primary" /> Recommended Weekly Meal Plan
        </div>
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Apple size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No Recommendations</div>
            <div className="empty-desc">Click "Update Recommendations" to generate a personalized meal plan based on the patient's clinical profile.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.keys(groupedRecs).sort().map(dayStr => {
              const day = parseInt(dayStr);
              const recs = groupedRecs[day];
              return (
                <div key={day} className="card">
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    Day {day}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {recs.map((rec: any) => (
                      <div key={rec.id} style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{rec.diet_plan_detail.meal_type_display}</span>
                          <span className="text-muted text-sm">~{rec.diet_plan_detail.calories_approx} kcal</span>
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{rec.diet_plan_detail.title}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                          {rec.diet_plan_detail.description}
                        </p>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)' }}>
                          Foods: {rec.diet_plan_detail.foods}
                        </div>
                        {rec.diet_plan_detail.local_alternatives && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--hosp-green)', marginTop: 4 }}>
                            Alternative: {rec.diet_plan_detail.local_alternatives}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
