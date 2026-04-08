'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, Info, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// --- DEMO DATA RETAIL HOLDING ADGROUP ---
type EstadoMeta = 'planificada' | 'en_ejecucion' | 'en_riesgo' | 'retrasada' | 'cumplida' | 'verificada';

interface Hito {
  id: string;
  nombre: string;
  fecha: string;
  estado: 'completado' | 'pendiente' | 'retrasado';
  evidencia?: string;
}

interface MetaEjecutiva {
  id: string;
  nombre: string;
  empresa: string;
  tipoMeta: 'Absoluta' | 'Intensidad';
  unidad: 'tCO2e' | 'tCO2e/M$';
  alcances: number[];
  añoBase: number;
  añoObjetivo: number;
  emisionesBase: number;
  emisionesActuales: number;
  reduccionObjetivo: number; // En la unidad definida
  avanceAcumulado: number;
  proyeccionCierre: number;
  responsable: string;
  aprobador: string;
  estado: EstadoMeta;
  verificada: boolean;
  ultimaRevision: string;
  observaciones: string;
  impactoDirectorio: string;
  hitos: Hito[];
}

const METAS_RETAIL_DEMO: MetaEjecutiva[] = [
  {
    id: 'm1',
    nombre: 'Descarbonización Flota Logística',
    empresa: 'ADRetail Central',
    tipoMeta: 'Absoluta',
    unidad: 'tCO2e',
    alcances: [1],
    añoBase: 2021,
    añoObjetivo: 2028,
    emisionesBase: 12500,
    emisionesActuales: 9800,
    reduccionObjetivo: 6250, // 50%
    avanceAcumulado: 2700,
    proyeccionCierre: 7000,
    responsable: 'Carlos Muñoz (Gerente Logística)',
    aprobador: 'Comité ESG',
    estado: 'verificada',
    verificada: true,
    ultimaRevision: '2024-03-01',
    observaciones: 'El recambio a 50 camiones eléctricos avanza según lo planificado. Fase 2 requiere V°B° de finanzas.',
    impactoDirectorio: 'Equivale a retirar 1,400 autos particulares de circulación al año. Avanza hacia el sello "Excelencia" HuellaChile.',
    hitos: [
      { id: 'h1', nombre: 'Compra 20 camiones EV', fecha: '2023-06', estado: 'completado', evidencia: 'orden_compra_EV.pdf' },
      { id: 'h2', nombre: 'Instalación 10 cargadores', fecha: '2023-10', estado: 'completado' },
      { id: 'h3', nombre: 'Compra 30 camiones EV', fecha: '2024-08', estado: 'pendiente' },
    ]
  },
  {
    id: 'm2',
    nombre: 'Eficiencia Energética Tiendas',
    empresa: 'ADElectronics',
    tipoMeta: 'Intensidad',
    unidad: 'tCO2e/M$',
    alcances: [2],
    añoBase: 2022,
    añoObjetivo: 2026,
    emisionesBase: 3.5,
    emisionesActuales: 3.1,
    reduccionObjetivo: 1.5,
    avanceAcumulado: 0.4,
    proyeccionCierre: 2.8,
    responsable: 'Ana Silva (Operaciones)',
    aprobador: 'Directorio',
    estado: 'en_riesgo',
    verificada: false,
    ultimaRevision: '2024-02-15',
    observaciones: 'Demoras en la licitación de paneles solares para bodegas principales.',
    impactoDirectorio: 'Reducirá costos operativos en energía en un 18% anualizado a partir de 2025. Riesgo reputacional medio si no se cumple el objetivo declarado a inversionistas.',
    hitos: [
      { id: 'h4', nombre: 'Auditoría Energética', fecha: '2023-04', estado: 'completado', evidencia: 'informe_audit.pdf' },
      { id: 'h5', nombre: 'Licitación PPA Solar', fecha: '2024-03', estado: 'retrasado' },
    ]
  },
  {
    id: 'm3',
    nombre: 'Proveedores Sostenibles',
    empresa: 'ADHome Style',
    tipoMeta: 'Absoluta',
    unidad: 'tCO2e',
    alcances: [3],
    añoBase: 2023,
    añoObjetivo: 2030,
    emisionesBase: 45000,
    emisionesActuales: 44000,
    reduccionObjetivo: 13500, // 30%
    avanceAcumulado: 1000,
    proyeccionCierre: 35000,
    responsable: 'Luis Retamal (Adquisiciones)',
    aprobador: 'Gerencia General',
    estado: 'en_ejecucion',
    verificada: true,
    ultimaRevision: '2024-01-20',
    observaciones: 'Encuestas de Alcance 3 enviadas al 80% de los proveedores top 50.',
    impactoDirectorio: 'Evita riesgos regulatorios futuros en Cadena de Suministro (Scope 3). Prepara holding para normativas IFRS S2.',
    hitos: [
      { id: 'h6', nombre: 'Software Trazabilidad A3', fecha: '2024-01', estado: 'completado' },
      { id: 'h7', nombre: 'Onboarding Proveedores', fecha: '2024-06', estado: 'pendiente' },
    ]
  }
];

