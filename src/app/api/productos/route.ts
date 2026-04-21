import { NextRequest, NextResponse } from 'next/server';
import { getProductPerformance, getDepartamentoSummary } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);

    const filters = {
      fechaInicio: params.fechaInicio || undefined,
      fechaFin: params.fechaFin || undefined,
      departamento: params.departamento || undefined,
      upc: params.upc || undefined,
    };

    const [products, departamentos] = await Promise.all([
      getProductPerformance(filters),
      getDepartamentoSummary(filters),
    ]);

    return NextResponse.json({
      products,
      departamentos,
    });
  } catch (error) {
    console.error('API /productos error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
