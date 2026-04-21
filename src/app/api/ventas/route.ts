import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummary, getEnrichedSales, getDepartamentoSummary } from '@/lib/data';
import { calculatePareto, calculateMoM, calculateYoY } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const filters = {
    fechaInicio: params.fechaInicio || undefined,
    fechaFin: params.fechaFin || undefined,
    departamento: params.departamento || undefined,
    tiendaCodigo: params.tiendaCodigo ? Number(params.tiendaCodigo) : undefined,
    upc: params.upc || undefined,
  };

  const [monthlySummary, sales, resumenDepartamentos] = await Promise.all([
    getMonthlySummary(filters),
    getEnrichedSales(filters),
    getDepartamentoSummary(filters),
  ]);

  // Monthly by departamento for stacked area
  const monthlyByDept: Record<string, Record<string, number>> = {};
  for (const s of sales) {
    if (!monthlyByDept[s.fecha]) monthlyByDept[s.fecha] = {};
    monthlyByDept[s.fecha][s.departamento] = (monthlyByDept[s.fecha][s.departamento] || 0) + s.ventaPesos;
  }

  const tendenciaDepartamentos = Object.entries(monthlyByDept)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, deptData]) => ({ mes, ...deptData }));

  // MoM and YoY table
  const tablaVentas = monthlySummary.map((m, i) => {
    const prev = i > 0 ? monthlySummary[i - 1] : null;
    const yearAgo = monthlySummary.find(
      (x) => {
        const [y, mo] = m.mes.split('-');
        return x.mes === `${Number(y) - 1}-${mo}`;
      }
    );

    return {
      ...m,
      mom: prev ? calculateMoM(m.ventaPesos, prev.ventaPesos) : null,
      yoy: yearAgo ? calculateYoY(m.ventaPesos, yearAgo.ventaPesos) : null,
    };
  });

  // Pareto by product
  const productSales = new Map<string, { nombre: string; pesos: number; departamento: string }>();
  for (const s of sales) {
    const existing = productSales.get(s.upc);
    if (existing) {
      existing.pesos += s.ventaPesos;
    } else {
      productSales.set(s.upc, { nombre: s.nombreProducto, pesos: s.ventaPesos, departamento: s.departamento });
    }
  }
  const paretoProducts = calculatePareto(
    Array.from(productSales.entries()).map(([upc, d]) => ({ upc, ...d })),
    (item) => item.pesos
  );

  // By departamento
  const byDepartamento = new Map<string, number>();
  for (const s of sales) {
    byDepartamento.set(s.departamento, (byDepartamento.get(s.departamento) || 0) + s.ventaPesos);
  }
  const departamentos = Array.from(byDepartamento.entries())
    .map(([dept, pesos]) => ({ departamento: dept, ventaPesos: pesos }))
    .sort((a, b) => b.ventaPesos - a.ventaPesos);

  return NextResponse.json({
    tendenciaDepartamentos,
    tablaVentas,
    pareto: paretoProducts,
    departamentos,
    resumenDepartamentos,
  });
  } catch (error) {
    console.error('API /ventas error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
