import { NextRequest, NextResponse } from 'next/server';
import { calcularEmision, FACTORES_HUELLACHILE } from '@/lib/calculos-ghg';

/**
 * POST /api/calcular-emision
 * Body: { actividad, unidad, tipo, factorFuente, periodo, empresaId }
 * Returns: { emision_tCO2e, emision_kgCO2e, factor, fuente, trazabilidad }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actividad, unidad, tipo, empresaId, periodo, factorPersonalizado } = body;

    if (!actividad || !tipo || !empresaId) {
      return NextResponse.json({ error: 'Campos requeridos: actividad, tipo, empresaId' }, { status: 400 });
    }

    const resultado = await calcularEmision({
      cantidad: parseFloat(actividad),
      tipoActividad: tipo,
      unidad: unidad ?? 'unidad',
      periodo: periodo ?? new Date().toISOString().slice(0, 7),
      empresaId,
      factorPersonalizado: factorPersonalizado ? parseFloat(factorPersonalizado) : undefined,
    });

    return NextResponse.json({
      emision: resultado.emision_tCO2e,
      emision_kg: resultado.emision_kgCO2e,
      unidad: 'tCO₂e',
      alcance: resultado.alcance,
      detalles: {
        factor_utilizado: resultado.factor_utilizado,
        fuente_factor: resultado.fuente_factor,
        gwp_aplicado: resultado.gwp_aplicado,
        formula: resultado.trazabilidad.formula,
        timestamp: resultado.trazabilidad.timestamp,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de cálculo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/calcular-emision
 * Retorna listado de factores disponibles (útil para dropdowns)
 */
export async function GET() {
  const factores = Object.entries(FACTORES_HUELLACHILE).map(([key, f]) => ({
    id: key,
    nombre: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    valor: f.valor,
    unidad: f.unidad,
    alcance: f.alcance,
    fuente: f.fuente,
  }));

  return NextResponse.json({ factores });
}
