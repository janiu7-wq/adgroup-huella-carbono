'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, isDemoMode, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Error al iniciar sesión con Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--primary)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 480px',
      background: 'var(--primary)',
    }}>
      {/* ─── Panel Izquierdo (Hero) ─── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        background: 'linear-gradient(160deg, var(--primary) 0%, var(--primary-container) 60%, #0a6b52 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orbes decorativos */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'rgba(176, 240, 214, 0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '100px', left: '-50px', width: '300px', height: '300px', background: 'rgba(64, 89, 170, 0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'rgba(176, 240, 214, 0.2)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(176, 240, 214, 0.3)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-fixed)" strokeWidth="2.5">
                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>ADGROUP</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(176, 240, 214, 0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: '52px' }}>Auditor de Emisiones</p>
        </div>

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.25rem',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            maxWidth: '520px',
          }}>
            Huella de Carbono<br />
            <span style={{ color: 'var(--primary-fixed)' }}>Organizacional</span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.65,
            maxWidth: '460px',
            marginBottom: '2.5rem',
          }}>
            Auditoría de sostenibilidad de precisión para holdings modernos.
            Acceso seguro a su inteligencia ambiental bajo NCh-ISO 14064-1:2019.
          </p>

          {/* Stats mini */}
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {[
              { valor: '12', label: 'Empresas integradas' },
              { valor: '24', label: 'Sellos HuellaChile' },
              { valor: '98.4%', label: 'Audit readiness' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>{s.valor}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(176,240,214,0.7)', marginTop: '2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer sello */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--primary-fixed)', borderRadius: '50%', animation: 'pulse 2s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(176,240,214,0.7)' }}>Certificación HuellaChile 2024 · GHG Protocol AR6</span>
        </div>
      </div>

      {/* ─── Panel Derecho (Login Form) ─── */}
      <div style={{
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--on-surface)',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}>Sustainability Hub</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
            Ingresa tus credenciales para continuar.
          </p>

          {isDemoMode && (
            <div style={{
              background: 'var(--primary-fixed)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--primary-container)',
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--primary-container)', fontWeight: 600, marginBottom: '4px' }}>
                🚀 Modo Demo Activo
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary)' }}>
                Firebase no configurado. Accede con datos demo de ADGROUP para explorar la app.
              </p>
            </div>
          )}

          {/* Google Sign In */}
          {!isDemoMode && (
            <>
              <button
                id="btn-google-login"
                onClick={handleGoogleLogin}
                disabled={submitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '0.75rem',
                  background: 'var(--surface-container-lowest)',
                  border: '1.5px solid var(--outline-variant)',
                  borderRadius: '0.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--on-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '1.25rem',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google ADGROUP
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>o con correo corporativo</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant)' }} />
              </div>

              <form onSubmit={handleEmailLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>
                    Correo corporativo
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    className="input-field"
                    placeholder="nombre@adgroup.cl"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)' }}>Contraseña</label>
                    <a href="#" style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary-container)', textDecoration: 'none' }}>¿Olvidó su contraseña?</a>
                  </div>
                  <input
                    id="input-password"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div style={{ background: 'var(--error-container)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--error)' }}>{error}</p>
                  </div>
                )}

                <button
                  id="btn-email-login"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>
            </>
          )}

          {isDemoMode && (
            <button
              id="btn-demo-access"
              onClick={handleDemoAccess}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '1rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 17 18 12 13 7"/><line x1="6" y1="12" x2="18" y2="12"/>
              </svg>
              Acceder al Demo ADGROUP
            </button>
          )}

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: '2rem', lineHeight: 1.5 }}>
            Acceso restringido a usuarios autorizados ADGROUP Holdings.<br />
            Toda actividad es registrada con fines de auditoría.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
          div[style*="3.25rem"] { font-size: 2rem !important; }
          div[style*="480px"] { display: none; }
        }
      `}</style>
    </div>
  );
}
