/**
 * Data demo ADGROUP - simula holding con empresas reales
 * Usado en modo sin Firebase configurado
 */
import { Empresa, DatoActividad, FactorEmision, Meta } from './types';

export const EMPRESAS_DEMO: Empresa[] = [
  {
    id: 'adtrans-001',
    razonSocial: 'ADTRANS Distribución SpA',
    rut: '76.123.456-7',
    rubro: 'Transporte y Logística',
    instalaciones: [
      { id: 'i1', nombre: 'Bodega Central Santiago', direccion: 'Av. Las Industrias 1234', region: 'RM', tipo: 'bodega' },
      { id: 'i2', nombre: 'Sucursal Valparaíso', direccion: 'Av. Puerto 567', region: 'Valparaíso', tipo: 'sucursal' },
    ],
    responsables: [],
    periodoReporte: '2024',
    metaAnual_tCO2e: 850,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'adlogistic-002',
    razonSocial: 'ADLOGISTIC Chile S.A.',
    rut: '76.234.567-8',
    rubro: 'Logística y Almacenamiento',
    instalaciones: [
      { id: 'i3', nombre: 'Centro de Distribución Quilicura', direccion: 'Av. Industrial 890', region: 'RM', tipo: 'planta' },
    ],
    responsables: [],
    periodoReporte: '2024',
    metaAnual_tCO2e: 620,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'adserv-003',
    razonSocial: 'ADSERV Servicios Corporativos Ltda.',
    rut: '76.345.678-9',
    rubro: 'Servicios Empresariales',
    instalaciones: [
      { id: 'i4', nombre: 'Oficinas Las Condes', direccion: 'Av. El Bosque 123', region: 'RM', tipo: 'oficina' },
    ],
    responsables: [],
    periodoReporte: '2024',
    metaAnual_tCO2e: 180,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'adtech-004',
    razonSocial: 'ADTECH Soluciones SpA',
    rut: '76.456.789-0',
    rubro: 'Tecnología e Innovación',
    instalaciones: [
      { id: 'i5', nombre: 'HQ Providencia', direccion: 'Av. Ricardo Lyon 456', region: 'RM', tipo: 'oficina' },
    ],
    responsables: [],
    periodoReporte: '2024',
    metaAnual_tCO2e: 95,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

export const DATOS_ACTIVIDAD_DEMO: DatoActividad[] = [
  // ADTRANS - Alcance 1 (Diesel flota)
  { id: 'd1', empresaId: 'adtrans-001', alcance: 1, categoria: 'Combustibles móviles', tipoFuente: 'diesel', cantidad: 45000, unidad: 'L', periodo: '2024-01', factorId: 'diesel', emisionCalculada_tCO2e: 120.6, emisionCalculada_kgCO2e: 120600, factorValor: 2.68, factorFuente: 'HuellaChile 2024', gwpAplicado: 1, trazabilidad: { formula: '45000 × 2.68 × 1 / 1000 = 120.6 tCO₂e', timestamp: '2024-02-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'd2', empresaId: 'adtrans-001', alcance: 1, categoria: 'Combustibles móviles', tipoFuente: 'diesel', cantidad: 42000, unidad: 'L', periodo: '2024-02', factorId: 'diesel', emisionCalculada_tCO2e: 112.56, emisionCalculada_kgCO2e: 112560, factorValor: 2.68, factorFuente: 'HuellaChile 2024', gwpAplicado: 1, trazabilidad: { formula: '42000 × 2.68 × 1 / 1000 = 112.56 tCO₂e', timestamp: '2024-03-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  // ADTRANS - Alcance 2 (Electricidad)
  { id: 'd3', empresaId: 'adtrans-001', alcance: 2, categoria: 'Electricidad comprada', tipoFuente: 'electricidad_sen', cantidad: 180000, unidad: 'kWh', periodo: '2024-01', factorId: 'electricidad_sen', emisionCalculada_tCO2e: 73.57, emisionCalculada_kgCO2e: 73566, factorValor: 0.4087, factorFuente: 'CNE/HuellaChile 2024', gwpAplicado: 1, trazabilidad: { formula: '180000 × 0.4087 × 1 / 1000 = 73.57 tCO₂e', timestamp: '2024-02-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  // ADLOGISTIC - Alcance 1
  { id: 'd4', empresaId: 'adlogistic-002', alcance: 1, categoria: 'Combustibles móviles', tipoFuente: 'diesel', cantidad: 28000, unidad: 'L', periodo: '2024-01', factorId: 'diesel', emisionCalculada_tCO2e: 75.04, emisionCalculada_kgCO2e: 75040, factorValor: 2.68, factorFuente: 'HuellaChile 2024', gwpAplicado: 1, trazabilidad: { formula: '28000 × 2.68 × 1 / 1000 = 75.04 tCO₂e', timestamp: '2024-02-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  // ADSERV - Alcance 3 (Vuelos)
  { id: 'd5', empresaId: 'adserv-003', alcance: 3, categoria: 'Viajes de negocio', tipoFuente: 'vuelo_corto_haul', cantidad: 45000, unidad: 'pkm', periodo: '2024-01', factorId: 'vuelo_corto_haul', emisionCalculada_tCO2e: 11.48, emisionCalculada_kgCO2e: 11475, factorValor: 0.255, factorFuente: 'GHG Protocol 2024', gwpAplicado: 1, trazabilidad: { formula: '45000 × 0.255 × 1 / 1000 = 11.48 tCO₂e', timestamp: '2024-02-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  // ADTECH - Alcance 2
  { id: 'd6', empresaId: 'adtech-004', alcance: 2, categoria: 'Electricidad comprada', tipoFuente: 'electricidad_sen', cantidad: 95000, unidad: 'kWh', periodo: '2024-01', factorId: 'electricidad_sen', emisionCalculada_tCO2e: 38.83, emisionCalculada_kgCO2e: 38826, factorValor: 0.4087, factorFuente: 'CNE/HuellaChile 2024', gwpAplicado: 1, trazabilidad: { formula: '95000 × 0.4087 × 1 / 1000 = 38.83 tCO₂e', timestamp: '2024-02-01T00:00:00Z' }, responsableUid: 'demo', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
];

export const METAS_DEMO: Meta[] = [
  {
    id: 'm1', empresaId: 'adtrans-001', metaAnual_tCO2e: 850, porcentajeReduccionObjetivo: 25,
    lineaBase_tCO2e: 1133, lineaBaseAño: 2022, periodoHasta: '2025',
    selloObjetivo: 'Reducción',
    iniciativas: [
      { id: 'in1', nombre: 'Renovación flota eléctrica', descripcion: '5 camiones eléctricos Q3 2024', reduccionEstimada_tCO2e: 180, estado: 'en_curso', fechaInicio: '2024-01-01', fechaFin: '2024-09-30' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Datos mensuales para gráfico de tendencia
export const TENDENCIA_HOLDING_DEMO = [
  { mes: 'Ene', alcance1: 210.4, alcance2: 118.2, alcance3: 28.5, total: 357.1 },
  { mes: 'Feb', alcance1: 195.8, alcance2: 112.6, alcance3: 26.1, total: 334.5 },
  { mes: 'Mar', alcance1: 220.3, alcance2: 125.3, alcance3: 31.4, total: 377.0 },
  { mes: 'Abr', alcance1: 202.1, alcance2: 108.9, alcance3: 24.8, total: 335.8 },
  { mes: 'May', alcance1: 185.6, alcance2: 102.4, alcance3: 22.3, total: 310.3 },
  { mes: 'Jun', alcance1: 178.9, alcance2: 98.7, alcance3: 19.8, total: 297.4 },
  { mes: 'Jul', alcance1: 172.4, alcance2: 95.2, alcance3: 18.9, total: 286.5 },
  { mes: 'Ago', alcance1: 168.3, alcance2: 91.8, alcance3: 18.2, total: 278.3 },
  { mes: 'Sep', alcance1: 165.7, alcance2: 89.4, alcance3: 17.6, total: 272.7 },
  { mes: 'Oct', alcance1: 160.2, alcance2: 86.9, alcance3: 17.1, total: 264.2 },
  { mes: 'Nov', alcance1: 155.8, alcance2: 84.3, alcance3: 16.5, total: 256.6 },
  { mes: 'Dic', alcance1: 150.1, alcance2: 81.2, alcance3: 15.9, total: 247.2 },
];
