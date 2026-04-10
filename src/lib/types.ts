/**
 * Tipos Firestore para ADGROUP Huella de Carbono
 * Schema basado en NCh-ISO 14064-1:2019 / GHG Protocol
 */

export interface Empresa {
  id: string;
  razonSocial: string;
  rut: string;
  rubro: string;
  instalaciones: Instalacion[];
  responsables: Responsable[];
  periodoReporte: string; // YYYY
  metaAnual_tCO2e?: number;
  logoUrl?: string;
  ventanillaUnica?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Instalacion {
  id: string;
  nombre: string;
  direccion: string;
  region: string;
  tipo: 'oficina' | 'bodega' | 'planta' | 'sucursal';
}

export interface Responsable {
  uid: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador' | 'auditor' | 'viewer';
}

export interface DatoActividad {
  id?: string;
  empresaId: string;
  alcance: 1 | 2 | 3;
  categoria: string;       // e.g. "Combustibles móviles"
  tipoFuente: string;      // e.g. "gasolina"
  cantidad: number;
  unidad: string;          // L, kWh, km, kg
  periodo: string;         // YYYY-MM
  factorId: string;
  emisionCalculada_tCO2e: number;
  emisionCalculada_kgCO2e: number;
  factorValor: number;
  factorFuente: string;
  gwpAplicado: number;
  trazabilidad: {
    formula: string;
    timestamp: string;
  };
  responsableUid: string;
  descripcion?: string;
  instalacionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FactorEmision {
  id: string;
  nombre: string;
  fuente: 'HuellaChile' | 'GHG' | 'climatiq' | 'personalizado';
  valor: number;
  unidad: string;
  año: number;
  alcance: 1 | 2 | 3;
  gas: 'CO2' | 'CH4' | 'N2O' | 'HFCs' | 'SF6';
  gwp: number;
  categoria: string;
  tipoActividad: string;
  activo: boolean;
}

export interface Meta {
  id?: string;
  empresaId: string;
  metaAnual_tCO2e: number;
  porcentajeReduccionObjetivo: number;
  lineaBase_tCO2e: number;
  lineaBaseAño: number;
  periodoHasta: string;  // YYYY
  iniciativas: Iniciativa[];
  selloObjetivo: 'Cuantificación' | 'Reducción' | 'Excelencia' | 'Neutralización';
  createdAt: string;
}

export interface Iniciativa {
  id: string;
  nombre: string;
  descripcion: string;
  reduccionEstimada_tCO2e: number;
  estado: 'planificada' | 'en_curso' | 'completada';
  fechaInicio: string;
  fechaFin: string;
}

export interface LogAuditoria {
  id?: string;
  accion: 'CREAR_DATO' | 'EDITAR_DATO' | 'ELIMINAR_DATO' | 'EXPORTAR_REPORTE' | 'LOGIN' | 'CAMBIO_FACTOR';
  usuarioUid: string;
  usuarioEmail: string;
  empresaId?: string;
  entidadId?: string;
  detalles: Record<string, unknown>;
  timestamp: string;
  ip?: string;
}

export interface DashboardKPIs {
  totalEmisiones_tCO2e: number;
  alcance1_tCO2e: number;
  alcance2_tCO2e: number;
  alcance3_tCO2e: number;
  porcentajeReduccion: number;
  metaAlcanzada: boolean;
  empresasActivas: number;
  sellosActivos: number;
  tendencia: 'alza' | 'baja' | 'estable';
  periodoActual: string;
}
