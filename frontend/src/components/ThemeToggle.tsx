import { useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      title="Toggle Dark Mode"
      aria-pressed={isDark}
      className="theme-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'linear-gradient(135deg,#5B21B6,#2563EB)' : 'var(--bg-card)',
        color: isDark ? 'white' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        cursor: 'pointer',
        padding: compact ? '8px' : '6px 10px',
        fontSize: '1rem',
        transition: 'var(--transition)',
        boxShadow: isDark ? '0 6px 18px rgba(88,24,163,0.18)' : '0 1px 6px rgba(2,6,23,0.04)'
      }}
    >
      {isDark ? <MoonStar size={16} style={{ marginRight: compact ? 0 : 8 }} /> : <SunMedium size={16} style={{ marginRight: compact ? 0 : 8 }} />}
      {!compact && <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{isDark ? 'Dark' : 'Light'}</span>}
    </button>
  );
}
