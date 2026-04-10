'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Empresa, DatoActividad } from '@/lib/types';
import { EMPRESAS_DEMO, DATOS_ACTIVIDAD_DEMO } from '@/lib/demo-data';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EmpresasPage() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [form, setForm] = useState({ razonSocial: '', rut: '', rubro: '', instalaciones: 1, adminEmail: '', ventanillaUnica: '' });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  const [empresasDB, setEmpresasDB] = useState<Empresa[]>([]);
  const [datosDB, setDatosDB] = useState<DatoActividad[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Firestore
  const fetchAll = async () => {
    try {
      const respEmpresas = await getDocs(collection(db, 'empresas'));
      const listE = respEmpresas.docs.map(d => ({ id: d.id, ...d.data() } as Empresa));
      setEmpresasDB(listE);

      const respDatos = await getDocs(collection(db, 'datos_actividad'));
      const listD = respDatos.docs.map(d => ({ id: d.id, ...d.data() } as DatoActividad));
      setDatosDB(listD);
    } catch (e) {
      console.warn("Firestore offline - Fallback demo (Empresas)", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    
    try {
      const payload = {
        razonSocial: form.razonSocial,
        rut: form.rut,
        rubro: form.rubro,
        instalaciones: Array.from({ length: form.instalaciones }).map((_, i) => ({
          id: `inst-${Date.now()}-${i}`,
          nombre: `Sede ${i + 1}`,
          direccion: 'No definida',
          region: 'RM',
          tipo: 'oficina'
        })),
        responsables: [{
          uid: 'uuid',
          nombre: form.adminEmail.split('@')[0],
          email: form.adminEmail,
          rol: 'admin'
        }],
        metaAnual_tCO2e: 1000,
        periodoReporte: '2024',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editandoId) {
        await updateDoc(doc(db, 'empresas', editandoId), payload);
      } else {
        await addDoc(collection(db, 'empresas'), payload);
      }
      
      await fetchAll();
      setSuccess(true);
      setShowForm(false);
      setEditandoId(null);
      setLogoFile(null);
      setForm({ razonSocial: '', rut: '', rubro: '', instalaciones: 1, adminEmail: '', ventanillaUnica: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error al guardar empresa:", error);
      alert(t("Error al guardar la empresa. Revisa la consola.", "Error registering company."));
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (empresa: Empresa, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({
      razonSocial: empresa.razonSocial,
      rut: empresa.rut,
      rubro: empresa.rubro,
      instalaciones: empresa.instalaciones?.length || 1,
      adminEmail: empresa.responsables?.[0]?.email || '',
      ventanillaUnica: empresa.ventanillaUnica || ''
    });
    setEditandoId(empresa.id);
    setShowForm(true);
    setMenuAbierto(null);
  };

  const handleEliminar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.', 'Are you sure you want to delete this company? This cannot be undone.'))) return;
    try {
      await deleteDoc(doc(db, 'empresas', id));
      await fetchAll();
    } catch (error) {
      console.error("Error al eliminar empresa:", error);
      alert(t("Error al eliminar empresa.", "Error deleting company."));
    }
    setMenuAbierto(null);
  };

  const empresasFiltradas = empresasDB.filter(e =>
    e.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    e.rut.includes(search) ||
    e.rubro.toLowerCase().includes(search.toLowerCase())
  );

  const getKPIEmpresa = (id: string) => {
    const datos = datosDB.filter(d => d.empresaId === id);
    const total = datos.reduce((s, d) => s + (d.emisionCalculada_tCO2e || 0), 0);
    return { total: total.toFixed(2), datos: datos.length };
  };

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Holding ADGROUP
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {t('Portafolio de Empresas', 'Companies Portfolio')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
            {empresasDB.length} {t('razones sociales', 'business units')} · {t('Período de reporte 2024', 'Reporting period 2024')}
          </p>
        </div>
        <button id="btn-nueva-empresa" onClick={() => { setEditandoId(null); setForm({ razonSocial: '', rut: '', rubro: '', instalaciones: 1, adminEmail: '', ventanillaUnica: '' }); setShowForm(true); }} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t('Nueva Empresa', 'New Company')}
        </button>
      </div>

      {success && (
        <div style={{ background: 'var(--primary-fixed)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-container)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-container)' }}>{t('Operación exitosa en el portafolio.', 'Successful operation in the portfolio.')}</p>
        </div>
      )}

      {/* Modal Formulario Empresa */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(25,28,30,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '1.25rem', width: '100%', maxWidth: '500px', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)' }}>{editandoId ? t('Editar Empresa', 'Edit Company') : t('Nueva Empresa', 'New Company')}</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{editandoId ? t('Modificar datos filial.', 'Modify subsidiary data.') : t('Añadir filial al Portafolio ADGROUP.', 'Add subsidiary to ADGROUP Portfolio.')}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Razón Social *', 'Company Name *')}</label>
                <input required className="input-field" placeholder="Ej. Adlogistics S.A" value={form.razonSocial} onChange={e => setForm(f => ({ ...f, razonSocial: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('ID Fiscal (RUT) *', 'Tax ID (RUT) *')}</label>
                  <input required className="input-field" placeholder="7X.XXX.XXX-X" value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Rubro *', 'Industry *')}</label>
                  <input required className="input-field" placeholder={t('Transporte', 'Transport')} value={form.rubro} onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Cant. Instalaciones', 'Facilities Count')}</label>
                  <input type="number" min="1" required className="input-field" value={form.instalaciones} onChange={e => setForm(f => ({ ...f, instalaciones: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Email Responsable *', 'Manager Email *')}</label>
                  <input type="email" required className="input-field" placeholder="gerente@adgroup.cl" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Nº Establecimiento Ventanilla Única (RETC)', 'Facility Registry Number (RETC)')}</label>
                <input required className="input-field" placeholder={t('Identificador gubernamental', 'Government identifier')} value={form.ventanillaUnica} onChange={e => setForm(f => ({ ...f, ventanillaUnica: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.25rem' }}>🏢</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>{t('Logo Corporativo (Opcional)', 'Corporate Logo (Optional)')}</label>
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="input-field" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>{t('Cancelar', 'Cancel')}</button>
                <button type="submit" disabled={guardando} className="btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: guardando ? 0.6 : 1 }}>
                  {guardando ? t('Guardando...', 'Saving...') : (editandoId ? t('Actualizar Empresa', 'Update Company') : t('Registrar Empresa', 'Register Company'))}
                </button>
              </div>
            </form>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}

      {/* Buscador */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="search-empresas"
          type="text"
          className="input-field"
          placeholder={t('Buscar por razón social, RUT o rubro...', 'Search by company name, ID or industry...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Cards de empresas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {empresasFiltradas.map((empresa, i) => {
          const kpi = getKPIEmpresa(empresa.id);
          const pct = empresa.metaAnual_tCO2e
            ? Math.min(100, parseFloat(((parseFloat(kpi.total) / empresa.metaAnual_tCO2e) * 100).toFixed(0)))
            : 0;

          return (
            <div
              key={empresa.id}
              className="card-elevated animate-fade-in"
              style={{ padding: '1.5rem', animationDelay: `${i * 0.05}s`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(25,28,30,0.08)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
            >
              {/* Header empresa */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px',
                    background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: 'white' }}>
                      {empresa.razonSocial.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.2 }}>
                      {empresa.razonSocial}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                      {empresa.rut} · {empresa.rubro}
                    </p>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === empresa.id ? null : empresa.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--on-surface-variant)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                  {menuAbierto === empresa.id && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', padding: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '120px' }}>
                      <button onClick={(e) => handleEditar(empresa, e)} style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface)', borderRadius: '0.375rem' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-container)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        {t('Editar', 'Edit')}
                      </button>
                      <button onClick={(e) => handleEliminar(empresa.id, e)} style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: '#D32F2F', borderRadius: '0.375rem' }} onMouseOver={e => e.currentTarget.style.background = '#FFEBEE'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        {t('Eliminar', 'Delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.875rem', background: 'var(--surface-container-low)', borderRadius: '0.625rem' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('Emisiones totales', 'Total emissions')}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{kpi.total}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>tCO₂e</p>
                </div>
                <div style={{ padding: '0.875rem', background: 'var(--surface-container-low)', borderRadius: '0.625rem' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('Fuentes de emisión', 'Emission sources')}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.02em' }}>{kpi.datos}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{t('registros', 'records')}</p>
                </div>
              </div>

              {/* Progreso meta */}
              {empresa.metaAnual_tCO2e && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t('vs. Meta anual', 'vs. Annual Target')} ({empresa.metaAnual_tCO2e} tCO₂e)</p>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: pct > 100 ? 'var(--error)' : 'var(--primary-container)' }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'var(--surface-container)', borderRadius: '999px', height: '6px' }}>
                    <div style={{ background: pct > 100 ? 'var(--error)' : 'var(--primary-container)', height: '6px', borderRadius: '999px', width: `${Math.min(pct, 100)}%`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )}

              <Link
                href={`/dashboard/empresas/${empresa.id}`}
                id={`btn-ver-empresa-${empresa.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-container)', textDecoration: 'none' }}
              >
                {t('Ver dashboard empresa →', 'View company dashboard →')}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
