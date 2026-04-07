import { NextRequest, NextResponse } from 'next/server';
import { getProductPerformance, getLineaSummary } from '@/lib/data';

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const filters = {
    fechaInicio: params.fechaInicio || undefined,
    fechaFin: params.fechaFin || undefined,
    linea: params.linea || undefined,
  };

  const [products, lineas] = await Promise.all([
    getProductPerformance(filters),
    getLineaSummary(filters),
  ]);

  return NextResponse.json({
    products,
    lineas,
  });
}
