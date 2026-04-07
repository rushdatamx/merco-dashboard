'use client';

import { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Cell,
} from 'recharts';
import { useApi } from '@/hooks/use-api';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { LoadingPage } from '@/components/layout/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMXN, formatCompact, formatChange, changeColor, formatNumber } from '@/lib/format';
import { formatPeriodo, LINEA_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StorePerformance } from '@/lib/types';

interface TiendasResponse {
  stores: StorePerformance[];
  heatmap: Array<{
    tienda: string;
    codigo: number;
    datos: Array<{ mes: string; valor: number }>;
  }>;
  matrizDistribucion: Array<{
    tienda: string;
    codigo: number;
    lineas: Record<string, number>;
  }>;
  allMonths: string[];
  allLineas: string[];
}

type SortKey = 'ventaTotal' | 'crecimientoMoM' | 'skus' | 'unidadesTotal';

export default function TiendasPage() {
  const { data, loading } = useApi<TiendasResponse>('tiendas');
  const [sortKey, setSortKey] = useState<SortKey>('ventaTotal');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedStores = useMemo(() => {
    if (!data) return [];
    return [...data.stores].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [data, sortKey, sortAsc]);

  const scatterData = useMemo(() => {
    if (!data) return [];
    return data.stores
      .filter((s) => s.crecimientoMoM != null)
      .map((s) => ({
        x: s.ventaTotal,
        y: s.crecimientoMoM!,
        z: s.skus,
        nombre: s.nombreTienda,
      }));
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading || !data) return <LoadingPage />;

  // Heatmap max value for color scaling
  const heatmapMax = Math.max(...data.heatmap.flatMap((h) => h.datos.map((d) => d.valor)), 1);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tiendas</h2>
        <p className="text-sm text-muted-foreground">Performance por sucursal Merco</p>
      </div>

      {/* Ranking table */}
      <ChartWrapper titulo="Ranking de tiendas" subtitulo="Click en columna para ordenar">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Tienda</TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('ventaTotal')}
                >
                  Ventas {sortKey === 'ventaTotal' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('unidadesTotal')}
                >
                  Unidades {sortKey === 'unidadesTotal' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('crecimientoMoM')}
                >
                  MoM% {sortKey === 'crecimientoMoM' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('skus')}
                >
                  SKUs {sortKey === 'skus' && (sortAsc ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStores.map((store, i) => (
                <TableRow key={store.codigoTienda}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">
                    {store.nombreTienda}
                  </TableCell>
                  <TableCell className="text-xs text-right">{formatCompact(store.ventaTotal)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(store.unidadesTotal)}</TableCell>
                  <TableCell className={cn('text-xs text-right', changeColor(store.crecimientoMoM))}>
                    {formatChange(store.crecimientoMoM)}
                  </TableCell>
                  <TableCell className="text-xs text-right">{store.skus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter plot: Volume vs Growth */}
        <ChartWrapper titulo="Volumen vs Crecimiento" subtitulo="Cuadrantes BCG — tamaño = # SKUs">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="x"
                type="number"
                tick={{ fontSize: 10, fill: '#999' }}
                tickFormatter={(v) => formatCompact(v)}
                name="Ventas"
              />
              <YAxis
                dataKey="y"
                type="number"
                tick={{ fontSize: 10, fill: '#999' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                name="Crecimiento MoM%"
              />
              <ZAxis dataKey="z" range={[40, 200]} name="SKUs" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => {
                  const v = Number(value);
                  const n = String(name);
                  if (n === 'Ventas') return [formatMXN(v), n];
                  if (n === 'Crecimiento MoM%') return [`${v.toFixed(1)}%`, n];
                  return [v, n];
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.nombre || ''}
              />
              {/* Reference lines for quadrants */}
              <Scatter data={scatterData}>
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.y > 0 ? '#10B981' : '#EF4444'}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Heatmap: store x month */}
        <ChartWrapper titulo="Heatmap tienda × mes" subtitulo="Intensidad = volumen de ventas">
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="text-left p-1 sticky left-0 bg-card z-10 text-muted-foreground">Tienda</th>
                  {data.allMonths.map((m) => (
                    <th key={m} className="p-1 text-center text-muted-foreground min-w-[40px]">
                      {formatPeriodo(m).split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.heatmap.map((row) => (
                  <tr key={row.codigo}>
                    <td className="p-1 sticky left-0 bg-card z-10 truncate max-w-[120px]">
                      {row.tienda.replace(/^\d+-/, '').trim()}
                    </td>
                    {row.datos.map((d) => {
                      const intensity = d.valor / heatmapMax;
                      return (
                        <td
                          key={d.mes}
                          className="p-1 text-center"
                          title={`${formatMXN(d.valor)} — ${formatPeriodo(d.mes)}`}
                        >
                          <div
                            className="w-full h-5 rounded-sm"
                            style={{
                              backgroundColor: d.valor > 0
                                ? `rgba(249, 115, 22, ${Math.max(0.08, intensity)})`
                                : 'rgba(255,255,255,0.03)',
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartWrapper>
      </div>

      {/* Distribution matrix */}
      <ChartWrapper titulo="Matriz de distribución" subtitulo="Tienda × línea de producto (gaps = oportunidad de crecimiento)">
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left p-1 sticky left-0 bg-card z-10 text-muted-foreground">Tienda</th>
                {data.allLineas.map((l) => (
                  <th key={l} className="p-2 text-center text-muted-foreground">
                    <span style={{ color: LINEA_COLORS[l] || '#6B7280' }}>{l}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrizDistribucion.map((row) => (
                <tr key={row.codigo}>
                  <td className="p-1 sticky left-0 bg-card z-10 truncate max-w-[140px]">
                    {row.tienda.replace(/^\d+-/, '').trim()}
                  </td>
                  {data.allLineas.map((l) => {
                    const val = row.lineas[l] || 0;
                    return (
                      <td key={l} className="p-1 text-center">
                        {val > 0 ? (
                          <span className="text-foreground">{formatCompact(val)}</span>
                        ) : (
                          <Badge variant="outline" className="text-[8px] text-red-400 border-red-400/30">
                            gap
                          </Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartWrapper>
    </div>
  );
}
