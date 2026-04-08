'use client';
export default function ConfiguracionPage() {
  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Sistema
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          Configuración Global
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
          Administración de integraciones, roles y notificaciones.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '800px' }}>
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '8px' }}>
            Integración Climatiq API
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
            Servicio de cálculo automático de factores de emisión. Gratuito hasta 1.000 peticiones/mes.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="password"
              className="input-field"
              value="********-****-****-****-************"
              disabled
              style={{ flex: 1, background: 'var(--surface-container-low)' }}
            />
            <button className="btn-secondary">Actualizar Key</button>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '8px' }}>
            Directorio Activo ADGROUP
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
            Sincronización de usuarios (AD) y control de acceso SSO vía Google Workspace (adgroup.cl).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--primary-fixed)', borderRadius: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--primary-container)', borderRadius: '50%' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-container)' }}>
              Sincronizado correctamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
