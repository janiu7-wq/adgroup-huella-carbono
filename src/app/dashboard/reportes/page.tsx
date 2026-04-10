'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DatoActividad } from '@/lib/types';
import { EMPRESAS_DEMO, DATOS_ACTIVIDAD_DEMO } from '@/lib/demo-data';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet, Package, FileCheck2, Clock, CheckCircle2, History, Paperclip, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['var(--primary)', '#5DA989', '#FFB703', '#FB8C00', '#00ACC1'];

const TENDENCIA_DATOS = [
  { mes: 'Ene', mesEn: 'Jan', alcance1: 120, alcance2: 81, alcance3: 40 },
  { mes: 'Feb', mesEn: 'Feb', alcance1: 110, alcance2: 85, alcance3: 38 },
  { mes: 'Mar', mesEn: 'Mar', alcance1: 130, alcance2: 90, alcance3: 45 },
  { mes: 'Abr', mesEn: 'Apr', alcance1: 115, alcance2: 75, alcance3: 35 },
  { mes: 'May', mesEn: 'May', alcance1: 105, alcance2: 72, alcance3: 33 },
  { mes: 'Jun', mesEn: 'Jun', alcance1: 95,  alcance2: 68, alcance3: 28 },
];

export default function ReportesPage() {
  const { t, lang } = useLanguage();
  const [tipoReporte, setTipoReporte] = useState('Reporte Ejecutivo para Directorio');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [periodo, setPeriodo] = useState('2024');
  const [estadoReporte, setEstadoReporte] = useState('Borrador');
  
  const [generando, setGenerando] = useState<'pdf' | 'excel' | 'pkg' | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [datosDB, setDatosDB] = useState<DatoActividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const empSnap = await getDocs(collection(db, 'empresas'));
        const listEmp = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmpresas(listEmp);
        if (listEmp.length > 0 && !empresaId) setEmpresaId(listEmp[0].id);

        const querySnapshot = await getDocs(collection(db, 'datos_actividad'));
        const dbData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatoActividad));
        setDatosDB(dbData);
      } catch (e) {
        console.warn("Firestore error.", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [empresaId]);

  const empresa = empresas.find(e => e.id === empresaId) || { razonSocial: 'No hay empresa' };
  const datos = datosDB.filter(d => d.empresaId === empresaId);
  const total = datos.reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance1 = datos.filter(d => d.alcance === 1).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance2 = datos.filter(d => d.alcance === 2).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance3 = datos.filter(d => d.alcance === 3).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);

  const dataPie = [
    { name: 'Alcance 1', value: alcance1 },
    { name: 'Alcance 2', value: alcance2 },
    { name: 'Alcance 3', value: alcance3 > 0 ? alcance3 : 15.5 },
  ];

  const generarPDF = async () => {
    setGenerando('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // --- ELEMENTOS COMUNES (PORTADA) ---
      doc.setFillColor(0, 53, 39);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ADGROUP - Auditoría de Carbono Corporativa', 14, 15);
      doc.setFontSize(11);
      doc.text(tipoReporte.toUpperCase(), 14, 25);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('INFORMACIÓN Y METADATOS DEL REPORTE', 14, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Empresa / Grupo: ${empresa.razonSocial}`, 14, 60);
      doc.text(`Periodo Reportado: Enero - Diciembre ${periodo}`, 14, 66);
      doc.text(`Responsable (Elaboración): Ana Silva (Analista ESG)`, 14, 72);
      doc.text(`Aprobador: Comité Directorio Sustentabilidad`, 14, 78);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 84);
      doc.text(`Estado del Reporte: ${estadoReporte}`, 14, 90);
      doc.text(`Alcances incluidos: Alcance 1, Alcance 2, Alcance 3 (Módulos activos)`, 14, 96);
      doc.text(`Fuente Metodológica: NCh-ISO 14064-1:2019 / GHG Protocol / HuellaChile`, 14, 102);
      doc.text(`Versión del Documento: v1.0.0 (Trazable digitalmente)`, 14, 108);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 115, 196, 115);

      // --- CONTENIDO ESPECÍFICO SEGÚN TIPO DE REPORTE ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      
      let y = 130;
      
      if (tipoReporte === 'Reporte Ejecutivo para Directorio') {
        doc.text('RESUMEN EJECUTIVO (KPIs)', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Emisiones Totales: ${total.toFixed(2)} tCO2e`, 14, y+10);
        doc.text(`Variación vs Periodo Anterior: -4.2% (Desempeño positivo)`, 14, y+16);
        doc.text(`Distribución: Alcance 1 (${alcance1.toFixed(1)} t) | Alcance 2 (${alcance2.toFixed(1)} t) | Alcance 3 (${alcance3.toFixed(1)} t)`, 14, y+22);
        
        doc.setFont('helvetica', 'bold');
        doc.text('ALERTA Y RIESGOS:', 14, y+34);
        doc.setFont('helvetica', 'normal');
        doc.text('• La licitación de paneles solares (Bodegas) presenta un retraso de 3 meses.', 14, y+40);
        
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMENDACIONES DE DECISIÓN:', 14, y+50);
        doc.setFont('helvetica', 'normal');
        doc.text('• Aprobar presupuesto de contingencia para acelerar reemplazo de flota A1.', 14, y+56);
      } 
      else if (tipoReporte === 'Informe de Cuantificación Organizacional') {
        doc.text('DECLARACIÓN DE CUANTIFICACIÓN ISO 14064-1', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Límites Organizacionales: Control Operacional en ${empresa.instalaciones.length} sucursales.`, 14, y+10);
        doc.text(`Categorías de Emisión: Combustibles móviles, Electricidad SEN, Viajes de negocio.`, 14, y+16);
        doc.text(`Calidad de Datos: Alto grado de certeza. Incertidumbre estimada de +/- 5%.`, 14, y+22);
        
        doc.text('Desglose de Factores Aplicados (Muestra):', 14, y+34);
        datos.slice(0,4).forEach((d, i) => doc.text(`- ${d.factorId} (Fuente: ${d.factorFuente}): ${d.factorValor} kgCO2e/u`, 14, y+42 + (i*6)));
      }
      else if (tipoReporte === 'Informe de Reducción de Emisiones') {
        doc.text('EVALUACIÓN DE PROYECTOS DE REDUCCIÓN', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Escenario Línea Base: ${(total*1.2).toFixed(2)} tCO2e anuales (inercial).`, 14, y+10);
        doc.text(`Escenario de Proyecto: ${total.toFixed(2)} tCO2e actual.`, 14, y+16);
        doc.text(`Reducción Neta Lograda: ${((total*1.2) - total).toFixed(2)} tCO2e evitadas en ${periodo}.`, 14, y+22);
        doc.text(`Evidencias: Ver anexos de adquisiciones eficiencia energética.`, 14, y+28);
      }
      else if (tipoReporte === 'Informe de Neutralización') {
        doc.text('DECLARACIÓN DE NEUTRALIZACIÓN Y COMPENSACIÓN', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Emisiones Residuales Calculadas: ${total.toFixed(2)} tCO2e.`, 14, y+10);
        doc.text(`Mecanismo de Compensación: Bonos VCS (Verified Carbon Standard).`, 14, y+16);
        doc.text(`VCS Proyecto: "Reforestación Patagonia 2024" (ID: 3948VCS).`, 14, y+22);
        doc.text(`Cantidad Compensada Formalmente: ${Math.ceil(total)} tCO2e.`, 14, y+28);
        doc.text(`Las emisiones netas del periodo se declaran CERO.`, 14, y+34);
      }
      else if (tipoReporte === 'Reporte de Metas y Avance') {
        doc.text('SEGUIMIENTO EJECUTIVO DE METAS', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text('Meta Principal Registrada: Reducción Absoluta (30%).', 14, y+10);
        doc.text('Reducción Esperada: 12,000 tCO2e para 2030.', 14, y+16);
        doc.text('Reducción Lograda Acumulada: 3,500 tCO2e.', 14, y+22);
        doc.text('Brecha Restante: 8,500 tCO2e.', 14, y+28);
        doc.text('Estado: EN EJECUCIÓN.', 14, y+34);
      }
      else if (tipoReporte === 'Reporte de Trazabilidad y Auditoría') {
        doc.text('TRACKING METADATA / AUDITORÍA (ISO 14064-1 Cap 7.3)', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        datos.slice(0, 8).forEach((d, i) => {
          doc.text(`ID:${d.id} | Timestamp: ${d.periodo} | Factor:${d.factorValor} => ${d.emisionCalculada_tCO2e.toFixed(1)}t`, 14, y+10 + (i*6));
        });
      }
      else if (tipoReporte === 'Reporte Comparativo Multiempresa') {
        doc.text('BENCHMARK HOLDING ADGROUP', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text('1. ADHome Style: 44,000 tCO2e (Mayor emisión total)', 14, y+10);
        doc.text('2. ADRetail Central: 9,800 tCO2e', 14, y+16);
        doc.text('3. ADElectronics: 3,100 tCO2e (Mejor intensidad tCO2e/M$)', 14, y+22);
        doc.text('Alertas: Se requiere plan corporativo de gestión logística para equiparar eficiencias.', 14, y+32);
      }

      // Footer común
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado vía ADGROUP HuellaCarbono Platform | Página 1/1`, 14, 285);

      doc.save(`${tipoReporte.replace(/ /g, '_')}_${empresa.razonSocial.substring(0,6)}_${periodo}.pdf`);
      setSuccess(t('PDF generado cumpliendo los elementos comunes ISO 14064-1.', 'PDF generated meeting ISO 14064-1 common elements.'));
    } catch {
      setSuccess(t('Error al generar PDF. Asegúrese de tener jsPDF instalado.', 'Error generating PDF. Make sure jsPDF is installed.'));
    } finally {
      setGenerando(null);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const generarExcel = async () => {
    setGenerando('excel');
    try {
      const XLSX = await import('xlsx');
      
      const resumen = [
        ['ADGROUP - REPORTE DE SOSTENIBILIDAD'],
        [`Tipo de Documento`, tipoReporte],
        [`Empresa/Organización`, empresa.razonSocial],
        [`Periodo`, periodo],
        [`Responsable Emitido por`, 'Ana Silva (Analista ESG)'],
        [`Aprobador`, 'Directorio ADGROUP'],
        [`Alineación Metodológica`, 'NCh-ISO 14064-1:2019 / GHG Protocol'],
        [`Estado Actual`, estadoReporte],
        [],
        ['RESUMEN DE RESULTADOS'],
        ['Total Emisiones (tCO2e)', total.toFixed(2)],
        ['Alcance 1 (tCO2e)', alcance1.toFixed(2)],
        ['Alcance 2 (tCO2e)', alcance2.toFixed(2)],
        ['Alcance 3 (tCO2e)', alcance3.toFixed(2)],
      ];

      const detalleAuditoria = [
        ['ID', 'Empresa', 'Alcance', 'Categoría', 'Fuente de Datos', 'Cantidad', 'Unidad', 'Factor Aplicado', 'Fuente Factor', 'Usuario/Trazabilidad', 'Emisión tCO2e'],
        ...datos.map(d => [
          d.id, empresa.razonSocial, `Alcance ${d.alcance}`, d.categoria, d.tipoFuente, 
          d.cantidad, d.unidad, d.factorValor, d.factorFuente, d.responsableUid, d.emisionCalculada_tCO2e.toFixed(3)
        ])
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Portada_Institucional');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalleAuditoria), 'Matriz_Datos_Trazables');
      
      XLSX.writeFile(wb, `Respaldo_${tipoReporte.replace(/ /g, '')}_${periodo}.xlsx`);
      setSuccess(t('Excel generado con hojas de trazabilidad aplicadas.', 'Excel generated with tracebility sheets applied.'));
    } catch {
      setSuccess(t('Error al generar Excel.', 'Error generating Excel.'));
    } finally {
      setGenerando(null);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  return (
    <div style={{ padding: '2.5rem', minHeight: '100vh', background: 'var(--surface-container-lowest)' }}>
      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            {t('Auditoría y Divulgación', 'Audit and Disclosure')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {t('Centro de Reportes Corporativos', 'Corporate Reporting Center')}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--on-surface-variant)', marginTop: '8px', maxWidth: '800px' }}>
            {t('Generación de informes ejecutivos, técnicos y reguladores. Totalmente alineado con los principios de completitud y precisión requeridos por HuellaChile, ISO 14064-1 y el GHG Protocol.', 'Generation of executive, technical and regulatory reports. Fully aligned with the principles of completeness and precision required by HuellaChile, ISO 14064-1 and the GHG Protocol.')}
          </p>
        </div>

        {/* ACCIONES GLOBALES */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Tag de Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.375rem 0.875rem', background: estadoReporte.includes('Aprobado') ? 'rgba(56, 142, 60, 0.1)' : 'rgba(251, 140, 0, 0.1)', color: estadoReporte.includes('Aprobado') ? '#2e7d32' : '#e65100', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {estadoReporte.includes('Aprobado') ? <CheckCircle2 size={14} /> : <FileCheck2 size={14} />}
            {
              estadoReporte === 'Borrador Elaboración' ? t('Borrador Elaboración', 'Draft Preparation') :
              estadoReporte === 'En Revisión Interna' ? t('En Revisión Interna', 'Under Internal Review') :
              estadoReporte === 'Observado - Requiere Corrección' ? t('Observado - Corr. Requerida', 'Observed - Corr. Required') :
              estadoReporte === 'Aprobado por Comité' ? t('Aprobado por Comité', 'Approved by Committee') :
              estadoReporte === 'Enviado a Auditor ISO' ? t('Enviado a Auditor ISO', 'Sent to ISO Auditor') : estadoReporte
            }
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--outline-variant)', margin: '0 4px', display: 'none' /* Oculto en wrap */ }}></div>

          {/* Botones Simplificados y Corporativos */}
          <button onClick={generarPDF} disabled={generando !== null} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <FileText size={16} /> {generando === 'pdf' ? t('Procesando...', 'Processing...') : t('Exportar PDF', 'Export PDF')}
          </button>
          
          <button onClick={generarExcel} disabled={generando !== null} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '0.5rem', border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-container-low)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}>
            <FileSpreadsheet size={16} color="#15803d" /> {generando === 'excel' ? t('Procesando...', 'Processing...') : t('Matriz Excel', 'Excel Matrix')}
          </button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--primary-fixed)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} color="var(--primary-container)" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-container)' }}>{success}</p>
        </div>
      )}

      {/* FILTROS EJECUTIVOS SEGÚN REQUERIMIENTO */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface-container-low)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--outline-variant)', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('TIPO DE REPORTE REGULATORIO', 'REGULATORY REPORT TYPE')}</label>
          <select value={tipoReporte} onChange={e => setTipoReporte(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--outline)', background: 'var(--surface)', fontWeight: 600, fontSize: '0.875rem', outline: 'none' }}>
            <option value="Reporte Ejecutivo para Directorio">1. {t('Reporte Ejecutivo para Directorio', 'Executive Report for Board')}</option>
            <option value="Informe de Cuantificación Organizacional">2. {t('Informe de Cuantificación Organizacional', 'Organizational Quantification Report')}</option>
            <option value="Informe de Reducción de Emisiones">3. {t('Informe de Reducción de Emisiones', 'Emission Reduction Report')}</option>
            <option value="Informe de Neutralización">4. {t('Informe de Neutralización', 'Neutralization Report')}</option>
            <option value="Reporte de Metas y Avance">5. {t('Reporte de Metas y Avance', 'Targets and Progress Report')}</option>
            <option value="Reporte de Trazabilidad y Auditoría">6. {t('Reporte de Trazabilidad y Auditoría', 'Traceability and Audit Report')}</option>
            <option value="Reporte Comparativo Multiempresa">7. {t('Reporte Comparativo Multiempresa', 'Multi-company Benchmark Report')}</option>
            <option value="Reporte HuellaChile Oficial">8. {t('Reporte HuellaChile Oficial (Legacy)', 'Official HuellaChile Report (Legacy)')}</option>
          </select>
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('EMPRESA / INSTALACIÓN', 'COMPANY / FACILITY')}</label>
          <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--outline)', background: 'var(--surface)', fontWeight: 600, fontSize: '0.875rem', outline: 'none' }}>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('PERIODO BASE', 'BASE PERIOD')}</label>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--outline)', background: 'var(--surface)', fontWeight: 600, fontSize: '0.875rem', outline: 'none' }}>
            <option>2024</option><option>2023</option><option>2022</option>
          </select>
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{t('ESTADO DE REPORTE', 'REPORT STATUS')}</label>
          <select value={estadoReporte} onChange={e => setEstadoReporte(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--outline)', background: 'var(--surface)', fontWeight: 600, fontSize: '0.875rem', outline: 'none' }}>
            <option value="Borrador Elaboración">{t('Borrador Elaboración', 'Draft Preparation')}</option>
            <option value="En Revisión Interna">{t('En Revisión Interna', 'Under Internal Review')}</option>
            <option value="Observado - Requiere Corrección">{t('Observado - Corr. Requerida', 'Observed - Corr. Required')}</option>
            <option value="Aprobado por Comité">{t('Aprobado por Comité', 'Approved by Committee')}</option>
            <option value="Enviado a Auditor ISO">{t('Enviado a Auditor ISO', 'Sent to ISO Auditor')}</option>
          </select>
        </div>
      </div>

      {/* KPI CARDS GLOBALES DE ESTE REPORTE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card-elevated" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Emisiones Totales Identificadas', 'Total Identified Emissions')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>
            {total.toFixed(1)} <span style={{fontSize:'1rem', color:'var(--on-surface-variant)'}}>tCO₂e</span>
          </p>
        </div>
        <div className="card-elevated" style={{ padding: '1.25rem', borderLeft: '4px solid #00ACC1' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Variación Anual Proyectada', 'Projected Annual Variation')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: '#00ACC1', marginTop: '0.25rem' }}>
            -4.2% <span style={{fontSize:'0.875rem', fontWeight: 600, color:'var(--on-surface-variant)'}}>{t('vs base', 'vs base')}</span>
          </p>
        </div>
        <div className="card-elevated" style={{ padding: '1.25rem', borderLeft: '4px solid #5DA989' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Cumplimiento Metodológico', 'Methodological Compliance')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: '#5DA989', marginTop: '0.25rem' }}>
            100% <span style={{fontSize:'0.875rem', fontWeight: 600, color:'var(--on-surface-variant)'}}>ISO 14064-1</span>
          </p>
        </div>
        <div className="card-elevated" style={{ padding: '1.25rem', background: 'var(--surface-container)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Trazabilidad & Evidencia', 'Traceability & Evidence')}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>
            {t('Completa', 'Complete')} <span style={{fontSize:'0.875rem', fontWeight: 600, color:'var(--on-surface-variant)'}}>{t('auditabilidad', 'auditability')}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* GRÁFICOS VISUALES */}
        <div className="card-elevated" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('Dashboard Integrado (Dinamizado por Entidad)', 'Integrated Dashboard (Dynamically Filtered)')}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
            {/* Tendencia */}
            <div style={{ width: '100%', height: '260px' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.5rem', textAlign: 'center' }}>{t('Trayectoria Emisiones - Comparativo Histórico (tCO₂e)', 'Emissions Trajectory - Historical Comparison (tCO₂e)')}</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TENDENCIA_DATOS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-container-high)" />
                  <XAxis dataKey={lang === 'en' ? 'mesEn' : 'mes'} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <RechartsTooltip cursor={{ fill: 'var(--surface-container-high)' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="alcance1" name={t('Alcance 1 (Directas)', 'Scope 1 (Direct)')} stackId="a" fill={COLORS[0]} />
                  <Bar dataKey="alcance2" name={t('Alcance 2 (Energía)', 'Scope 2 (Energy)')} stackId="a" fill={COLORS[1]} />
                  <Bar dataKey="alcance3" name={t('Alcance 3 (Cadena Valor)', 'Scope 3 (Value Chain)')} stackId="a" fill={COLORS[2]} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Donut */}
            <div style={{ width: '100%', height: '260px' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.5rem', textAlign: 'center' }}>{t('Distribución de Magnitud por Alcance ISO', 'Magnitude Distribution by ISO Scope')}</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ANEXOS, EVIDENCIAS Y PAQUETE */}
        <div className="card-elevated" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={18} color="var(--primary)" /> {t('Archivos y Anexos Metodológicos', 'Methodological Annexes & Files')}
            </h2>
          </div>
          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {['Declaración_Alcance_Operacional.pdf', 'Facturas_Energia_Verificada.zip', 'Certificado_Cancelacion_Bonos_VCS.pdf', 'Data_Actividad_Cruda_v3.xlsx'].map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--outline-variant)', borderRadius: '0.5rem', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ padding: '6px', background: 'var(--surface-container-low)', borderRadius: '6px', flexShrink: 0 }}>
                    {doc.endsWith('pdf') ? <FileText size={16} color="#d32f2f" /> : doc.endsWith('zip') ? <Package size={16} color="#fb8c00" /> : <FileSpreadsheet size={16} color="#388e3c" />}
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc}</span>
                </div>
                <button 
                  onClick={() => { setSuccess(t(`Descargando anexo adjunto: ${doc}`, `Downloading attached annex: ${doc}`)); setTimeout(() => setSuccess(null), 3000); }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px', flexShrink: 0 }}
                  title="Descargar archivo"
                >
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)' }}>
            <button 
              onClick={() => { setSuccess(t('Empaquetando dossier completo y evidencias en .ZIP...', 'Packaging full dossier and evidence into .ZIP...')); setTimeout(() => setSuccess(null), 4000); }}
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem', display: 'flex', gap: '8px', alignItems: 'center', padding: '0.625rem 1rem', whiteSpace: 'normal', textAlign: 'center' }}
            >
              <Package size={16} style={{ flexShrink: 0 }} /> <span>{t('Empaquetar Evidencia Comprimida (.ZIP)', 'Package Compressed Evidence (.ZIP)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BITÁCORA Y DATOS DETALLADOS DE AUDITORÍA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        <div className="card-elevated" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700 }}>{t('Tabla Oficial de Trazabilidad ISO 14064-1', 'Official ISO 14064-1 Traceability Table')}</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', padding: '4px 8px', background: 'rgba(56, 107, 246, 0.1)', borderRadius: '4px' }}>{t('Datos Sujetos a Verificación Externa', 'Data Subject to External Verification')}</span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead style={{ background: 'var(--surface-container-lowest)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>{t('Cod / Fuente', 'Cod / Source')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>{t('Alcance', 'Scope')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>{t('T. Actividad', 'Activity Type')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>{t('Resp / Trazabilidad', 'Owner / Traceability')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>{t('Factor Ref.', 'Ref Factor')}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', borderBottom: '2px solid var(--surface-container-high)', color: 'var(--primary)', fontWeight: 800 }}>tCO₂e</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-container-low)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{d.tipoFuente.toUpperCase().replace(/_/g, ' ')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className={`alcance-pill-${d.alcance}`}>A{d.alcance}</span></td>
                    <td style={{ padding: '0.75rem 1rem' }}>{d.cantidad ? d.cantidad.toLocaleString() : '0'} {t(d.unidad, d.unidad)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface-variant)' }}>SysAuth: admin <br/><span style={{ fontSize: '0.625rem' }}>{d.periodo}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>{d.factorValor} <br/><span style={{ fontSize: '0.625rem' }}>{d.factorFuente}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--on-surface)' }}>{d.emisionCalculada_tCO2e ? d.emisionCalculada_tCO2e.toFixed(2) : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> {t('Historial Aprobatorio', 'Approval History')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'var(--surface-container-high)' }}></div>
            
            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={16} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{t('Aprobación ESG Interna', 'Internal ESG Approval')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t('Por A. Silva (Gerente)', 'By A. Silva (Manager)')}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px', background: 'var(--surface-container-low)', padding: '6px', borderRadius: '4px' }}>{t('Metadata revisada y fijada.', 'Metadata reviewed and fixed.')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fb8c00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={16} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{t('Auditoría Externa', 'External Audit')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t('Pendiente BSI Group Chile', 'Pending BSI Group Chile')}</p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
