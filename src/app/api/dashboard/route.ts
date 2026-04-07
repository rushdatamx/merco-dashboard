import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummary, getLineaSummary, getStorePerformance, getProductPerformance } from '@/lib/data';
import { calculateKPIs, generateInsights } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);

    const filters = {
      fechaInicio: params.fechaInicio || undefined,
      fechaFin: params.fechaFin || undefined,
      linea: params.linea || undefined,
      departamento: params.departamento || undefined,
      tiendaCodigo: params.tiendaCodigo ? Number(params.tiendaCodigo) : undefined,
    };

    const [monthlySummary, lineas, stores, products] = await Promise.all([
      getMonthlySummary(filters),
      getLineaSummary(filters),
      getStorePerformance(filters),
      getProductPerformance(filters),
    ]);

    const kpis = calculateKPIs(monthlySummary);
    const insights = generateInsights(monthlySummary, lineas, stores, products);

    return NextResponse.json({
      kpis,
      tendenciaMensual: monthlySummary,
      mixLineas: lineas,
      topTiendas: stores.slice(0, 10),
      insights,
    });
  } catch (error) {
    console.error('API /dashboard error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
