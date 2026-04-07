// ─── Database / Prisma aligned types ───

export interface Sale {
  id: number;
  fecha: string; // "2025-01" format
  tiendaCodigo: number;
  upc: string;
  ventaPesos: number;
  unidades: number;
  // joined fields
  nombreProducto?: string;
  nombreTienda?: string;
  linea?: string;
  departamento?: string;
}

export interface Product {
  id: number;
  upc: string;
  nombreProducto: string;
  linea: string | null;
  departamento: string | null;
  descripcionDelikos: string | null;
}

export interface Store {
  id: number;
  codigoTienda: number;
  nombreTienda: string;
}

export interface Department {
  id: number;
  articulo: string;
  descripcionDelikos: string;
  movimiento: string; // linea de negocio
  departamento: string;
  ean13: string;
  descripcionMerco: string;
}

// ─── Aggregated / Computed types ───

export interface MonthlySummary {
  mes: string;
  ventaPesos: number;
  unidades: number;
  tiendas: number;
  skus: number;
}

export interface StorePerformance {
  codigoTienda: number;
  nombreTienda: string;
  ventaTotal: number;
  unidadesTotal: number;
  meses: number;
  skus: number;
  ventaPromedio: number;
  crecimientoMoM: number | null;
  ventaPorMes: Record<string, number>;
}

export interface ProductPerformance {
  upc: string;
  nombreProducto: string;
  linea: string;
  departamento: string;
  ventaTotal: number;
  unidadesTotal: number;
  tiendas: number;
  precioPromedio: number;
  tendencia: number[]; // monthly sales array for sparkline
  crecimientoMoM: number | null;
}

export interface LineaSummary {
  linea: string;
  ventaTotal: number;
  unidadesTotal: number;
  productos: number;
  porcentaje: number;
}

export interface Insight {
  tipo: 'alerta' | 'oportunidad' | 'info';
  titulo: string;
  descripcion: string;
  valor?: string;
  icono?: string;
}

export interface KPIData {
  label: string;
  valor: string;
  cambio?: number; // percentage change
  icono?: string;
  formato?: 'moneda' | 'numero' | 'porcentaje';
}

// ─── Filter types ───

export interface FilterState {
  periodo: string | null; // "2025-01" or null for all
  periodoInicio: string | null;
  periodoFin: string | null;
  linea: string | null;
  departamento: string | null;
  tienda: number | null;
}

export type FilterAction =
  | { type: 'SET_PERIODO'; payload: string | null }
  | { type: 'SET_PERIODO_RANGO'; payload: { inicio: string | null; fin: string | null } }
  | { type: 'SET_LINEA'; payload: string | null }
  | { type: 'SET_DEPARTAMENTO'; payload: string | null }
  | { type: 'SET_TIENDA'; payload: number | null }
  | { type: 'RESET' };

// ─── API response types ───

export interface DashboardData {
  kpis: KPIData[];
  tendenciaMensual: MonthlySummary[];
  mixLineas: LineaSummary[];
  topTiendas: StorePerformance[];
  insights: Insight[];
}

export interface EnrichedSale extends Sale {
  nombreProducto: string;
  nombreTienda: string;
  linea: string;
  departamento: string;
}
