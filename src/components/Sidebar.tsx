'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label_es: 'Dashboard Holding', label_en: 'Holding Dashboard' },
  { href: '/dashboard/empresas', icon: '🏢', label_es: 'Empresas', label_en: 'Companies' },
  { href: '/dashboard/datos-actividad', icon: '📊', label_es: 'Fuentes de Emisión', label_en: 'Emission Sources' },
  { href: '/dashboard/factores', icon: 'ƒ', label_es: 'Factores de Emisión', label_en: 'Emission Factors' },
  { href: '/dashboard/metas', icon: '🎯', label_es: 'Metas y Planes', label_en: 'Targets & Plans' },
  { href: '/dashboard/reportes', icon: '📄', label_es: 'Reportes', label_en: 'Reports' },
];

const NAV_BOTTOM = [
  { href: '/dashboard/configuracion', icon: '⚙', label_es: 'Configuración', label_en: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isDemoMode } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-adgroup') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme-adgroup', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: '256px',
      minHeight: '100vh',
      background: 'var(--surface-container-low)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      /* No border - tonal shift crea separación */
    }}>
      {/* Marca */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              ADGROUP
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('Auditor de Emisiones', 'Emissions Auditor')}
            </p>
          </div>
        </div>
        {isDemoMode && (
          <div style={{ marginTop: '8px', padding: '4px 8px', background: 'var(--primary-fixed)', borderRadius: '6px', display: 'inline-block' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary-container)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Modo Demo
            </span>
          </div>
        )}
      </div>

      {/* Navegación principal */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.5rem 0.375rem' }}>
          {t('Principal', 'Main')}
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                id={`nav-${item.label_es.toLowerCase().replace(/\s+/g, '-')}`}
                className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
                <span>{lang === 'es' ? item.label_es : item.label_en}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '0.5rem 0.75rem', borderTop: 'none' }}>
        {NAV_BOTTOM.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
            style={{ marginBottom: '4px' }}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span>{lang === 'es' ? item.label_es : item.label_en}</span>
          </Link>
        ))}

        {/* Divisor Visual */}
        <div style={{ margin: '0.5rem 0 0.25rem', height: '1px', background: 'var(--surface-container-high)' }}></div>

        {/* Global Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.25rem 0.25rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Idioma', 'Language')}</span>
          <div style={{ display: 'flex', background: 'var(--surface-container-high)', borderRadius: '0.5rem', padding: '2px' }}>
            <button onClick={() => setLang('es')} style={{ background: lang === 'es' ? 'var(--primary)' : 'transparent', color: lang === 'es' ? 'white' : 'var(--on-surface-variant)', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: lang === 'es' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>ES</button>
            <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? 'var(--primary)' : 'transparent', color: lang === 'en' ? 'white' : 'var(--on-surface-variant)', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: lang === 'en' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>EN</button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.25rem 0.25rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Apariencia', 'Appearance')}</span>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'var(--surface-container-high)', 
              color: 'var(--on-surface-variant)', 
              border: 'none', 
              padding: '4px 10px', 
              borderRadius: '6px', 
              fontSize: '0.6875rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Usuario */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: 'var(--surface-container)',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
              {user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? 'Director Ejecutivo'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Global Admin
            </p>
          </div>
          <button
            id="btn-logout"
            onClick={signOut}
            title="Cerrar sesión"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '4px', borderRadius: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
