import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Stethoscope, Baby, HeartPulse, Search, ShieldCheck, Hospital, AlertOctagon, Users, Activity } from 'lucide-react';
import { educationApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Education() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'emonc': return <Hospital size={18} />;
      case 'pph': return <AlertOctagon size={18} />;
      case 'family-planning': return <Users size={18} />;
      case 'general-maternity': return <Baby size={18} />;
      default: return <BookOpen size={18} />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, resRes] = await Promise.all([
          educationApi.listCategories(),
          educationApi.listResources({
            search,
            category__slug: activeCategory,
          })
        ]);
        setCategories(catsRes.data.results || catsRes.data);
        setResources(resRes.data.results || resRes.data);
      } catch (err) {
        console.error('Failed to load education data', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Add debounce for search
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory, user?.role]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Center</h1>
          <p className="text-muted">Educational modules, EmONC protocols, and clinical guidelines.</p>
        </div>
      </header>

      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <Search size={18} className="text-muted" style={{ marginRight: 8 }} />
          <input 
            type="text" 
            placeholder="Search modules..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sidebar Categories */}
        <div className="card" style={{ flex: '1 1 250px', padding: 16 }}>
          <h3 className="font-bold mb-4">Categories</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <button 
                onClick={() => setActiveCategory('')}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', 
                  borderRadius: 6, border: 'none', 
                  background: activeCategory === '' ? 'var(--bg-active, #eff6ff)' : 'transparent',
                  color: activeCategory === '' ? '#2563eb' : 'var(--text-primary)',
                  fontWeight: activeCategory === '' ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                All Modules
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat.id}>
                <button 
                  onClick={() => setActiveCategory(cat.slug)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px', 
                    borderRadius: 6, border: 'none', 
                    background: activeCategory === cat.slug ? 'var(--bg-active, #eff6ff)' : 'transparent',
                    color: activeCategory === cat.slug ? '#2563eb' : 'var(--text-primary)',
                    fontWeight: activeCategory === cat.slug ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getCategoryIcon(cat.slug)} {cat.name}
                  </span>
                  {/* <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.resource_count}</span> */}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Resource List */}
        <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No modules found. Adjust your filters or search term.
            </div>
          ) : (
            resources.map(resource => (
              <Link to={`/education/${resource.slug}`} key={resource.id} style={{ textDecoration: 'none' }}>
                <div className="card hover-elevate" style={{ padding: 20, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{resource.title}</h3>
                    <span className="badge badge-info">{resource.audience_display}</span>
                  </div>
                  <p className="text-muted" style={{ marginBottom: 16 }}>{resource.summary}</p>
                  
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FolderOpen size={14} /> {resource.category_name}
                    </span>
                    {resource.related_protocols?.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                        <ShieldCheck size={14} /> {resource.related_protocols.length} Protocol(s) linked
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal stub for lucide-react icon not imported
function FolderOpen(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
