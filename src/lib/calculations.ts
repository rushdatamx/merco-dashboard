import type { EnrichedSale, Insight, MonthlySummary, StorePerformance, ProductPerformance, DepartamentoSummary } from './types';

// ─── KPI Calculations ───

export function calculateKPIs(
  monthlySummary: MonthlySummary[],
  lastMonth?: string
) {
  const target = lastMonth || monthlySummary[monthlySummary.length - 1]?.mes;
  const current = monthlySummary.find((m) => m.mes === target);
  const prevIdx = monthlySummary.findIndex((m) => m.mes === target) - 1;
  const prev = prevIdx >= 0 ? monthlySummary[prevIdx] : null;

  const totalVentas = monthlySummary.reduce((a, b) => a + b.ventaPesos, 0);
  const totalUnidades = monthlySummary.reduce((a, b) => a + b.unidades, 0);

  const ventaMesActual = current?.ventaPesos || 0;
  const unidadesMesActual = current?.unidades || 0;
  const tiendasActivas = current?.tiendas || 0;
  const skusActivos = current?.skus || 0;
  const ventaPromedioTienda = tiendasActivas > 0 ? ventaMesActual / tiendasActivas : 0;
  const ticketPromedio = unidadesMesActual > 0 ? ventaMesActual / unidadesMesActual : 0;

  const cambioVentas = prev ? ((ventaMesActual - prev.ventaPesos) / prev.ventaPesos) * 100 : null;
  const cambioUnidades = prev ? ((unidadesMesActual - prev.unidades) / prev.unidades) * 100 : null;

  return {
    ventaMesActual,
    unidadesMesActual,
    tiendasActivas,
    skusActivos,
    ventaPromedioTienda,
    ticketPromedio,
    cambioVentas,
    cambioUnidades,
    totalVentas,
    totalUnidades,
    mesActual: target,
  };
}

// ─── MoM & YoY ───

export function calculateMoM(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function calculateYoY(current: number, yearAgo: number): number | null {
  if (yearAgo === 0) return null;
  return ((current - yearAgo) / yearAgo) * 100;
}

// ─── Pareto / Concentration ───

export function calculatePareto<T>(
  items: T[],
  getValue: (item: T) => number
): Array<T & { porcentajeAcumulado: number; porcentaje: number }> {
  const total = items.reduce((a, b) => a + getValue(b), 0);
  let acumulado = 0;

  return items
    .sort((a, b) => getValue(b) - getValue(a))
    .map((item) => {
      const valor = getValue(item);
      const pct = total > 0 ? (valor / total) * 100 : 0;
      acumulado += pct;
      return { ...item, porcentaje: pct, porcentajeAcumulado: acumulado };
    });
}

// ─── Insights Engine ───

export function generateInsights(
  monthlySummary: MonthlySummary[],
  departamentos: DepartamentoSummary[],
  topStores: StorePerformance[],
  topProducts: ProductPerformance[]
): Insight[] {
  const insights: Insight[] = [];

  // 1. Concentration risk
  if (departamentos.length > 0) {
    const topDept = departamentos[0];
    if (topDept.porcentaje > 50) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Riesgo de concentración',
        descripcion: `${topDept.departamento} representa el ${topDept.porcentaje.toFixed(1)}% de las ventas totales. Alta dependencia de un solo departamento.`,
        valor: `${topDept.porcentaje.toFixed(1)}%`,
      });
    }
  }

  // 2. Top product concentration
  if (topProducts.length > 0) {
    const totalVentas = topProducts.reduce((a, b) => a + b.ventaTotal, 0);
    const topProd = topProducts[0];
    const pctTop = totalVentas > 0 ? (topProd.ventaTotal / totalVentas) * 100 : 0;
    if (pctTop > 40) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Producto dominante',
        descripcion: `${topProd.nombreProducto} concentra el ${pctTop.toFixed(1)}% de las ventas. Diversificar reduciría riesgo.`,
        valor: `${pctTop.toFixed(1)}%`,
      });
    }
  }

  // 3. Monthly growth
  if (monthlySummary.length >= 2) {
    const last = monthlySummary[monthlySummary.length - 1];
    const prev = monthlySummary[monthlySummary.length - 2];
    const mom = ((last.ventaPesos - prev.ventaPesos) / prev.ventaPesos) * 100;

    if (mom > 30) {
      insights.push({
        tipo: 'oportunidad',
        titulo: 'Crecimiento excepcional',
        descripcion: `Las ventas crecieron ${mom.toFixed(1)}% MoM. Capitalizar el momentum actual.`,
        valor: `+${mom.toFixed(1)}%`,
      });
    } else if (mom < -15) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Caída en ventas',
        descripcion: `Las ventas cayeron ${Math.abs(mom).toFixed(1)}% vs mes anterior. Investigar causas.`,
        valor: `${mom.toFixed(1)}%`,
      });
    }
  }

  // 4. Stores in decline
  const decliningStores = topStores.filter((s) => s.crecimientoMoM != null && s.crecimientoMoM < -20);
  if (decliningStores.length > 3) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Tiendas en declive',
      descripcion: `${decliningStores.length} tiendas con caídas mayores al 20% MoM. Requieren atención comercial.`,
      valor: `${decliningStores.length} tiendas`,
    });
  }

  // 5. Distribution opportunity
  if (topProducts.length > 0 && topStores.length > 0) {
    const maxTiendas = topStores.length;
    const lowDistribution = topProducts.filter((p) => p.tiendas < maxTiendas * 0.5 && p.ventaTotal > 0);
    if (lowDistribution.length > 5) {
      insights.push({
        tipo: 'oportunidad',
        titulo: 'Oportunidad de distribución',
        descripcion: `${lowDistribution.length} productos están en menos del 50% de las tiendas. Expandir distribución podría crecer ventas.`,
        valor: `${lowDistribution.length} SKUs`,
      });
    }
  }

  // 6. YoY comparison (if we have data from both years)
  if (monthlySummary.length >= 13) {
    const currentYear = monthlySummary.filter((m) => m.mes >= '2026-01');
    const lastYear = monthlySummary.filter((m) => m.mes >= '2025-01' && m.mes <= '2025-03');
    if (currentYear.length > 0 && lastYear.length > 0) {
      const currentTotal = currentYear.reduce((a, b) => a + b.ventaPesos, 0);
      const lastTotal = lastYear.reduce((a, b) => a + b.ventaPesos, 0);
      const yoy = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (Math.abs(yoy) > 10) {
        insights.push({
          tipo: yoy > 0 ? 'oportunidad' : 'alerta',
          titulo: 'Comparación año contra año',
          descripcion: `Acumulado Ene-Mar 2026 vs 2025: ${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%. ${yoy > 0 ? 'Tendencia positiva.' : 'Revisar estrategia.'}`,
          valor: `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%`,
        });
      }
    }
  }

  return insights.slice(0, 5);
}