const TENDENCIA_DATOS = [
  { año: '2021 (Base)', ADRetail: 12500, ADElectronics: null, ADHome: null, Objetivo: 12500 },
  { año: '2022', ADRetail: 11800, ADElectronics: 3500, ADHome: null, Objetivo: 11500 },
  { año: '2023', ADRetail: 10500, ADElectronics: 3300, ADHome: 45000, Objetivo: 10000 },
  { año: '2024 (Actual)', ADRetail: 9800, ADElectronics: 3100, ADHome: 44000, Objetivo: 8500 },
  { año: '2025 (Proy)', ADRetail: 8500, ADElectronics: 2800, ADHome: 42000, Objetivo: 7500 },
  { año: '2028 (Meta)', ADRetail: 6250, ADElectronics: 2000, ADHome: 35000, Objetivo: 6250 },
];

export default function MetasPage() {
  const { t, lang } = useLanguage();
  const [empresaSel, setEmpresaSel] = useState<string>('Todas');
  const [alcanceSel, setAlcanceSel] = useState<string>('Todos');
  const [tipoSel, setTipoSel] = useState<string>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [metasDB, setMetasDB] = useState<MetaEjecutiva[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar metas de Firestore
  const fetchMetas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'metas'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MetaEjecutiva));
      
      if (data.length > 0) {
        setMetasDB(data);
      } else {
        // Fallback a demo si la DB está vacía
        setMetasDB(METAS_RETAIL_DEMO);
      }
    } catch (e) {
      console.warn("Firestore no configurado o sin permisos. Usando datos Demo local.", e);
      setMetasDB(METAS_RETAIL_DEMO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetas();
  }, []);

  const metasFiltradas = metasDB.filter(m => {
    if (empresaSel !== 'Todas' && m.empresa !== empresaSel) return false;
    if (alcanceSel !== 'Todos' && !m.alcances.includes(Number(alcanceSel))) return false;
    if (tipoSel !== 'Todos' && m.tipoMeta !== tipoSel) return false;
    return true;
  });

  const getStatusColor = (estado: EstadoMeta) => {
    switch(estado) {
      case 'verificada': return 'var(--primary)';
      case 'cumplida': return 'var(--primary)';
      case 'en_ejecucion': return '#00acc1'; 
      case 'planificada': return 'var(--on-surface-variant)';
      case 'en_riesgo': return '#fb8c00'; // Naranja
      case 'retrasada': return 'var(--error)';
      default: return 'var(--on-surface-variant)';
    }
  };

  const getStatusIcon = (estado: EstadoMeta) => {
    switch(estado) {
      case 'verificada': return <CheckCircle2 size={18} color="var(--surface)" fill="var(--primary)" />;
      case 'cumplida': return <CheckCircle size={18} color="var(--primary)" />;
      case 'en_ejecucion': return <Clock size={18} color="#00acc1" />;
      case 'en_riesgo': return <AlertTriangle size={18} color="#fb8c00" />;
      case 'retrasada': return <XCircle size={18} color="var(--error)" />;
      default: return <Info size={18} />;
    }
  };

  const getStatusLabel = (estado: EstadoMeta) => {
    const labels: Record<EstadoMeta, any> = {
      'planificada': t('PLANIFICADA', 'PLANNED'),
      'en_ejecucion': t('EN EJECUCIÓN', 'IN PROGRESS'),
      'en_riesgo': t('EN RIESGO', 'AT RISK'),
      'retrasada': t('RETRASADA', 'DELAYED'),
      'cumplida': t('CUMPLIDA', 'COMPLETED'),
      'verificada': t('VERIFICADA', 'VERIFIED')
    };
    return labels[estado];
  };

  // Selected Meta (for deeper inspection)
  const metaPrincipal = metasFiltradas.length > 0 ? metasFiltradas[0] : null;

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh', background: 'var(--surface-container-lowest)' }}>
      {/* HEADER EJECUTIVO */}
      <div className="header-layout">
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            {t('Panel Ejecutivo ADGROUP', 'ADGROUP Executive Panel')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {t('Metas de Reducción Corporativas', 'Corporate Reduction Targets')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--on-surface-variant)', marginTop: '8px', maxWidth: '800px' }}>
            {t('Visión consolidada del progreso de descarbonización del holding. Alineado con NCh-ISO 14064-1, mostrando brechas, hitos críticos y trazabilidad para reportabilidad oficial (HuellaChile / IFRS S2).', 'Consolidated view of the holding decarbonization progress. Aligned with ISO 14064-1, showing gaps, critical milestones, and traceability for official reporting.')}
          </p>
        </div>
        
        {/* FILTROS GLOBALES */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface-container-low)', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--outline-variant)' }}>
          <select value={empresaSel} onChange={e => setEmpresaSel(e.target.value)} className="select-executive" style={{ width: '150px' }}>
            <option value="Todas">{t('Holding Completo', 'Entire Holding')}</option>
            <option value="ADRetail Central">ADRetail Central</option>
            <option value="ADElectronics">ADElectronics</option>
            <option value="ADHome Style">ADHome Style</option>
          </select>
          <select value={alcanceSel} onChange={e => setAlcanceSel(e.target.value)} className="select-executive">
            <option value="Todos">{t('Alcances: Todos', 'Scopes: All')}</option>
            <option value="1">{t('Alcance 1', 'Scope 1')}</option>
            <option value="2">{t('Alcance 2', 'Scope 2')}</option>
            <option value="3">{t('Alcance 3', 'Scope 3')}</option>
          </select>
          <select value={tipoSel} onChange={e => setTipoSel(e.target.value)} className="select-executive">
            <option value="Todos">{t('Tipos: Todos', 'Types: All')}</option>
            <option value="Absoluta">{t('Absoluta', 'Absolute')}</option>
            <option value="Intensidad">{t('Intensidad', 'Intensity')}</option>
          </select>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', border: 'none', cursor: 'pointer' }}>
            {t('+ Crear Meta', '+ Create Target')}
          </button>
        </div>
      </div>

      <style>{`
        .select-executive {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--outline);
          background: var(--surface);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--on-surface);
          cursor: pointer;
          outline: none;
          max-width: 100%;
        }
        .select-executive:hover {
          border-color: var(--primary);
        }
        .executive-kpi-card {
          background: var(--surface);
          border: 1px solid var(--outline-variant);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          word-break: break-word;
        }
        .table-executive {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-body);
        }
        .table-executive th {
          text-align: left;
          padding: 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--on-surface-variant);
          border-bottom: 2px solid var(--surface-container-high);
          background: var(--surface-container-lowest);
          white-space: nowrap;
        }
        .table-executive td {
          padding: 1rem;
          font-size: 0.875rem;
          border-bottom: 1px solid var(--surface-container-high);
          color: var(--on-surface);
          word-break: break-word;
        }
        .table-executive tr:hover td {
          background: var(--surface-container-low);
        }
        
        /* Clases Responsivas Agregadas */
        .header-layout {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr;
          }
          .executive-kpi-card {
            padding: 1.25rem;
          }
        }
      `}</style>

      {/* TARJETAS KPI (Resumen consolidado de lo filtrado) */}
      <div className="kpi-grid">
        <div className="executive-kpi-card">
          <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{t('Emisiones Base Acumuladas', 'Cumulative Base Emissions')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.5rem' }}>
            {metasFiltradas.reduce((sum,m)=>sum+m.emisionesBase, 0).toLocaleString()} <span style={{fontSize:'1rem', color:'var(--on-surface-variant)'}}>tCO₂e</span>
          </p>
        </div>
        <div className="executive-kpi-card">
          <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{t('Emisiones Actuales', 'Current Emissions')}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)' }}>
              {metasFiltradas.reduce((sum,m)=>sum+m.emisionesActuales, 0).toLocaleString()} <span style={{fontSize:'1rem', color:'var(--on-surface-variant)'}}>tCO₂e</span>
            </p>
            <span style={{ fontSize:'0.875rem', fontWeight: 700, color:'var(--primary)'}}>↓ -2.3%</span>
          </div>
        </div>
        <div className="executive-kpi-card">
          <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{t('Reducción Objetivo Total', 'Total Target Reduction')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.5rem' }}>
            {metasFiltradas.reduce((sum,m)=>sum+m.reduccionObjetivo, 0).toLocaleString()} <span style={{fontSize:'1rem', color:'var(--on-surface-variant)'}}>tCO₂e</span>
          </p>
        </div>
        <div className="executive-kpi-card" style={{ background: 'var(--surface-container)', borderColor: 'transparent' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{t('Avance Consolidado', 'Consolidated Progress')}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '8px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>18.3%</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600}}>{t('del objetivo final', 'of final target')}</p>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--surface-container-highest)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '18.3%', height: '100%', background: 'var(--primary)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* GRÁFICO PRINCIPAL */}
        <div className="executive-kpi-card" style={{ padding: '2rem', gridColumn: '1 / 2' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {t('Trayectoria de Emisiones (Absolutas) vs Objetivos', 'Emissions Trajectory (Absolute) vs Targets')}
            <Info size={16} color="var(--on-surface-variant)" />
          </h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={TENDENCIA_DATOS} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-container-high)" />
                <XAxis dataKey="año" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 800, color: 'var(--on-surface)', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="ADRetail" name={t("ADRetail (Real)", "ADRetail (Actual)")} stroke="#00acc1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Objetivo" name={t("Ruta Objetivo (1.5°C)", "Target Pathway (1.5°C)")} stroke="var(--primary)" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IMPACTO DIRECTORIO (Alerta Ejecutiva) */}
        {metaPrincipal && (
          <div className="executive-kpi-card" style={{ gridColumn: '2 / 3', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-container-lowest) 100%)', borderLeft: `4px solid ${getStatusColor(metaPrincipal.estado)}` }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Impacto & Alertas (Directorio)', 'Impact & Alerts (Board)')}
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('META SELECCIONADA', 'SELECTED TARGET')}</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>{metaPrincipal.nombre}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)' }}>{metaPrincipal.empresa}</p>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--surface-container-low)', padding: '1rem', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <CheckCircle size={14} color="var(--primary)" /> {t('VALOR ESTRATÉGICO', 'STRATEGIC VALUE')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                {metaPrincipal.impactoDirectorio}
              </p>
            </div>

            {metaPrincipal.estado === 'en_riesgo' && (
              <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <AlertTriangle size={20} color="#fb8c00" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e65100', marginBottom: '2px' }}>{t('ALERTA DE DESVIACIÓN', 'DEVIATION ALERT')}</p>
                  <p style={{ fontSize: '0.75rem', color: '#e65100', opacity: 0.9 }}>{metaPrincipal.observaciones}</p>
                </div>
              </div>
            )}
            
            {metaPrincipal.estado === 'verificada' && (
              <div style={{ background: 'rgba(56, 107, 246, 0.1)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <CheckCircle2 size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>{t('META VERIFICADA ISO 14064-1', 'VERIFIED TARGET ISO 14064-1')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t('Lista para reporte HuellaChile y Memoria Integrada.', 'Ready for HuellaChile report and Integrated Report.')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLA EJECUTIVA DE SEGUIMIENTO */}
      <div className="executive-kpi-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            {t('Seguimiento de Metas Activas', 'Active Targets Tracking')} ({metasFiltradas.length})
          </h2>
          <button className="btn-ghost" style={{ fontSize: '0.8125rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Download size={16} /> {t('Reporte Directorio (PDF)', 'Board Report (PDF)')}
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table-executive">
            <thead>
              <tr>
                <th>{t('Estado', 'Status')}</th>
                <th>{t('Meta / Empresa', 'Target / Company')}</th>
                <th>{t('Alcance', 'Scope')}</th>
                <th>{t('Base ➔ Obj', 'Base ➔ Target')}</th>
                <th>{t('Brecha', 'Gap')}</th>
                <th>{t('Avance vs Base', 'Progress vs Base')}</th>
                <th>{t('Resp. / Aprob.', 'Owner / Approver')}</th>
                <th>{t('Trazabilidad / Hitos', 'Traceability / Milestones')}</th>
              </tr>
            </thead>
            <tbody>
              {metasFiltradas.map(meta => {
                const baseStr = `${meta.emisionesBase.toLocaleString()} ${meta.unidad}`;
                const objStr = `${(meta.emisionesBase - meta.reduccionObjetivo).toLocaleString()} ${meta.unidad}`;
                const pctReduccion = ((meta.avanceAcumulado / meta.emisionesBase) * 100).toFixed(1);
                
                return (
                  <tr key={meta.id}>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--surface-container)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, color: getStatusColor(meta.estado) }}>
                        {getStatusIcon(meta.estado)}
                        {getStatusLabel(meta.estado)}
                      </div>
                      {meta.verificada && <p style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)', marginTop: '4px', textAlign: 'center', fontWeight: 600 }}>{t('VERIFICADA', 'VERIFIED')}</p>}
                    </td>
                    <td>
                      <p style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '0.9375rem', marginBottom: '2px' }}>{meta.nombre}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>{meta.empresa}</p>
                      <span style={{ display: 'inline-block', fontSize: '0.625rem', padding: '2px 6px', background: 'var(--surface-container-high)', borderRadius: '4px', marginTop: '4px', fontWeight: 600 }}>{meta.tipoMeta}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {meta.alcances.map(a => <span key={a} className={`alcance-pill-${a}`} style={{ padding: '2px 6px', fontSize: '0.625rem' }}>A{a}</span>)}
                      </div>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: '2px' }}>{meta.añoBase}: <strong>{baseStr}</strong></p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}>{meta.añoObjetivo}: <strong>{objStr}</strong></p>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--on-surface)' }}>{meta.reduccionObjetivo.toLocaleString()}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{meta.unidad} {t('a reducir', 'to reduce')}</p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)' }}>{pctReduccion}%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t('logrado', 'achieved')}</span>
                      </div>
                      <div style={{ width: '80px', height: '6px', background: 'var(--surface-container-high)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pctReduccion}%`, height: '100%', background: 'var(--primary)' }} />
                      </div>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface)', fontWeight: 600 }}>{meta.responsable.split(' ')[0]} {meta.responsable.split(' ')[1]}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Ap: {meta.aprobador}</p>
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {meta.hitos.slice(0, 2).map(h => (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '120px', color: h.estado === 'retrasado' ? 'var(--error)' : 'var(--on-surface)' }}>
                              • {h.nombre}
                            </span>
                            {h.evidencia ? <FileText size={12} color="var(--primary)" /> : <span style={{fontSize: '0.625rem', color:'var(--on-surface-variant)'}}>{h.fecha}</span>}
                          </div>
                        ))}
                        {meta.hitos.length > 2 && <p style={{ fontSize: '0.6875rem', color: 'var(--primary)', cursor: 'pointer', marginTop: '2px' }}>+ {meta.hitos.length - 2} {t('hitos', 'milestones')}</p>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {metasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
                    {t('No hay metas definidas que coincidan con los filtros aplicados.', 'No targets match the applied filters.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', margin: '1rem', background: 'var(--surface)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--on-surface)' }}>
              {t('Crear Nueva Meta de Reducción', 'Create New Reduction Target')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
              {t('Complete todos los campos requeridos según las especificaciones operativas.', 'Complete all required fields according to operational specifications.')}
            </p>

            <form onSubmit={async (e) => { 
                e.preventDefault(); 
                const form = e.target as HTMLFormElement;
                const newMeta = {
                  nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value,
                  empresa: (form.elements.namedItem('empresa') as HTMLSelectElement).value,
                  tipoMeta: (form.elements.namedItem('tipoMeta') as HTMLSelectElement).value,
                  estado: (form.elements.namedItem('estado') as HTMLSelectElement).value,
                  unidad: 'tCO2e', // Valor por defecto simplificado
                  alcances: [1], // Simplificado para la demostración
                  añoBase: Number((form.elements.namedItem('anoBase') as HTMLInputElement).value),
                  añoObjetivo: Number((form.elements.namedItem('anoObjetivo') as HTMLInputElement).value),
                  emisionesBase: Number((form.elements.namedItem('emiBase') as HTMLInputElement).value),
                  emisionesActuales: Number((form.elements.namedItem('emiActual') as HTMLInputElement).value),
                  reduccionObjetivo: Number((form.elements.namedItem('redObj') as HTMLInputElement).value),
                  avanceAcumulado: Number((form.elements.namedItem('redLograda') as HTMLInputElement).value),
                  proyeccionCierre: Number((form.elements.namedItem('proyCierre') as HTMLInputElement).value),
                  responsable: (form.elements.namedItem('responsable') as HTMLInputElement).value,
                  aprobador: (form.elements.namedItem('aprobador') as HTMLInputElement).value,
                  verificada: false,
                  ultimaRevision: new Date().toISOString().split('T')[0],
                  observaciones: (form.elements.namedItem('observaciones') as HTMLTextAreaElement).value,
                  impactoDirectorio: 'Creado por Usuario. Pendiente de evaluación.',
                  hitos: []
                };
                
                try {
                  await addDoc(collection(db, 'metas'), newMeta);
                  alert(t('Meta guardada en base de datos Firebase exitosamente.', 'Target successfully saved to Firebase database.'));
                  setShowModal(false);
                  fetchMetas(); // Refrescar metas
                } catch (error) {
                  console.error('Error adding document: ', error);
                  alert(t('Error guardando en BD. Revisa consola o usa entorno Demo.', 'Error saving to DB. Check console or use Demo env.'));
                }
              }}>
              <div className="modal-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Nombre de la meta', 'Target Name')}</label>
                  <input name="nombre" type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Razón social / Empresa', 'Company')}</label>
                  <select name="empresa" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
                    <option value="">{t('Seleccione...', 'Select...')}</option>
                    <option value="ADRetail Central">ADRetail Central</option>
                    <option value="ADElectronics">ADElectronics</option>
                    <option value="ADHome Style">ADHome Style</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Tipo de Meta', 'Target Type')}</label>
                  <select name="tipoMeta" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
                    <option value="Absoluta">{t('Absoluta', 'Absolute')}</option>
                    <option value="Intensidad">{t('Intensidad', 'Intensity')}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Alcances Incluidos', 'Included Scopes')}</label>
                  <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0' }}>
                    <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '4px' }}><input type="checkbox" defaultChecked /> 1</label>
                    <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '4px' }}><input type="checkbox" /> 2</label>
                    <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '4px' }}><input type="checkbox" /> 3</label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Año Base', 'Base Year')}</label>
                  <input name="anoBase" type="number" required placeholder={t('Ej: 2022', 'e.g., 2022')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Año Objetivo', 'Target Year')}</label>
                  <input name="anoObjetivo" type="number" required placeholder={t('Ej: 2030', 'e.g., 2030')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Emisiones Base (tCO₂e)', 'Base Emissions (tCO₂e)')}</label>
                  <input name="emiBase" type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Emisiones Actuales (tCO₂e)', 'Current Emissions (tCO₂e)')}</label>
                  <input name="emiActual" type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Reducción Objetivo', 'Target Reduction')}</label>
                  <input name="redObj" type="number" required placeholder="tCO2e o %" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Reducción Lograda Acumulada', 'Cumulative Achieved Reduction')}</label>
                  <input name="redLograda" type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Proyección al Cierre', 'Projection at Close')}</label>
                  <input name="proyCierre" type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Responsable', 'Owner')}</label>
                  <input name="responsable" type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Aprobador', 'Approver')}</label>
                  <input name="aprobador" type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Estado', 'Status')}</label>
                  <select name="estado" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
                    <option value="planificada">{t('Planificada', 'Planned')}</option>
                    <option value="en_ejecucion">{t('En Ejecución', 'In Progress')}</option>
                    <option value="en_riesgo">{t('En Riesgo', 'At Risk')}</option>
                    <option value="retrasada">{t('Retrasada', 'Delayed')}</option>
                    <option value="cumplida">{t('Cumplida', 'Completed')}</option>
                    <option value="verificada">{t('Verificada', 'Verified')}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Fecha de Revisión', 'Review Date')}</label>
                  <input type="date" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Evidencias Adjuntas', 'Attached Evidence')}</label>
                  <input type="file" multiple style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px dashed var(--outline-variant)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('Observaciones', 'Observations')}</label>
                <textarea name="observaciones" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)', resize: 'none' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-container-high)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                >
                  {t('Cancelar', 'Cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
                >
                  {t('Confirmar y Guardar', 'Confirm & Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
