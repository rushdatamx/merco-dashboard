import { prisma } from './prisma';
import type { EnrichedSale, MonthlySummary, StorePerformance, ProductPerformance, LineaSummary } from './types';

// ─── Enriched sales with joins ───

export async function getEnrichedSales(filters?: {
  fechaInicio?: string;
  fechaFin?: string;
  linea?: string;
  departamento?: string;
  tiendaCodigo?: number;
}): Promise<EnrichedSale[]> {
  const where: Record<string, unknown> = {};

  if (filters?.fechaInicio && filters?.fechaFin) {
    where.fecha = { gte: filters.fechaInicio, lte: filters.fechaFin };
  } else if (filters?.fechaInicio) {
    where.fecha = { gte: filters.fechaInicio };
  } else if (filters?.fechaFin) {
    where.fecha = { lte: filters.fechaFin };
  }

  if (filters?.tiendaCodigo) {
    where.tiendaCodigo = filters.tiendaCodigo;
  }

  if (filters?.linea || filters?.departamento) {
    where.product = {};
    if (filters.linea) (where.product as Record<string, unknown>).linea = filters.linea;
    if (filters.departamento) (where.product as Record<string, unknown>).departamento = filters.departamento;
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      product: true,
      store: true,
    },
    orderBy: { fecha: 'asc' },
  });

  return sales.map((s) => ({
    id: s.id,
    fecha: s.fecha,
    tiendaCodigo: s.tiendaCodigo,
    upc: s.upc,
    ventaPesos: s.ventaPesos,
    unidades: s.unidades,
    nombreProducto: s.product.nombreProducto,
    nombreTienda: s.store.nombreTienda,
    linea: s.product.linea || 'Otros',
    departamento: s.product.departamento || 'Sin departamento',
  }));
}

// ─── Monthly summary ───

