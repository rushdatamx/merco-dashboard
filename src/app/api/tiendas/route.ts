import { NextRequest, NextResponse } from 'next/server';
import { getStorePerformance, getEnrichedSales } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const filters = {
    fechaInicio: params.fechaInicio || undefined,
    fechaFin: params.fechaFin || undefined,
    departamento: params.departamento || undefined,
    upc: params.upc || undefined,
  };

  const [stores, sales] = await Promise.all([
    getStorePerformance(filters),
    getEnrichedSales(filters),
  ]);

  // Heatmap: store x month
  const allMonths = [...new Set(sales.map((s) => s.fecha))].sort();
  const heatmap = stores.slice(0, 20).map((st) => ({
    tienda: st.nombreTienda,
    codigo: st.codigoTienda,
    datos: allMonths.map((m) => ({
      mes: m,
      valor: st.ventaPorMes[m] || 0,
    })),
  }));

  // Distribution matrix: store x departamento
  const storeDept = new Map<string, Map<string, number>>();
  for (const s of sales) {
    const key = String(s.tiendaCodigo);
    if (!storeDept.has(key)) storeDept.set(key, new Map());
    const deptMap = storeDept.get(key)!;
    deptMap.set(s.departamento, (deptMap.get(s.departamento) || 0) + s.ventaPesos);
  }

  const allDepartamentos = [...new Set(sales.map((s) => s.departamento))].sort();
  const matrizDistribucion = stores.slice(0, 30).map((st) => {
    const deptMap = storeDept.get(String(st.codigoTienda)) || new Map();
    return {
      tienda: st.nombreTienda,
      codigo: st.codigoTienda,
      departamentos: Object.fromEntries(allDepartamentos.map((d) => [d, deptMap.get(d) || 0])),
    };
  });

  return NextResponse.json({
    stores,
    heatmap,
    matrizDistribucion,
    allMonths,
    allDepartamentos,
  });
  } catch (error) {
    console.error('API /tiendas error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
