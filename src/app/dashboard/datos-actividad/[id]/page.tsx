'use client';
import { use, useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { DatoActividad, Empresa } from '@/lib/types';
import Link from 'next/link';

export default function DatoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [dato, setDato] = useState<DatoActividad | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{cantidad: string, periodo: string, descripcion: string}>({ cantidad: '', periodo: '', descripcion: '' });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'datos_actividad', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = { id: docSnap.id, ...docSnap.data() } as DatoActividad;
        setDato(d);
        setEditForm({ cantidad: String(d.cantidad), periodo: d.periodo, descripcion: d.descripcion || '' });
        
        if (d.empresaId) {
          const empRef = doc(db, 'empresas', d.empresaId);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            setEmpresa({ id: empSnap.id, ...empSnap.data() } as Empresa);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching detail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteEvidence = async (pathToDelete: string) => {
    if (!dato || !dato.id || !confirm("¿Eliminar archivo de evidencia permanentemente?")) return;
    
    try {
      setSaving(true);
      // Borrar de storage
      const fileRef = ref(storage, pathToDelete);
      await deleteObject(fileRef);

      // Actualizar doc
      const updatedEvidencias = (dato.evidencias || []).filter(e => e.path !== pathToDelete);
      const docRef = doc(db, 'datos_actividad', dato.id);
      await updateDoc(docRef, { evidencias: updatedEvidencias });
      
      setDato({ ...dato, evidencias: updatedEvidencias });
    } catch (e) {
      console.error("Error deleting evidence:", e);
      alert("Error eliminando evidencia");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dato || !dato.id) return;
    
    try {
      setSaving(true);
      const nuevaCantidad = parseFloat(editForm.cantidad);
      const nuevaEmision = (nuevaCantidad * dato.factorValor) / 1000;

      let evidenciasArray = [...(dato.evidencias || [])];

      // Upload new files if any
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const timestamp = Date.now();
          const filePath = `evidencias/${dato.empresaId}/${timestamp}_${file.name}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          evidenciasArray.push({ name: file.name, url, path: filePath });
        }
      }

      const updates = {
        cantidad: nuevaCantidad,
        periodo: editForm.periodo,
        descripcion: editForm.descripcion,
        emisionCalculada_tCO2e: nuevaEmision,
        evidencias: evidenciasArray,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, 'datos_actividad', dato.id);
      await updateDoc(docRef, updates);

      setDato({ ...dato, ...updates });
      setIsEditing(false);
      setNewFiles([]);
    } catch (e) {
      console.error("Error updating doc:", e);
      alert("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--on-surface-variant)' }}>Cargando auditoría...</h1>
      </div>
    );
  }

  if (!dato) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Registro de emisión no encontrado</h1>
        <Link href="/dashboard/datos-actividad" className="btn-secondary">Volver al Módulo de Inventario</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header & Back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href="/dashboard/datos-actividad" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface-variant)', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.2s', padding: '4px 8px', marginLeft: '-8px', borderRadius: '4px' }} className="hover:bg-[rgba(25,28,30,0.05)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver a Fuentes de Emisión
        </Link>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Editar Registro
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Trazabilidad NCh-ISO 14064-1
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {isEditing ? 'Editar Auditoría' : 'Auditoría de Emisión'}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
          ID Rastreo Blockchain Demostrativo: <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--surface-container-high)', padding: '2px 6px', borderRadius: '4px' }}>{(dato.id || 'N/A').toUpperCase()}</span>
        </p>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="card-elevated animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>Cantidad ({dato.unidad})</label>
              <input type="number" step="any" min="0" required className="input-field" value={editForm.cantidad} onChange={e => setEditForm({...editForm, cantidad: e.target.value})} />
              {editForm.cantidad && !isNaN(parseFloat(editForm.cantidad)) && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '6px' }}>
                  Proyección: <strong>{((parseFloat(editForm.cantidad) * dato.factorValor) / 1000).toFixed(4)} tCO₂e</strong>
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>Período</label>
              <input type="month" required className="input-field" value={editForm.periodo} onChange={e => setEditForm({...editForm, periodo: e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>Descripción (opcional)</label>
            <textarea className="input-field" rows={2} value={editForm.descripcion} onChange={e => setEditForm({...editForm, descripcion: e.target.value})} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>Evidencias Adjuntas</label>
            {dato.evidencias && dato.evidencias.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                {dato.evidencias.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container-lowest)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                      <a href={ev.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{ev.name}</a>
                    </div>
                    <button type="button" onClick={() => handleDeleteEvidence(ev.path)} style={{ background: 'none', border: 'none', color: '#ba1a1a', cursor: 'pointer', padding: '4px' }} disabled={saving}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <input type="file" id="input-new-evidencia" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv" onChange={e => { if(e.target.files) setNewFiles(Array.from(e.target.files)); }} style={{ display: 'none' }} />
            <label htmlFor="input-new-evidencia" style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px dashed var(--outline)', padding: '8px 12px', borderRadius: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adjuntar nuevos archivos
            </label>
            {newFiles.length > 0 && (
              <ul style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--on-surface)' }}>
                {newFiles.map(f => <li key={f.name}>+ {f.name} (se subirá al guardar)</li>)}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => { setIsEditing(false); setNewFiles([]); }} className="btn-ghost" style={{ flex: 1 }} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={saving}>
              {saving ? 'Guardando cambios...' : 'Guardar Actualización'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card-elevated animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--surface-container)' }}>
            <div>
              <span className={`alcance-pill-${dato.alcance}`} style={{ marginBottom: '12px', display: 'inline-block' }}>Alcance {dato.alcance}</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', textTransform: 'capitalize' }}>
                {dato.categoria} {dato.descripcion ? `(${dato.descripcion})` : ''}
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
      )}

      {/* Evidencia Audit */}
      {!isEditing && (
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
             {dato.evidencias && dato.evidencias.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                 <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                   {dato.evidencias.length} archivo(s) adjunto(s)
                 </p>
                 {dato.evidencias.map((ev, i) => (
                   <a key={i} href={ev.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                     Descargar {ev.name}
                   </a>
                 ))}
               </div>
             ) : (
               <>
                 <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                   No hay archivos de respaldo adjuntos a este registro.
                 </p>
                 <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ marginTop: '12px' }}>Adjuntar evidencia</button>
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
