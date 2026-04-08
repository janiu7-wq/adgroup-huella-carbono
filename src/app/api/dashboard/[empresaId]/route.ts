import { NextRequest, NextResponse } from 'next/server';
import { EMPRESAS_DEMO, DATOS_ACTIVIDAD_DEMO } from '@/lib/demo-data';

/**
 * GET /api/dashboard/:empresaId
 * Retorna KPIs y data para gráficos de la empresa
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  const { empresaId } = await params;

  // En producción: consultar Firestore
  // Por ahora devuelve data demo
  const empresa = EMPRESAS_DEMO.find(e => e.id === empresaId);
  if (!empresa) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
  }

  const datos = DATOS_ACTIVIDAD_DEMO.filter(d => d.empresaId === empresaId);

  const alcance1 = datos.filter(d => d.alcance === 1).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance2 = datos.filter(d => d.alcance === 2).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const alcance3 = datos.filter(d => d.alcance === 3).reduce((s, d) => s + d.emisionCalculada_tCO2e, 0);
  const total = alcance1 + alcance2 + alcance3;

  const metaAnual = empresa.metaAnual_tCO2e ?? 0;
  const porcentajeReduccion = metaAnual > 0 ? parseFloat(((metaAnual - total) / metaAnual * 100).toFixed(1)) : 0;

  return NextResponse.json({
    empresaId,
    razonSocial: empresa.razonSocial,
    kpis: {
      totalEmisiones_tCO2e: parseFloat(total.toFixed(2)),
      alcance1_tCO2e: parseFloat(alcance1.toFixed(2)),
      alcance2_tCO2e: parseFloat(alcance2.toFixed(2)),
      alcance3_tCO2e: parseFloat(alcance3.toFixed(2)),
      metaAnual_tCO2e: metaAnual,
      porcentajeReduccion,
      cantidadDatos: datos.length,
    },
    scopeMix: [
      { name: 'Alcance 1', value: parseFloat(alcance1.toFixed(2)), color: '#003527' },
      { name: 'Alcance 2', value: parseFloat(alcance2.toFixed(2)), color: '#4059aa' },
      { name: 'Alcance 3', value: parseFloat(alcance3.toFixed(2)), color: '#D4AF37' },
    ],
    datos: datos.slice(0, 20),
  });
}
