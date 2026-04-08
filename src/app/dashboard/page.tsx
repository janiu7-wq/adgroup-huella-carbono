'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DatoActividad } from '@/lib/types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { EMPRESAS_DEMO, TENDENCIA_HOLDING_DEMO, DATOS_ACTIVIDAD_DEMO } from '@/lib/demo-data';
import { getSelloHuellaChile } from '@/lib/calculos-ghg';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '0.75rem', padding: '0.875rem 1rem', boxShadow: '0 4px 24px rgba(25,28,30,0.1)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: p.color }}>
          {p.name}: <strong>{p.value.toFixed(1)} tCO₂e</strong>
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const { lang, setLang, t } = useLanguage();
  const [datosDB, setDatosDB] = useState<DatoActividad[]>(DATOS_ACTIVIDAD_DEMO);
  
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'datos_actividad'));
        const dbData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatoActividad));
        setDatosDB(dbData);
      } catch (e) {
        console.warn('Firestore fallback dashboard datos_actividad', e);
      }
    };
    fetchDatos();
  }, []);

  const EMPRESA_RANKING = EMPRESAS_DEMO.map(e => {
    const datosE = datosDB.filter(d => d.empresaId === e.id);
    const tot = datosE.reduce((s, d) => s + (d.emisionCalculada_tCO2e||0), 0);
    return { name: e.razonSocial.split(' ')[0], total: parseFloat(tot.toFixed(1)), full: e.razonSocial, id: e.id };
  }).sort((a, b) => b.total - a.total);

  const totalEmisiones = datosDB.reduce((s, d) => s + (d.emisionCalculada_tCO2e||0), 0);
  const alcance1 = datosDB.filter(d => d.alcance === 1).reduce((s, d) => s + (d.emisionCalculada_tCO2e||0), 0);
  const alcance2 = datosDB.filter(d => d.alcance === 2).reduce((s, d) => s + (d.emisionCalculada_tCO2e||0), 0);
  const alcance3 = datosDB.filter(d => d.alcance === 3).reduce((s, d) => s + (d.emisionCalculada_tCO2e||0), 0);

  const HOLDING_KPIS = {
    totalEmisiones: totalEmisiones > 0 ? totalEmisiones : 3279.1,
    alcance1: alcance1 > 0 ? alcance1 : 2104.3,
    alcance2: alcance2 > 0 ? alcance2 : 856.2,
    alcance3: alcance3 > 0 ? alcance3 : 318.6,
    reduccion: 14.2,
    empresas: EMPRESA_RANKING.filter(e => e.total > 0).length || 12,
    sellos: 24,
    auditReadiness: 98.4,
  };

  const sello = getSelloHuellaChile(HOLDING_KPIS.reduccion);

  const SCOPE_MIX = [
    { name: t('Alcance 1', 'Scope 1'), value: HOLDING_KPIS.alcance1, color: '#003527' },
    { name: t('Alcance 2', 'Scope 2'), value: HOLDING_KPIS.alcance2, color: '#4059aa' },
    { name: t('Alcance 3', 'Scope 3'), value: HOLDING_KPIS.alcance3, color: '#D4AF37' },
  ];

  const SELLOS_HOLDING = [
    { sello: t('Cuantificación', 'Quantification'), count: 12, desc: t('Mediciones validadas', 'Validated metrics'), color: '#003527', bg: '#b0f0d6' },
    { sello: t('Reducción', 'Reduction'), count: 8, desc: t('Reducción alcanzada', 'Achieved reduction'), color: '#4059aa', bg: 'rgba(64,89,170,0.12)' },
    { sello: t('Excelencia', 'Excellence'), count: 3, desc: t('Liderazgo sostenible', 'Sustainable leadership'), color: '#735c00', bg: '#ffe088' },
    { sello: t('Neutralización', 'Neutrality'), count: 1, desc: t('Carbon neutral', 'Carbon neutral'), color: 'white', bg: '#003527' },
  ];

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div className="animate-fade-in">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Holding ADGROUP · {selectedPeriod}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {t('Panel Ejecutivo', 'Executive Dashboard')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
            {t('Visualización consolidada de huella de carbono en todo el ecosistema ADGROUP.', 'Consolidated carbon footprint visualization across the ADGROUP ecosystem.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            id="select-periodo"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.5rem 0.875rem', outline: 'none', border: '1px solid var(--outline-variant)' }}
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <Link href="/dashboard/datos-actividad" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('Nueva Fuente', 'New Source')}
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('Emisiones Totales', 'Total Emissions'), valor: HOLDING_KPIS.totalEmisiones.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US'), unidad: 'tCO₂e', icon: '🌍', color: 'var(--primary)', delay: 0 },
          { label: t('Empresas Integradas', 'Integrated Companies'), valor: HOLDING_KPIS.empresas, unidad: t('unidades subsidiarias', 'subsidiary units'), icon: '🏢', color: 'var(--secondary)', delay: 100 },
          { label: t('Índice Neutralización', 'Neutrality Index'), valor: `${HOLDING_KPIS.reduccion}%`, unidad: t('hacia Net Zero', 'towards Net Zero'), icon: '🌱', color: 'var(--primary-container)', delay: 200 },
          { label: t('Sellos HuellaChile', 'HuellaChile Seals'), valor: HOLDING_KPIS.sellos, unidad: t('certificaciones vigentes', 'active certifications'), icon: '🏅', color: 'var(--tertiary)', delay: 300 },
        ].map(kpi => (
          <div
            key={kpi.label}
            className={`card-elevated animate-fade-in delay-${kpi.delay}`}
            style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', fontSize: '1.75rem', opacity: 0.25 }}>{kpi.icon}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              {kpi.label}
            </p>
            <p className="metric-display" style={{ color: kpi.color, marginBottom: '4px', fontSize: '2.25rem' }}>{kpi.valor}</p>
            <p className="metric-unit">{kpi.unidad}</p>
          </div>
        ))}
      </div>

      {/* ── Gráficos Fila 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Tendencia Anual */}
        <div className="card-elevated animate-fade-in" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
              {t('Evolución Anual de Huella', 'Annual Footprint Evolution')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              {t('Datos consolidados del holding por factores de emisión.', 'Consolidated holding data by emission factors.')}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={TENDENCIA_HOLDING_DEMO} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradAlc1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003527" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#003527" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradAlc2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4059aa" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4059aa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradAlc3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.13}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(191,201,195,0.15)" />
              <XAxis dataKey="mes" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#404944' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#404944' }} axisLine={false} tickLine={false} unit=" t" />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} tCO₂e`, '']} />
              <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '0.75rem' }} />
              <Area type="monotone" dataKey="alcance1" name={t('Alcance 1', 'Scope 1')} stroke="#003527" strokeWidth={2} fill="url(#gradAlc1)" />
              <Area type="monotone" dataKey="alcance2" name={t('Alcance 2', 'Scope 2')} stroke="#4059aa" strokeWidth={2} fill="url(#gradAlc2)" />
              <Area type="monotone" dataKey="alcance3" name={t('Alcance 3', 'Scope 3')} stroke="#D4AF37" strokeWidth={2} fill="url(#gradAlc3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scope Mix Donut */}
        <div className="card-elevated animate-fade-in delay-100" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
            {t('Mix de Alcances', 'Scope Mix')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
            {t('Distribución Alcance 1/2/3', 'Scope 1/2/3 Breakdown')}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={SCOPE_MIX}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {SCOPE_MIX.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} tCO₂e`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
            {SCOPE_MIX.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{s.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                  {((s.value / HOLDING_KPIS.totalEmisiones) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fila 2: Ranking + Sellos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Ranking Empresas */}
        <div className="card-elevated animate-fade-in" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
            {t('Ranking de Emisiones por Empresa', 'Emissions Ranking by Company')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '1.25rem' }}>
            {t('Empresas con mayor intensidad de recursos.', 'Entities with highest resource intensity.')}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={EMPRESA_RANKING} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#404944' }} axisLine={false} tickLine={false} unit="t" />
              <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#404944' }} axisLine={false} tickLine={false} width={80} />
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(191,201,195,0.2)" />
              <Tooltip formatter={(value: any) => [`${value} tCO₂e`, t('Emisiones', 'Emissions')]} />
              <Bar dataKey="total" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sellos HuellaChile */}
        <div className="card-elevated animate-fade-in delay-100" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
                {t('Sellos HuellaChile 2024', 'HuellaChile Seals 2024')}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                {t('Período', 'Period')} {selectedPeriod}
              </p>
            </div>
            {sello && (
              <span className={`sello-badge sello-${sello.sello.toLowerCase()}`}>
                ✓ {sello.sello}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {SELLOS_HOLDING.map(s => (
              <div
                key={s.sello}
                style={{
                  padding: '1rem',
                  background: s.bg,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, color: s.color }}>{s.sello}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: s.color, opacity: 0.8 }}>{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Nivel de Auditoría */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--primary-fixed)', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                {t('Nivel de Auditoría', 'Audit Readiness')}
              </p>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)' }}>{HOLDING_KPIS.auditReadiness}%</span>
            </div>
            <div style={{ background: 'rgba(0,53,39,0.15)', borderRadius: '999px', height: '6px' }}>
              <div style={{ background: 'var(--primary-container)', height: '6px', borderRadius: '999px', width: `${HOLDING_KPIS.auditReadiness}%`, transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--primary)', marginTop: '6px' }}>
              {t('Datos listos para verificación externa ISO 14064-1:2019', 'Data ready for external ISO 14064-1:2019 verification')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Accesos Rápidos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {[
          { href: '/dashboard/empresas', label: t('Ver Empresas', 'View Companies'), desc: t(`${EMPRESAS_DEMO.length} razones sociales`, `${EMPRESAS_DEMO.length} business units`), icon: '🏢' },
          { href: '/dashboard/datos-actividad', label: t('Fuentes de Emisión', 'Emission Sources'), desc: t('Agregar mediciones', 'Add activity data'), icon: '📊' },
          { href: '/dashboard/reportes', label: t('Generar Reporte', 'Generate Report'), desc: t('PDF · Excel · HuellaChile', 'PDF · Excel · Audit Backup'), icon: '📄' },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '1rem 1.25rem',
              background: 'var(--surface-container-lowest)',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>{a.label}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{a.desc}</p>
            </div>
            <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--outline)" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
