import { NextRequest, NextResponse } from 'next/server';
import { getStorePerformance, getEnrichedSales } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const filters = {
    fechaInicio: params.fechaInicio || undefined,
    fechaFin: params.fechaFin || undefined,
    linea: params.linea || undefined,
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

  // Distribution matrix: store x linea
  const storeLinea = new Map<string, Map<string, number>>();
  for (const s of sales) {
    const key = String(s.tiendaCodigo);
    if (!storeLinea.has(key)) storeLinea.set(key, new Map());
    const lineaMap = storeLinea.get(key)!;
    lineaMap.set(s.linea, (lineaMap.get(s.linea) || 0) + s.ventaPesos);
  }

  const allLineas = [...new Set(sales.map((s) => s.linea))].sort();
  const matrizDistribucion = stores.slice(0, 30).map((st) => {
    const lineaMap = storeLinea.get(String(st.codigoTienda)) || new Map();
    return {
      tienda: st.nombreTienda,
      codigo: st.codigoTienda,
      lineas: Object.fromEntries(allLineas.map((l) => [l, lineaMap.get(l) || 0])),
    };
  });

  return NextResponse.json({
    stores,
    heatmap,
    matrizDistribucion,
    allMonths,
    allLineas,
  });
  } catch (error) {
    console.error('API /tiendas error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
