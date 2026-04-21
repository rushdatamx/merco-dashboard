import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummary, getEnrichedSales } from '@/lib/data';
import { calculateSeasonality, calculateMovingAverage, decomposeGrowth, calculateYoY } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);

    const filters = {
      linea: params.linea || undefined,
      departamento: params.departamento || undefined,
      tiendaCodigo: params.tiendaCodigo ? Number(params.tiendaCodigo) : undefined,
      upc: params.upc || undefined,
    };

    const [monthlySummary, allSales] = await Promise.all([
      getMonthlySummary(filters),
      getEnrichedSales(filters),
    ]);

    // YoY comparison
    const yoyData = monthlySummary.map((m) => {
      const [y, mo] = m.mes.split('-');
      const yearAgo = monthlySummary.find((x) => x.mes === `${Number(y) - 1}-${mo}`);
      return {
        mes: m.mes,
        mesLabel: mo,
        actual: m.ventaPesos,
        anterior: yearAgo?.ventaPesos || null,
        yoy: yearAgo ? calculateYoY(m.ventaPesos, yearAgo.ventaPesos) : null,
      };
    });

    // Seasonality
    const seasonality = calculateSeasonality(monthlySummary);

    // Moving average
    const values = monthlySummary.map((m) => m.ventaPesos);
    const ma3 = calculateMovingAverage(values, 3);
    const tendenciaMA = monthlySummary.map((m, i) => ({
      mes: m.mes,
      ventaPesos: m.ventaPesos,
      ma3: ma3[i],
    }));

    // Growth decomposition
    const months2026 = monthlySummary.filter((m) => m.mes.startsWith('2026')).map((m) => m.mes);
    const months2025Q1 = ['2025-01', '2025-02', '2025-03'];
    const decomposition = months2026.length > 0
      ? decomposeGrowth(allSales, months2026, months2025Q1)
      : null;

    return NextResponse.json({
      yoyData,
      seasonality,
      tendenciaMA,
      decomposition,
      monthlySummary,
    });
  } catch (error) {
    console.error('API /tendencias error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
