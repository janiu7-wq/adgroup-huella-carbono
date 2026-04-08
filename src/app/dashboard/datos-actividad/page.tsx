'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DATOS_ACTIVIDAD_DEMO, EMPRESAS_DEMO } from '@/lib/demo-data';
import { FACTORES_HUELLACHILE } from '@/lib/calculos-ghg';
import type { DatoActividad } from '@/lib/types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

type Alcance = 1 | 2 | 3;

const CATEGORIAS_ES: Record<Alcance, { key: string; label: string }[]> = {
  1: [
    { key: 'gasolina', label: 'Gasolina (vehículos)' },
    { key: 'diesel', label: 'Diesel (flota/maquinaria)' },
    { key: 'gas_natural_m3', label: 'Gas natural' },
    { key: 'glp', label: 'GLP' },
    { key: 'kerosene', label: 'Kerosene' },
  ],
  2: [
    { key: 'electricidad_sen', label: 'Electricidad SEN (red eléctrica Chile)' },
  ],
  3: [
    { key: 'vuelo_corto_haul', label: 'Vuelo corto alcance (<1500 km)' },
    { key: 'vuelo_largo_haul', label: 'Vuelo largo alcance (>1500 km)' },
    { key: 'papel_blanco', label: 'Papel de oficina' },
    { key: 'residuos_relleno', label: 'Residuos a relleno sanitario' },
    { key: 'agua_tratada', label: 'Agua tratada consumida' },
  ],
};

const CATEGORIAS_EN: Record<Alcance, { key: string; label: string }[]> = {
  1: [
    { key: 'gasolina', label: 'Gasoline (vehicles)' },
    { key: 'diesel', label: 'Diesel (fleet/machinery)' },
    { key: 'gas_natural_m3', label: 'Natural Gas' },
    { key: 'glp', label: 'LPG' },
    { key: 'kerosene', label: 'Kerosene' },
  ],
  2: [
    { key: 'electricidad_sen', label: 'SEN Electricity (Chilean grid)' },
  ],
  3: [
    { key: 'vuelo_corto_haul', label: 'Short-haul flight (<1500 km)' },
    { key: 'vuelo_largo_haul', label: 'Long-haul flight (>1500 km)' },
    { key: 'papel_blanco', label: 'Office Paper' },
    { key: 'residuos_relleno', label: 'Waste to landfill' },
    { key: 'agua_tratada', label: 'Treated water consumed' },
  ],
};

const UNIDADES: Record<string, string> = {
  gasolina: 'Litros', diesel: 'Litros', gas_natural_m3: 'm³', glp: 'Litros', kerosene: 'Litros',
  electricidad_sen: 'kWh', vuelo_corto_haul: 'pkm', vuelo_largo_haul: 'pkm',
  papel_blanco: 'kg', residuos_relleno: 'kg', agua_tratada: 'm³',
};

