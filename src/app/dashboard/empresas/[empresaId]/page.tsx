'use client';
import { use } from 'react';
import { EMPRESAS_DEMO, DATOS_ACTIVIDAD_DEMO, METAS_DEMO } from '@/lib/demo-data';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import Link from 'next/link';

export default function EmpresaDashboardPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);
  
  const empresa = EMPRESAS_DEMO.find(e => e.id === empresaId);
  const datos = DATOS_ACTIVIDAD_DEMO.filter(d => d.empresaId === empresaId);
  const meta = METAS_DEMO.find(m => m.empresaId === empresaId);

  if (!empresa) return <div style={{ padding: '2.5rem' }}>Empresa no encontrada</div>;

  const total = datos.reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance1 = datos.filter(d => d.alcance === 1).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance2 = datos.filter(d => d.alcance === 2).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance3 = datos.filter(d => d.alcance === 3).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);

  const SCOPE_MIX = [
    { name: 'Alcance 1', value: alcance1, color: '#003527' },
    { name: 'Alcance 2', value: alcance2, color: '#4059aa' },
    { name: 'Alcance 3', value: alcance3, color: '#D4AF37' },
  ].filter(s => s.value > 0);

  // Datos simulados de tendencia mensual (simplificado)
  const TENDENCIA = [
    { mes: 'Ene', alcance1: alcance1 * 0.1, alcance2: alcance2 * 0.08, alcance3: alcance3 * 0.12 },
    { mes: 'Feb', alcance1: alcance1 * 0.11, alcance2: alcance2 * 0.09, alcance3: alcance3 * 0.1 },
    { mes: 'Mar', alcance1: alcance1 * 0.13, alcance2: alcance2 * 0.1, alcance3: alcance3 * 0.15 },
  ];

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <Link href="/dashboard/empresas" style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary-container)', textDecoration: 'none', marginBottom: '8px', display: 'inline-block', fontWeight: 600 }}>
            ← Volver a Holding
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px',
              background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>
                {empresa.razonSocial.charAt(0)}
              </span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {empresa.razonSocial}
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                {empresa.rut} · {empresa.rubro}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/datos-actividad?empresa=${empresa.id}`} className="btn-secondary">
          Ver Fuentes de Emisión
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '8px' }}>Emisiones Totales</p>
          <p className="metric-display" style={{ fontSize: '2rem' }}>{total.toFixed(2)}</p>
          <p className="metric-unit">tCO₂e</p>
        </div>
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '8px' }}>Fuentes Registradas</p>
          <p className="metric-display" style={{ color: 'var(--secondary)', fontSize: '2rem' }}>{datos.length}</p>
          <p className="metric-unit">actividades base</p>
        </div>
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '8px' }}>Instalaciones</p>
          <p className="metric-display" style={{ color: 'var(--primary-container)', fontSize: '2rem' }}>{empresa.instalaciones.length}</p>
          <p className="metric-unit">centros operativos</p>
        </div>
        <div className="card-elevated" style={{ padding: '1.5rem', background: meta ? 'var(--primary-fixed)' : 'var(--surface-container-low)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: meta ? 'var(--primary-container)' : 'var(--outline)', textTransform: 'uppercase', marginBottom: '8px' }}>Meta Anual</p>
          <p className="metric-display" style={{ color: meta ? 'var(--primary-container)' : 'var(--outline)', fontSize: '2rem' }}>{meta?.metaAnual_tCO2e ?? 'N/A'}</p>
          <p className="metric-unit" style={{ color: meta ? 'var(--primary)' : 'var(--outline)' }}>{meta ? 'tCO₂e' : 'sin definir'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Trend Area */}
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1.25rem' }}>
            Tendencia {empresa.periodoReporte}
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={TENDENCIA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003527" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#003527" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(191,201,195,0.15)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} tCO₂e`, '']} />
              <Area type="monotone" dataKey="alcance1" name="Alcance 1" stroke="#003527" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scope Mix */}
        <div className="card-elevated" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1.25rem' }}>
            Mix de Alcances
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SCOPE_MIX} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {SCOPE_MIX.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} tCO₂e`, '']} />
              <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '0.75rem', marginTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
