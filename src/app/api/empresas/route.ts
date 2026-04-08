import { NextResponse } from 'next/server';
import { EMPRESAS_DEMO } from '@/lib/demo-data';

/**
 * GET /api/empresas
 * Retorna lista de empresas del holding ADGROUP
 */
export async function GET() {
  // En producción: const snapshot = await db.collection('empresas').get();
  return NextResponse.json({ empresas: EMPRESAS_DEMO });
}
