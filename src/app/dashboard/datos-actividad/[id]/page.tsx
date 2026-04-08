'use client';
import { use } from 'react';
import { DATOS_ACTIVIDAD_DEMO, EMPRESAS_DEMO } from '@/lib/demo-data';
import Link from 'next/link';

export default function DatoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const dato = DATOS_ACTIVIDAD_DEMO.find(d => d.id === id);

  if (!dato) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Registro de emisión no encontrado</h1>
        <Link href="/dashboard/datos-actividad" className="btn-secondary">Volver al Módulo de Inventario</Link>
      </div>
    );
  }

  const empresa = EMPRESAS_DEMO.find(e => e.id === dato.empresaId);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header & Back */}
      <Link href="/dashboard/datos-actividad" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface-variant)', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.2s', padding: '4px 8px', marginLeft: '-8px', borderRadius: '4px' }} className="hover:bg-[rgba(25,28,30,0.05)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver a Fuentes de Emisión
      </Link>
      
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Trazabilidad NCh-ISO 14064-1
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Auditoría de Emisión
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
          ID Rastreo Blockchain Demostrativo: <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--surface-container-high)', padding: '2px 6px', borderRadius: '4px' }}>{dato.id.toUpperCase()}</span>
        </p>
      </div>

      {/* Main Info Card */}
      <div className="card-elevated animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--surface-container)' }}>
          <div>
            <span className={`alcance-pill-${dato.alcance}`} style={{ marginBottom: '12px', display: 'inline-block' }}>Alcance {dato.alcance}</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', textTransform: 'capitalize' }}>
              {dato.tipoFuente.replace(/_/g, ' ')}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
              {empresa?.razonSocial || 'ADGROUP S.A.'} · Período Reportado: {dato.periodo}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Total Impacto Emisión</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {dato.emisionCalculada_tCO2e.toFixed(3)}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', marginTop: '4px' }}>tCO₂e</p>
          </div>
        </div>

        {/* Trazabilidad Matemática */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
          Rastreabilidad Matemática (Fórmula GWP Aplicada)
        </h3>
        <div style={{ background: 'var(--surface-container-lowest)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--surface-container)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Actividad Medida</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>{dato.cantidad.toLocaleString('es-CL')} <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{dato.unidad}</span></p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Paso de Unidad</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>× (1/1000)</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Factor Específico</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>{dato.factorValor} <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>kgCO₂e/{dato.unidad}</span></p>
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--primary-fixed)', borderRadius: '0.5rem', borderLeft: '4px solid var(--primary-container)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>Ecuación de Despegue (GHG Protocol Audit)</p>
            <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--primary-container)', display: 'block', wordWrap: 'break-word', fontWeight: 600 }}>
              [{dato.cantidad} {dato.unidad} × {dato.factorValor} kgCO₂e/{dato.unidad}] / 1000 = {dato.emisionCalculada_tCO2e.toFixed(4)} tCO₂e
            </code>
          </div>
        </div>

        {/* Origen del Factor */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
            Origen del Factor de Emisión
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'var(--surface-container-low)', borderRadius: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
              <span style={{ fontSize: '1.25rem' }}>🇨🇱</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>{dato.factorFuente}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Alineado con el panel intergubernamental GWP AR6 (IPCC).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evidencia Audit */}
      <div className="card-elevated animate-fade-in delay-100" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)' }}>
            Evidencia Documental
          </h3>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700, background: 'rgba(25,28,30,0.08)', padding: '4px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ISO 14064-1 Verificable
          </span>
        </div>
        <div style={{ border: '1px dashed var(--outline)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', background: 'var(--surface-container-lowest)' }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2.5" style={{ marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
           <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
             Los registros pre-poblados demostrativos no poseen archivos adjuntos guardados localmente.
           </p>
           <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
             Agrega tus propios "factores/fuentes nuevas" para que las facturas reales aparezcan previsualizadas acá en un futuro.
           </p>
        </div>
      </div>
    </div>
  );
}