export async function getMonthlySummary(filters?: {
  linea?: string;
  departamento?: string;
  tiendaCodigo?: number;
}): Promise<MonthlySummary[]> {
  const sales = await getEnrichedSales(filters);

  const byMonth = new Map<string, { pesos: number; unidades: number; tiendas: Set<number>; skus: Set<string> }>();

  for (const s of sales) {
    let m = byMonth.get(s.fecha);
    if (!m) {
      m = { pesos: 0, unidades: 0, tiendas: new Set(), skus: new Set() };
      byMonth.set(s.fecha, m);
    }
    m.pesos += s.ventaPesos;
    m.unidades += s.unidades;
    m.tiendas.add(s.tiendaCodigo);
    m.skus.add(s.upc);
  }

  return Array.from(byMonth.entries())
    .map(([mes, d]) => ({
      mes,
      ventaPesos: d.pesos,
      unidades: d.unidades,
      tiendas: d.tiendas.size,
      skus: d.skus.size,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

// ─── Store performance ───

export async function getStorePerformance(filters?: {
  fechaInicio?: string;
  fechaFin?: string;
  linea?: string;
}): Promise<StorePerformance[]> {
  const sales = await getEnrichedSales(filters);

  const byStore = new Map<number, {
    nombre: string;
    pesos: number;
    unidades: number;
    meses: Set<string>;
    skus: Set<string>;
    ventaPorMes: Map<string, number>;
  }>();

  for (const s of sales) {
    let st = byStore.get(s.tiendaCodigo);
    if (!st) {
      st = { nombre: s.nombreTienda, pesos: 0, unidades: 0, meses: new Set(), skus: new Set(), ventaPorMes: new Map() };
      byStore.set(s.tiendaCodigo, st);
    }
    st.pesos += s.ventaPesos;
    st.unidades += s.unidades;
    st.meses.add(s.fecha);
    st.skus.add(s.upc);
    st.ventaPorMes.set(s.fecha, (st.ventaPorMes.get(s.fecha) || 0) + s.ventaPesos);
  }

  return Array.from(byStore.entries())
    .map(([codigo, d]) => {
      const mesesArr = Array.from(d.ventaPorMes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const lastMonth = mesesArr.length >= 1 ? mesesArr[mesesArr.length - 1][1] : 0;
      const prevMonth = mesesArr.length >= 2 ? mesesArr[mesesArr.length - 2][1] : null;
      const mom = prevMonth ? ((lastMonth - prevMonth) / prevMonth) * 100 : null;

      return {
        codigoTienda: codigo,
        nombreTienda: d.nombre,
        ventaTotal: d.pesos,
        unidadesTotal: d.unidades,
        meses: d.meses.size,
        skus: d.skus.size,
        ventaPromedio: d.pesos / d.meses.size,
        crecimientoMoM: mom,
        ventaPorMes: Object.fromEntries(d.ventaPorMes),
      };
    })
    .sort((a, b) => b.ventaTotal - a.ventaTotal);
}

// ─── Product performance ───

export async function getProductPerformance(filters?: {
  fechaInicio?: string;
  fechaFin?: string;
  linea?: string;
}): Promise<ProductPerformance[]> {
  const sales = await getEnrichedSales(filters);

  // Get all months for sparkline alignment
  const allMonths = [...new Set(sales.map((s) => s.fecha))].sort();

  const byProduct = new Map<string, {
    nombre: string;
    linea: string;
    departamento: string;
    pesos: number;
    unidades: number;
    tiendas: Set<number>;
    ventaPorMes: Map<string, number>;
  }>();

  for (const s of sales) {
    let p = byProduct.get(s.upc);
    if (!p) {
      p = { nombre: s.nombreProducto, linea: s.linea, departamento: s.departamento, pesos: 0, unidades: 0, tiendas: new Set(), ventaPorMes: new Map() };
      byProduct.set(s.upc, p);
    }
    p.pesos += s.ventaPesos;
    p.unidades += s.unidades;
    p.tiendas.add(s.tiendaCodigo);
    p.ventaPorMes.set(s.fecha, (p.ventaPorMes.get(s.fecha) || 0) + s.ventaPesos);
  }

  return Array.from(byProduct.entries())
    .map(([upc, d]) => {
      const tendencia = allMonths.map((m) => d.ventaPorMes.get(m) || 0);
      const mesesArr = Array.from(d.ventaPorMes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const lastMonth = mesesArr.length >= 1 ? mesesArr[mesesArr.length - 1][1] : 0;
      const prevMonth = mesesArr.length >= 2 ? mesesArr[mesesArr.length - 2][1] : null;
      const mom = prevMonth ? ((lastMonth - prevMonth) / prevMonth) * 100 : null;

      return {
        upc,
        nombreProducto: d.nombre,
        linea: d.linea,
        departamento: d.departamento,
        ventaTotal: d.pesos,
        unidadesTotal: d.unidades,
        tiendas: d.tiendas.size,
        precioPromedio: d.unidades > 0 ? d.pesos / d.unidades : 0,
        tendencia,
        crecimientoMoM: mom,
      };
    })
    .sort((a, b) => b.ventaTotal - a.ventaTotal);
}

// ─── Line summary ───

export async function getLineaSummary(filters?: {
  fechaInicio?: string;
  fechaFin?: string;
}): Promise<LineaSummary[]> {
  const sales = await getEnrichedSales(filters);

  const byLinea = new Map<string, { pesos: number; unidades: number; productos: Set<string> }>();

  for (const s of sales) {
    let l = byLinea.get(s.linea);
    if (!l) {
      l = { pesos: 0, unidades: 0, productos: new Set() };
      byLinea.set(s.linea, l);
    }
    l.pesos += s.ventaPesos;
    l.unidades += s.unidades;
    l.productos.add(s.upc);
  }

  const totalPesos = Array.from(byLinea.values()).reduce((a, b) => a + b.pesos, 0);

  return Array.from(byLinea.entries())
    .map(([linea, d]) => ({
      linea,
      ventaTotal: d.pesos,
      unidadesTotal: d.unidades,
      productos: d.productos.size,
      porcentaje: totalPesos > 0 ? (d.pesos / totalPesos) * 100 : 0,
    }))
    .sort((a, b) => b.ventaTotal - a.ventaTotal);
}

// ─── Available months ───

export async function getAvailableMonths(): Promise<string[]> {
  const result = await prisma.sale.findMany({
    select: { fecha: true },
    distinct: ['fecha'],
    orderBy: { fecha: 'asc' },
  });
  return result.map((r) => r.fecha);
}

// ─── Available lineas ───

export async function getAvailableLineas(): Promise<string[]> {
  const result = await prisma.product.findMany({
    select: { linea: true },
    distinct: ['linea'],
    where: { linea: { not: null } },
  });
  return result.map((r) => r.linea!).filter(Boolean).sort();
}

// ─── All stores for filter ───

export async function getAllStores() {
  return prisma.store.findMany({
    orderBy: { nombreTienda: 'asc' },
    select: { codigoTienda: true, nombreTienda: true },
  });
}
