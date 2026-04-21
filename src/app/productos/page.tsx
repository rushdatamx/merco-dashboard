'use client';

import { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  LineChart, Line,
} from 'recharts';
import { useApi } from '@/hooks/use-api';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { LoadingPage } from '@/components/layout/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMXN, formatCompact, formatChange, changeColor, formatNumber, formatMXNDecimal } from '@/lib/format';
import { LINEA_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ProductPerformance, LineaSummary } from '@/lib/types';

interface ProductosResponse {
  products: ProductPerformance[];
  lineas: LineaSummary[];
}

export default function ProductosPage() {
  const { data, loading } = useApi<ProductosResponse>('productos');
  const [sortKey, setSortKey] = useState<'ventaTotal' | 'unidadesTotal' | 'tiendas' | 'precioPromedio' | 'crecimientoMoM'>('ventaTotal');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedProducts = useMemo(() => {
    if (!data) return [];
    return [...data.products].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortAsc ? va - vb : vb - va;
    });
  }, [data, sortKey, sortAsc]);

  const scatterData = useMemo(() => {
    if (!data) return [];
    return data.products
      .filter((p) => p.crecimientoMoM != null)
      .map((p) => ({
        x: p.ventaTotal,
        y: p.crecimientoMoM!,
        nombre: p.nombreProducto,
        linea: p.linea,
      }));
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data) return [];
    return data.products
      .sort((a, b) => b.tiendas - a.tiendas)
      .slice(0, 25)
      .map((p) => ({
        nombre: p.nombreProducto.length > 25 ? p.nombreProducto.slice(0, 25) + '...' : p.nombreProducto,
        tiendas: p.tiendas,
        linea: p.linea,
      }));
  }, [data]);

  const priceData = useMemo(() => {
    if (!data) return [];
    return data.products
      .filter((p) => p.precioPromedio > 0)
      .sort((a, b) => b.precioPromedio - a.precioPromedio)
      .slice(0, 20)
      .map((p) => ({
        nombre: p.nombreProducto.length > 25 ? p.nombreProducto.slice(0, 25) + '...' : p.nombreProducto,
        precio: p.precioPromedio,
        linea: p.linea,
      }));
  }, [data]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading || !data) return <LoadingPage />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Productos</h2>
        <p className="text-sm text-muted-foreground">Portfolio analytics — {data.products.length} productos activos</p>
      </div>

      {/* Product table with sparklines */}
      <ChartWrapper titulo="Catálogo de productos" subtitulo="Tabla con tendencia y métricas clave">
        <div className="max-h-[450px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Producto</TableHead>
                <TableHead className="text-xs">Línea</TableHead>
                <TableHead className="text-xs">Tendencia</TableHead>
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
                  onClick={() => handleSort('tiendas')}
                >
                  Tiendas {sortKey === 'tiendas' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('precioPromedio')}
                >
                  Precio prom. {sortKey === 'precioPromedio' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-pointer hover:text-brand"
                  onClick={() => handleSort('crecimientoMoM')}
                >
                  MoM% {sortKey === 'crecimientoMoM' && (sortAsc ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product, i) => (
                <TableRow key={product.upc}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium max-w-[180px] truncate" title={product.nombreProducto}>
                    {product.nombreProducto}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[9px]"
                      style={{ borderColor: LINEA_COLORS[product.linea] || '#6B7280', color: LINEA_COLORS[product.linea] || '#6B7280' }}
                    >
                      {product.linea}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[80px]">
                    {/* Sparkline */}
                    <div className="w-[70px] h-[20px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={product.tendencia.map((v, j) => ({ v, j }))}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={LINEA_COLORS[product.linea] || '#6B7280'}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right">{formatCompact(product.ventaTotal)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(product.unidadesTotal)}</TableCell>
                  <TableCell className="text-xs text-right">{product.tiendas}</TableCell>
                  <TableCell className="text-xs text-right">{formatMXNDecimal(product.precioPromedio)}</TableCell>
                  <TableCell className={cn('text-xs text-right', changeColor(product.crecimientoMoM))}>
                    {formatChange(product.crecimientoMoM)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter: Growth vs Volume */}
        <ChartWrapper titulo="Crecimiento vs Volumen" subtitulo="Posición de cada producto">
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="x" type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} name="Ventas" />
              <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `${v.toFixed(0)}%`} name="Crecimiento" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => {
                  const v = Number(value);
                  const n = String(name);
                  if (n === 'Ventas') return [formatMXN(v), n];
                  return [`${v.toFixed(1)}%`, n];
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.nombre || ''}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={LINEA_COLORS[entry.linea] || '#6B7280'} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Distribution bar */}
        <ChartWrapper titulo="Distribución por producto" subtitulo="# de tiendas donde se vende">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={distributionData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 8, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="tiendas" radius={[0, 4, 4, 0]}>
                {distributionData.map((entry, i) => (
                  <Cell key={i} fill={LINEA_COLORS[entry.linea] || '#6B7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price analysis */}
        <ChartWrapper titulo="Precio unitario promedio" subtitulo="Top 20 productos por precio">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={priceData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 8, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXNDecimal(Number(value)), 'Precio promedio']}
              />
              <Bar dataKey="precio" radius={[0, 4, 4, 0]}>
                {priceData.map((entry, i) => (
                  <Cell key={i} fill={LINEA_COLORS[entry.linea] || '#6B7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Comparison by linea */}
        <ChartWrapper titulo="Comparación entre líneas" subtitulo="Ventas totales por línea de negocio">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.lineas}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="linea" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXN(Number(value)), 'Ventas']}
              />
              <Bar dataKey="ventaTotal" radius={[4, 4, 0, 0]}>
                {data.lineas.map((entry) => (
                  <Cell key={entry.linea} fill={LINEA_COLORS[entry.linea] || '#6B7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
}
