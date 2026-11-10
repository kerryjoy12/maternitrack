import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, FileText, Calendar, BookOpen } from 'lucide-react';
import { educationApi } from '../api';
import { formatDate } from '../utils';

export default function EducationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        if (slug) {
          const { data } = await educationApi.getResource(slug);
          setResource(data);
        }
      } catch (err) {
        console.error('Failed to fetch resource', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [slug]);

  if (loading) {
    return <div className="page-container"><div className="card" style={{ padding: 40, textAlign: 'center' }}>Loading...</div></div>;
  }

  if (!resource) {
    return (
      <div className="page-container">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h3>Module not found</h3>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/education')}>Back to Knowledge Center</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/education')}>
        <ArrowLeft size={16} /> Back to Modules
      </button>

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className="badge badge-info">{resource.category_name}</span>
              <span className="badge" style={{ background: 'var(--bg-input)' }}>{resource.audience_display}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
            <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Calendar size={14} /> Last updated: {formatDate(resource.updated_at)}
            </p>
          </div>
        </div>

        <div className="markdown-content" style={{ lineHeight: 1.6, color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: resource.content }} />

        {/* Related Protocols / Procedures for Clinicians */}
        {(resource.related_protocols?.length > 0 || resource.related_procedures?.length > 0) && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen size={18} /> Clinical Guidelines & Protocols</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {resource.related_protocols?.map((protocolId: number) => (
                <Link to="/procedures" state={{ activeProtocolId: protocolId }} key={`proto-${protocolId}`} style={{ textDecoration: 'none' }}>
                  <div className="card hover-elevate" style={{ padding: 16, border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                      <ShieldAlert size={16} /> Emergency Protocol Reference
                    </h4>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Click to view full protocol</p>
                  </div>
                </Link>
              ))}

              {resource.related_procedures?.map((procedureId: number) => (
                <Link to="/procedures" state={{ activeProcedureId: procedureId }} key={`proc-${procedureId}`} style={{ textDecoration: 'none' }}>
                  <div className="card hover-elevate" style={{ padding: 16, border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <h4 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                      <FileText size={16} /> Standard Procedure Reference
                    </h4>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Click to view clinical steps</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
