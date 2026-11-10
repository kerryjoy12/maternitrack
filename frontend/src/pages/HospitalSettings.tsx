import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Hospital, Upload, Image } from 'lucide-react';
import { hospitalSettingsApi } from '../api';

export default function HospitalSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAbbr, setHospitalAbbr] = useState('');
  
  // Current URLs from backend
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null);

  // Upload file references
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loginImageFile, setLoginImageFile] = useState<File | null>(null);

  // Preview URLs
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loginImagePreview, setLoginImagePreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const loginImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await hospitalSettingsApi.get();
        setHospitalName(data.hospital_name || '');
        setHospitalAbbr(data.hospital_abbreviation || '');
        setLogoUrl(data.logo_url);
        setLoginImageUrl(data.login_image_url);
      } catch (err: any) {
        setError('Failed to fetch hospital settings.');
      } finally {
        setFetching(false);
      }
    };
    loadConfig();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLoginImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoginImageFile(file);
      setLoginImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('hospital_name', hospitalName);
    formData.append('hospital_abbreviation', hospitalAbbr);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    if (loginImageFile) {
      formData.append('login_image', loginImageFile);
    }

    try {
      const { data } = await hospitalSettingsApi.update(formData);
      setLogoUrl(data.logo_url);
      setLoginImageUrl(data.login_image_url);
      setLogoFile(null);
      setLoginImageFile(null);
      
      // Dispatch event to notify Layout sidebar to re-fetch
      window.dispatchEvent(new Event('hospital-settings-updated'));

      setSuccess('Hospital branding settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ marginLeft: 12 }}>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hospital Customization Settings</h1>
      </header>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        {error && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#DC2626',
            marginBottom: 24,
            border: '1px solid #FCA5A5',
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#16A34A',
            marginBottom: 24,
            border: '1px solid #86EFAC',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customization Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 8 }}>
              Hospital Identity & Branding
            </h2>

            {/* Hospital Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                <Hospital size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Hospital Name
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                placeholder="Enter hospital name"
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Hospital Abbreviation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Hospital Abbreviation
              </label>
              <input
                type="text"
                value={hospitalAbbr}
                onChange={e => setHospitalAbbr(e.target.value)}
                placeholder="E.g., IMNH"
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Logo Image Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Hospital Logo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {logoPreview || logoUrl ? (
                    <img src={logoPreview || logoUrl || ''} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Logo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    <Upload size={16} /> Choose Logo
                  </button>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PNG or JPG format recommended. Will display in the sidebar.
                  </p>
                </div>
              </div>
            </div>

            {/* Login Background Image Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Login Screen Image
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 140,
                  height: 80,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {loginImagePreview || loginImageUrl ? (
                    <img src={loginImagePreview || loginImageUrl || ''} alt="Login panel preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default Image</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={loginImageInputRef}
                    onChange={handleLoginImageChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => loginImageInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    <Image size={16} /> Choose Login Image
                  </button>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    High-quality landscape image recommended. Will display as the login left banner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: loading ? 'var(--text-muted)' : '#3B82F6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => !loading && (e.currentTarget.style.opacity = '1')}
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
