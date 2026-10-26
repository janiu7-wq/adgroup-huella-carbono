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

  type SortField = 'nombre' | 'alcance' | 'valor' | 'unidad' | 'gas' | 'gwp' | 'fuente';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortField(null); setSortDirection('asc'); }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const factoresFiltrados = FACTORES_LIST.filter(f => {
    const cumpleAlcance = filtroAlcance === 'todos' || f.alcance.toString() === filtroAlcance;
    const cumpleBusqueda = f.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                           f.gas.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleAlcance && cumpleBusqueda;
  });

  const factoresOrdenados = [...factoresFiltrados].sort((a, b) => {
    if (!sortField) return 0;
    let valA: any;
    let valB: any;
    if (sortField === 'nombre') { valA = a.nombre.toLowerCase(); valB = b.nombre.toLowerCase(); }
    else if (sortField === 'alcance') { valA = a.alcance; valB = b.alcance; }
    else if (sortField === 'valor') { valA = a.valor; valB = b.valor; }
    else if (sortField === 'unidad') { valA = a.unidad.toLowerCase(); valB = b.unidad.toLowerCase(); }
    else if (sortField === 'gas') { valA = a.gas; valB = b.gas; }
    else if (sortField === 'gwp') {
      valA = GWP_AR6[a.gas as keyof typeof GWP_AR6] || 0;
      valB = GWP_AR6[b.gas as keyof typeof GWP_AR6] || 0;
    }
    else if (sortField === 'fuente') { valA = a.fuente.toLowerCase(); valB = b.fuente.toLowerCase(); }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
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
                <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Actividad', 'Activity')} <span style={{ opacity: sortField === 'nombre' ? 1 : 0.4 }}>{sortField === 'nombre' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('alcance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Alcance', 'Scope')} <span style={{ opacity: sortField === 'alcance' ? 1 : 0.4 }}>{sortField === 'alcance' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('valor')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Factor (valor)', 'Factor (value)')} <span style={{ opacity: sortField === 'valor' ? 1 : 0.4 }}>{sortField === 'valor' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('unidad')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Unidad', 'Unit')} <span style={{ opacity: sortField === 'unidad' ? 1 : 0.4 }}>{sortField === 'unidad' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('gas')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Gas', 'Gas')} <span style={{ opacity: sortField === 'gas' ? 1 : 0.4 }}>{sortField === 'gas' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('gwp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    GWP <span style={{ opacity: sortField === 'gwp' ? 1 : 0.4 }}>{sortField === 'gwp' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('fuente')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('Fuente', 'Source')} <span style={{ opacity: sortField === 'fuente' ? 1 : 0.4 }}>{sortField === 'fuente' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {factoresOrdenados.length > 0 ? factoresOrdenados.map(f => (
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
