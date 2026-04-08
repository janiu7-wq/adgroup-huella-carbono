'use client';
import { useState } from 'react';
import { FACTORES_HUELLACHILE } from '@/lib/calculos-ghg';
import { GWP_AR6 } from '@/lib/calculos-ghg';
import { useLanguage } from '@/contexts/LanguageContext';

type FactorKey = keyof typeof FACTORES_HUELLACHILE;

const FACTORES_LIST = Object.entries(FACTORES_HUELLACHILE).map(([key, f]) => ({
  id: key as FactorKey,
  nombre: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  ...f,
}));

export default function FactoresPage() {
  const { t } = useLanguage();
  const [filtroAlcance, setFiltroAlcance] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const factoresFiltrados = FACTORES_LIST.filter(f => {
    const cumpleAlcance = filtroAlcance === 'todos' || f.alcance.toString() === filtroAlcance;
    const cumpleBusqueda = f.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                           f.gas.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleAlcance && cumpleBusqueda;
  });

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            {t('Base de Datos GHG', 'GHG Database')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {t('Factores de Emisión', 'Emission Factors')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
            {t('Factores HuellaChile 2024 · CNE · GHG Protocol AR6 · GWP 100 años IPCC', 'HuellaChile 2024 Factors · CNE · GHG Protocol AR6 · GWP 100-year IPCC')}
          </p>
        </div>
      </div>

      {/* GWP Reference */}
      <div className="card-elevated" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
          {t('GWP AR6 IPCC (Potencial de Calentamiento Global, 100 años)', 'GWP AR6 IPCC (Global Warming Potential, 100 years)')}
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(GWP_AR6).map(([gas, gwp]) => (
            <div key={gas} style={{ padding: '0.875rem 1.25rem', background: 'var(--surface-container-low)', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{gwp}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{gas}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de factores */}
      <div className="card-elevated" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              {t('Factores Activos', 'Active Factors')} ({factoresFiltrados.length})
            </h2>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              {t('Fuente primaria: HuellaChile 2024 · Fallback disponible vía Climatiq API', 'Primary source: HuellaChile 2024 · Fallback available via Climatiq API')}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={t('Buscar factor o gas...', 'Search factor or gas...')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--outline-variant)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                minWidth: '220px',
                background: 'var(--surface-container-lowest)'
              }}
            />
            <select
              value={filtroAlcance}
              onChange={(e) => setFiltroAlcance(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--outline-variant)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                background: 'var(--surface-container-low)',
                cursor: 'pointer'
              }}
            >
              <option value="todos">{t('Todos los alcances', 'All scopes')}</option>
              <option value="1">{t('Alcance 1', 'Scope 1')}</option>
              <option value="2">{t('Alcance 2', 'Scope 2')}</option>
              <option value="3">{t('Alcance 3', 'Scope 3')}</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>{t('Actividad', 'Activity')}</th>
                <th>{t('Alcance', 'Scope')}</th>
                <th>{t('Factor (valor)', 'Factor (value)')}</th>
                <th>{t('Unidad', 'Unit')}</th>
                <th>{t('Gas', 'Gas')}</th>
                <th>GWP</th>
                <th>{t('Fuente', 'Source')}</th>
              </tr>
            </thead>
            <tbody>
              {factoresFiltrados.length > 0 ? factoresFiltrados.map(f => (
                <tr key={f.id}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8125rem' }}>{f.nombre}</td>
                  <td><span className={`alcance-pill-${f.alcance}`}>A{f.alcance}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--primary)' }}>
                      {f.valor}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{f.unidad}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: '4px' }}>
                      {f.gas}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--secondary)' }}>
                    {GWP_AR6[f.gas as keyof typeof GWP_AR6]}
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{f.fuente}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
                    {t('No se encontraron factores que coincidan con la búsqueda.', 'No factors matched the search criteria.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
