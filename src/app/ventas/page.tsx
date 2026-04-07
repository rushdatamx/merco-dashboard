'use client';

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
  ComposedChart, Line,
} from 'recharts';
import { useApi } from '@/hooks/use-api';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { LoadingPage } from '@/components/layout/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMXN, formatCompact, formatChange, changeColor, formatNumber } from '@/lib/format';
import { formatPeriodo, LINEA_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface VentasResponse {
  tendenciaLineas: Array<Record<string, unknown>>;
  tablaVentas: Array<{
    mes: string;
    ventaPesos: number;
    unidades: number;
    tiendas: number;
    skus: number;
    mom: number | null;
    yoy: number | null;
  }>;
  pareto: Array<{
    upc: string;
    nombre: string;
    pesos: number;
    linea: string;
    porcentaje: number;
    porcentajeAcumulado: number;
  }>;
  departamentos: Array<{ departamento: string; ventaPesos: number }>;
  lineas: Array<{ linea: string; ventaTotal: number; porcentaje: number }>;
}

export default function VentasPage() {
  const { data, loading } = useApi<VentasResponse>('ventas');

  const lineasKeys = useMemo(() => {
    if (!data?.tendenciaLineas?.length) return [];
    return Object.keys(data.tendenciaLineas[0]).filter((k) => k !== 'mes');
  }, [data]);

  const tendenciaData = useMemo(() => {
    if (!data) return [];
    return data.tendenciaLineas.map((d) => ({
      ...d,
      label: formatPeriodo(d.mes as string),
    }));
  }, [data]);

  const paretoData = useMemo(() => {
    if (!data) return [];
    return data.pareto.slice(0, 20);
  }, [data]);

  if (loading || !data) return <LoadingPage />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ventas</h2>
        <p className="text-sm text-muted-foreground">Análisis profundo de ventas</p>
      </div>

      {/* Stacked area by line */}
      <ChartWrapper titulo="Tendencia mensual por línea" subtitulo="Ventas en pesos (área apilada)">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={tendenciaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} />
            <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [formatMXN(Number(value)), String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {lineasKeys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                fill={LINEA_COLORS[key] || '#6B7280'}
                stroke={LINEA_COLORS[key] || '#6B7280'}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly table with MoM/YoY */}
        <ChartWrapper titulo="Tabla de ventas mensuales" subtitulo="Con variación MoM% y YoY%">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Mes</TableHead>
                  <TableHead className="text-xs text-right">Ventas</TableHead>
                  <TableHead className="text-xs text-right">Unidades</TableHead>
                  <TableHead className="text-xs text-right">MoM%</TableHead>
                  <TableHead className="text-xs text-right">YoY%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tablaVentas.map((row) => (
                  <TableRow key={row.mes}>
                    <TableCell className="text-xs font-medium">{formatPeriodo(row.mes)}</TableCell>
                    <TableCell className="text-xs text-right">{formatCompact(row.ventaPesos)}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(row.unidades)}</TableCell>
                    <TableCell className={cn('text-xs text-right', changeColor(row.mom))}>
                      {formatChange(row.mom)}
                    </TableCell>
                    <TableCell className={cn('text-xs text-right', changeColor(row.yoy))}>
                      {formatChange(row.yoy)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartWrapper>

        {/* Departamentos */}
        <ChartWrapper titulo="Ventas por departamento" subtitulo="Desglose Merco">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.departamentos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => formatCompact(v)} />
              <YAxis
                type="category"
                dataKey="departamento"
                width={120}
                tick={{ fontSize: 10, fill: '#999' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXN(Number(value)), 'Ventas']}
              />
              <Bar dataKey="ventaPesos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Pareto chart */}
      <ChartWrapper titulo="Análisis Pareto (80/20)" subtitulo="Top 20 productos — barras = ventas, línea = % acumulado">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 8, fill: '#999' }}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => formatCompact(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => {
                const v = Number(value);
                return String(name) === 'porcentajeAcumulado' ? [`${v.toFixed(1)}%`, '% Acumulado'] : [formatMXN(v), 'Ventas'];
              }}
            />
            <Bar yAxisId="left" dataKey="pesos" radius={[4, 4, 0, 0]}>
              {paretoData.map((entry) => (
                <Cell key={entry.upc} fill={LINEA_COLORS[entry.linea] || '#6B7280'} fillOpacity={0.8} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="porcentajeAcumulado"
              stroke="#F97316"
              strokeWidth={2}
              dot={{ r: 2, fill: '#F97316' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}