export default function DatosActividadPage() {
  const { t, lang } = useLanguage();
  const [datos, setDatos] = useState<DatoActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterAlcance, setFilterAlcance] = useState<string>('all');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all');
  const [explorarFactores, setExplorarFactores] = useState(false);
  const [evidenciaFiles, setEvidenciaFiles] = useState<File[]>([]);

  const fetchDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'datos_actividad'));
      const dbData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatoActividad));
      if (dbData.length > 0) {
        setDatos(dbData);
      } else {
        setDatos(DATOS_ACTIVIDAD_DEMO);
      }
    } catch (e) {
      console.warn("Firestore no configurado. Usando demo local.", e);
      setDatos(DATOS_ACTIVIDAD_DEMO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);
  
  const currentCategorias = lang === 'en' ? CATEGORIAS_EN : CATEGORIAS_ES;

  // Estado del formulario
  const [form, setForm] = useState({
    empresaId: '',
    alcance: 1 as Alcance,
    tipoFuente: '',
    fuenteEmision: '',
    bibliotecaFactores: 'huellachile',
    cantidad: '',
    periodo: new Date().toISOString().slice(0, 7),
    descripcion: '',
  });
  const [calculandoRealtime, setCalculandoRealtime] = useState(false);
  const [resultadoRealtime, setResultadoRealtime] = useState<{
    emision: number; factor: number; fuente: string; formula: string;
  } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [success, setSuccess] = useState(false);

  const factor = form.tipoFuente ? FACTORES_HUELLACHILE[form.tipoFuente as keyof typeof FACTORES_HUELLACHILE] : null;

  const calcularRealtime = async (cantidad: string, tipoFuente: string) => {
    if (!cantidad || !tipoFuente || parseFloat(cantidad) <= 0) {
      setResultadoRealtime(null);
      return;
    }
    setCalculandoRealtime(true);
    try {
      const res = await fetch('/api/calcular-emision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actividad: cantidad,
          tipo: tipoFuente,
          empresaId: form.empresaId || 'preview',
          periodo: form.periodo,
        }),
      });
      const data = await res.json();
      if (data.emision !== undefined) {
        setResultadoRealtime({
          emision: data.emision,
          factor: data.detalles.factor_utilizado,
          fuente: data.detalles.fuente_factor,
          formula: data.detalles.formula,
        });
      }
    } catch {
      // Fallback cálculo local
      if (factor) {
        const em = parseFloat(cantidad) * factor.valor / 1000;
        setResultadoRealtime({
          emision: parseFloat(em.toFixed(4)),
          factor: factor.valor,
          fuente: factor.fuente,
          formula: `${cantidad} × ${factor.valor} / 1000 = ${em.toFixed(4)} tCO₂e`,
        });
      }
    } finally {
      setCalculandoRealtime(false);
    }
  };

  const handleCantidadChange = (v: string) => {
    setForm(f => ({ ...f, cantidad: v }));
    calcularRealtime(v, form.tipoFuente);
  };

  const handleTipoFuenteChange = (v: string) => {
    setForm(f => ({ ...f, tipoFuente: v }));
    calcularRealtime(form.cantidad, v);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultadoRealtime) return;
    setGuardando(true);

    const nuevoDato = {
      empresaId: form.empresaId,
      alcance: form.alcance,
      tipoFuente: form.tipoFuente,
      categoria: form.fuenteEmision,
      cantidad: parseFloat(form.cantidad),
      unidad: UNIDADES[form.tipoFuente] || 'und',
      periodo: form.periodo,
      emisionCalculada_tCO2e: resultadoRealtime.emision,
      factorValor: resultadoRealtime.factor,
      factorFuente: resultadoRealtime.fuente,
      estado: 'ingresado'
    };

    try {
      await addDoc(collection(db, 'datos_actividad'), nuevoDato);
      await fetchDatos();
    } catch (error) {
      console.error('Error guardando documento:', error);
      alert(t('Error guardando en BD. Revisa consola o usa entorno Demo.', 'Error saving to DB. Check console or use demo env.'));
    }

    setGuardando(false);
    setSuccess(true);
    setShowForm(false);
    setResultadoRealtime(null);
    setExplorarFactores(false);
    setEvidenciaFiles([]);
    setForm({ empresaId: '', alcance: 1, tipoFuente: '', fuenteEmision: '', bibliotecaFactores: 'huellachile', cantidad: '', periodo: new Date().toISOString().slice(0, 7), descripcion: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  const datosFiltrados = datos.filter(d => {
    if (filterAlcance !== 'all' && d.alcance !== parseInt(filterAlcance)) return false;
    if (filterEmpresa !== 'all' && d.empresaId !== filterEmpresa) return false;
    return true;
  });

  const getNombreEmpresa = (id: string) => EMPRESAS_DEMO.find(e => e.id === id)?.razonSocial.split(' ')[0] ?? id;

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            {t('Módulo de Inventario', 'Inventory Module')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {t('Fuentes de Emisión', 'Emission Sources')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
            {t('Registro de fuentes de emisión por Alcance 1, 2 y 3 · GHG Protocol', 'Registration of emission sources by Scope 1, 2 and 3 · GHG Protocol')}
          </p>
        </div>
        <button id="btn-nuevo-dato" onClick={() => setShowForm(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t('Agregar Fuente de Emisión', 'Add Emission Source')}
        </button>
      </div>

      {success && (
        <div style={{ background: 'var(--primary-fixed)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-container)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-container)' }}>
            {t('Registro de fuente guardado correctamente y emisión calculada.', 'Source record successfully saved and emission calculated.')}
          </p>
        </div>
      )}

      {/* Modal Formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(25,28,30,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                  {t('Nueva fuente de emision', 'New Emission Source')}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  {t('El cálculo se realiza automáticamente al ingresar la cantidad.', 'Calculation is done automatically upon entering the quantity.')}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Empresa */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>{t('Empresa *', 'Company *')}</label>
                <select
                  className="input-field"
                  value={form.empresaId}
                  onChange={e => setForm(f => ({ ...f, empresaId: e.target.value }))}
                  required
                  id="select-empresa-form"
                >
                  <option value="">{t('Seleccionar empresa...', 'Select company...')}</option>
                  {EMPRESAS_DEMO.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
                </select>
              </div>

              {/* Alcance */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '8px' }}>{t('Alcance GHG *', 'GHG Scope *')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([1, 2, 3] as Alcance[]).map(a => (
                    <button
                      key={a}
                      type="button"
                      id={`btn-alcance-${a}`}
                      onClick={() => { setForm(f => ({ ...f, alcance: a, tipoFuente: '' })); setResultadoRealtime(null); }}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        background: form.alcance === a ? 'var(--primary)' : 'var(--surface-container)',
                        color: form.alcance === a ? 'white' : 'var(--on-surface-variant)',
                      }}
                    >
                      {t(`Alcance ${a}`, `Scope ${a}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de fuente */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>{t('Tipo de Fuente *', 'Source Type *')}</label>
                <select
                  className="input-field"
                  value={form.tipoFuente}
                  onChange={e => handleTipoFuenteChange(e.target.value)}
                  required
                  id="select-tipo-fuente"
                >
                  <option value="">{t('Seleccionar fuente...', 'Select source...')}</option>
                  {currentCategorias[form.alcance].map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                
                {/* Selector de bibliotecas (Toggle) */}
                <div style={{ marginTop: '0.75rem', background: 'var(--surface-container-lowest)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--surface-container)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="toggle-factores" 
                        checked={explorarFactores} 
                        onChange={e => setExplorarFactores(e.target.checked)} 
                        style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      <label htmlFor="toggle-factores" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer' }}>{t('Explorar factores', 'Explore factors')}</label>
                    </div>
                    {!explorarFactores && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>{t('Usando HuellaChile (por defecto)', 'Using HuellaChile (default)')}</span>
                    )}
                  </div>
                  
                  {explorarFactores && (
                    <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease' }}>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('Biblioteca Base', 'Base Library')}</label>
                      <select
                        className="input-field"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                        value={form.bibliotecaFactores}
                        onChange={e => setForm(f => ({ ...f, bibliotecaFactores: e.target.value }))}
                      >
                        <option value="huellachile">HuellaChile 2024 (MMA)</option>
                        <option value="epa">US EPA GHG Emission Factors (Próximamente)</option>
                        <option value="defra">DEFRA UK 2023 (Próximamente)</option>
                        <option value="ipcc">IPCC Emission Factor DB (Próximamente)</option>
                      </select>
                    </div>
                  )}
                </div>

                {factor && form.bibliotecaFactores === 'huellachile' && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--primary-container)', marginTop: '4px' }}>
                    {t('Factor:', 'Factor:')} <strong>{factor.valor} {factor.unidad}</strong> · {factor.fuente}
                  </p>
                )}
              </div>

              {/* Fuente de Emisión Descriptiva */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>{t('Fuente de emision *', 'Emission Source *')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('Ingrese un nombre descriptivo', 'Enter a descriptive name')}
                  value={form.fuenteEmision}
                  onChange={e => setForm(f => ({ ...f, fuenteEmision: e.target.value }))}
                  required
                  id="input-fuente-emision"
                />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                  {form.alcance === 1 && t('Ej: Camión patente XCVFSD, Grúa Horquilla Yale, Generador Planta 1', 'e.g., Truck license XCVFSD, Yale Forklift, Generator Plant 1')}
                  {form.alcance === 2 && t('Ej: Planta Quilicura, Oficina 901, E/S Paillaco', 'e.g., Quilicura Plant, Office 901, E/S Paillaco')}
                  {form.alcance === 3 && (
                    form.tipoFuente.includes('vuelo') ? t('Ej: Vuelo SCL-MIA Reserva XYZ123', 'e.g., Flight SCL-MIA Booking XYZ123') :
                    form.tipoFuente === 'papel_blanco' ? t('Ej: Lote resmas A4 - Factura 1054', 'e.g., A4 reams batch - Invoice 1054') :
                    form.tipoFuente === 'residuos_relleno' ? t('Ej: Retiro de basura semanal - Contenedor Norte', 'e.g., Weekly garbage pickup - North Container') :
                    form.tipoFuente === 'agua_tratada' ? t('Ej: Medidor de agua potable N° 321 Planta Quilicura', 'e.g., Drinking water meter N° 321 Quilicura Plant') :
                    t('Ej: Viaje a Antofagasta, Retiro Lote 4B', 'e.g., Trip to Antofagasta, Pickup Batch 4B')
                  )}
                </p>
              </div>

              {/* Cantidad y Período */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>
                    {t('Cantidad *', 'Quantity *')} {form.tipoFuente && `(${t(UNIDADES[form.tipoFuente] ?? 'unidad', UNIDADES[form.tipoFuente] ?? 'unit')})`}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input-field"
                    placeholder="0"
                    value={form.cantidad}
                    onChange={e => handleCantidadChange(e.target.value)}
                    required
                    id="input-cantidad"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>{t('Período *', 'Period *')}</label>
                  <input
                    type="month"
                    className="input-field"
                    value={form.periodo}
                    onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}
                    required
                    id="input-periodo"
                  />
                </div>
              </div>

              {/* Resultado en tiempo real */}
              {(calculandoRealtime || resultadoRealtime) && (
                <div style={{
                  background: calculandoRealtime ? 'var(--surface-container)' : 'var(--primary-fixed)',
                  borderRadius: '0.75rem',
                  padding: '1.125rem',
                  transition: 'all 0.3s ease',
                }}>
                  {calculandoRealtime ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', border: '2px solid var(--primary-container)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{t('Calculando emisión...', 'Calculating emission...')}</p>
                    </div>
                  ) : resultadoRealtime && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>{t('Emisión calculada', 'Calculated emission')}</p>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.02em' }}>
                          {resultadoRealtime.emision} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>tCO₂e</span>
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--primary)', lineHeight: 1.5 }}>
                        <strong>{t('Fórmula:', 'Formula:')}</strong> {resultadoRealtime.formula}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--primary)', marginTop: '2px' }}>
                        <strong>{t('Fuente factor:', 'Factor source:')}</strong> {resultadoRealtime.fuente}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Evidencia (Auditoría GHG) */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>
                  {t('Evidencia (Respaldos auditables según NCh-ISO 14064-1)', 'Evidence (Auditable backups according to ISO 14064-1)')}
                </label>
                <div style={{ border: '1px dashed var(--outline)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', background: 'var(--surface-container-lowest)' }}>
                  <input
                    type="file"
                    id="input-evidencia"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
                    onChange={e => {
                      if (e.target.files) {
                        setEvidenciaFiles(Array.from(e.target.files));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="input-evidencia" style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: 'middle', marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {t('Adjuntar facturas, fotos de medidor o planillas', 'Attach invoices, meter photos or spreadsheets')}
                  </label>
                  {evidenciaFiles.length > 0 && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {evidenciaFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'var(--surface-container)', borderRadius: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary-container)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface)' }}>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>{t('Descripción (opcional)', 'Description (optional)')}</label>
                <textarea
                  className="input-field"
                  placeholder={t('Notas adicionales sobre esta medición...', 'Additional notes on this measurement...')}
                  rows={2}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  id="textarea-descripcion"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>
                  {t('Cancelar', 'Cancel')}
                </button>
                <button
                  type="submit"
                  id="btn-guardar-dato"
                  className="btn-primary"
                  disabled={guardando || !resultadoRealtime}
                  style={{ flex: 2, justifyContent: 'center', opacity: (!resultadoRealtime || guardando) ? 0.6 : 1 }}
                >
                  {guardando ? t('Guardando...', 'Saving...') : `${t('Guardar', 'Save')} ${resultadoRealtime ? `(${resultadoRealtime.emision} tCO₂e)` : ''}`}
                </button>
              </div>
            </form>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}

      {/* Filtros y Tabla */}
      <div className="card-elevated" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <select
            id="filter-alcance"
            className="input-field"
            style={{ width: 'auto' }}
            value={filterAlcance}
            onChange={e => setFilterAlcance(e.target.value)}
          >
            <option value="all">{t('Todos los alcances', 'All scopes')}</option>
            <option value="1">{t('Alcance 1', 'Scope 1')}</option>
            <option value="2">{t('Alcance 2', 'Scope 2')}</option>
            <option value="3">{t('Alcance 3', 'Scope 3')}</option>
          </select>
          <select
            id="filter-empresa"
            className="input-field"
            style={{ width: 'auto' }}
            value={filterEmpresa}
            onChange={e => setFilterEmpresa(e.target.value)}
          >
            <option value="all">{t('Todas las empresas', 'All companies')}</option>
            {EMPRESAS_DEMO.map(e => <option key={e.id} value={e.id}>{e.razonSocial.split(' ')[0]}</option>)}
          </select>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', alignSelf: 'center', marginLeft: 'auto' }}>
            {datosFiltrados.length} {t('registros', 'records')}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>{t('Empresa', 'Company')}</th>
                <th>{t('Alcance', 'Scope')}</th>
                <th>{t('Fuente', 'Source')}</th>
                <th>{t('Cantidad', 'Quantity')}</th>
                <th>{t('Período', 'Period')}</th>
                <th>{t('Emisión (tCO₂e)', 'Emission (tCO₂e)')}</th>
                <th>{t('Factor · Fuente', 'Factor · Source')}</th>
                <th>{t('Trazabilidad', 'Traceability')}</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map(d => (
                <tr key={d.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8125rem' }}>
                      {getNombreEmpresa(d.empresaId)}
                    </span>
                  </td>
                  <td>
                    <span className={`alcance-pill-${d.alcance}`}>A{d.alcance}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}>
                    {d.tipoFuente.replace(/_/g, ' ')}
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500 }}>
                    {d.cantidad.toLocaleString('es-CL')} {d.unidad}
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}>{d.periodo}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-container)' }}>
                      {d.emisionCalculada_tCO2e.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                    {d.factorValor} · {d.factorFuente}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/datos-actividad/${d.id}`}
                      style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary-container)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {t('Ver →', 'View →')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