// ─── Seasonality index ───

export function calculateSeasonality(monthlySummary: MonthlySummary[]): Array<{ mes: string; indice: number }> {
  const avgMonth = monthlySummary.reduce((a, b) => a + b.ventaPesos, 0) / monthlySummary.length;
  return monthlySummary.map((m) => ({
    mes: m.mes,
    indice: avgMonth > 0 ? (m.ventaPesos / avgMonth) * 100 : 100,
  }));
}

// ─── Moving average ───

export function calculateMovingAverage(data: number[], window: number = 3): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}

// ─── Growth decomposition ───

export function decomposeGrowth(
  salesByMonth: EnrichedSale[],
  currentPeriod: string[],
  previousPeriod: string[]
) {
  const currentSales = salesByMonth.filter((s) => currentPeriod.includes(s.fecha));
  const prevSales = salesByMonth.filter((s) => previousPeriod.includes(s.fecha));

  const prevStores = new Set(prevSales.map((s) => s.tiendaCodigo));
  const prevSKUs = new Set(prevSales.map((s) => s.upc));

  let sameStoreGrowth = 0;
  let newStoreGrowth = 0;
  let newSKUGrowth = 0;

  for (const s of currentSales) {
    if (!prevStores.has(s.tiendaCodigo)) {
      newStoreGrowth += s.ventaPesos;
    } else if (!prevSKUs.has(s.upc)) {
      newSKUGrowth += s.ventaPesos;
    } else {
      sameStoreGrowth += s.ventaPesos;
    }
  }

  const prevTotal = prevSales.reduce((a, b) => a + b.ventaPesos, 0);
  sameStoreGrowth -= prevTotal; // net same-store growth

  return {
    sameStore: sameStoreGrowth,
    newStores: newStoreGrowth,
    newSKUs: newSKUGrowth,
    total: sameStoreGrowth + newStoreGrowth + newSKUGrowth,
  };
}
