'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, ComposedChart, Area,
} from 'recharts';
import { useApi } from '@/hooks/use-api';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { KPICard } from '@/components/layout/kpi-card';
import { LoadingPage } from '@/components/layout/loading';
import { formatMXN, formatCompact, formatChange, changeColor } from '@/lib/format';
import { formatPeriodo, MESES_ES } from '@/lib/constants';
import type { MonthlySummary } from '@/lib/types';

interface TendenciasResponse {
  yoyData: Array<{
    mes: string;
    mesLabel: string;
    actual: number;
    anterior: number | null;
    yoy: number | null;
  }>;
  seasonality: Array<{ mes: string; indice: number }>;
  tendenciaMA: Array<{ mes: string; ventaPesos: number; ma3: number | null }>;
  decomposition: {
    sameStore: number;
    newStores: number;
    newSKUs: number;
    total: number;
  } | null;
  monthlySummary: MonthlySummary[];
}

export default function TendenciasPage() {
  const { data, loading } = useApi<TendenciasResponse>('tendencias');

  const yoyChartData = useMemo(() => {
    if (!data) return [];
    // Group by month for comparison
    const byMonth = new Map<string, { mesLabel: string; '2025': number; '2026': number }>();
    for (const d of data.yoyData) {
      const [year, month] = d.mes.split('-');
      const label = MESES_ES[month] || month;
      const existing = byMonth.get(month) || { mesLabel: label, '2025': 0, '2026': 0 };
      existing[year as '2025' | '2026'] = d.actual;
      byMonth.set(month, existing);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [data]);

  const maData = useMemo(() => {
    if (!data) return [];
    return data.tendenciaMA.map((d) => ({
      ...d,
      label: formatPeriodo(d.mes),
    }));
  }, [data]);

  const seasonData = useMemo(() => {
    if (!data) return [];
    return data.seasonality.map((d) => ({
      ...d,
      label: formatPeriodo(d.mes),
    }));
  }, [data]);

  if (loading || !data) return <LoadingPage />;

  const decomp = data.decomposition;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tendencias</h2>
        <p className="text-sm text-muted-foreground">Análisis temporal y estacionalidad</p>
      </div>

      {/* Decomposition KPIs */}
      {decomp && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Descomposición del crecimiento (Q1 2026 vs Q1 2025)
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              titulo="Crecimiento total"
              valor={formatCompact(decomp.total)}
              cambio={null}
            />
            <KPICard
              titulo="Same-store growth"
              valor={formatCompact(decomp.sameStore)}
              subtexto="Mismas tiendas y SKUs"
            />
            <KPICard
              titulo="Nuevas tiendas"
              valor={formatCompact(decomp.newStores)}
              subtexto="Tiendas que no vendían en 2025"
            />
            <KPICard
              titulo="Nuevos SKUs"
              valor={formatCompact(decomp.newSKUs)}
              subtexto="Productos nuevos en tiendas existentes"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* YoY comparison */}
        <ChartWrapper titulo="Comparación Year-over-Year" subtitulo="Ene–Mar 2025 vs 2026">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yoyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => [formatMXN(Number(value)), String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="2025" fill="#6B7280" radius={[4, 4, 0, 0]} name="2025" />
              <Bar dataKey="2026" fill="#F97316" radius={[4, 4, 0, 0]} name="2026" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Seasonality index */}
        <ChartWrapper titulo="Índice de estacionalidad" subtitulo="100 = promedio mensual">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={seasonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [`${Number(value).toFixed(1)}`, 'Índice']}
              />
              <Area type="monotone" dataKey="indice" fill="#F97316" fillOpacity={0.1} stroke="none" />
              <Line
                type="monotone"
                dataKey="indice"
                stroke="#F97316"
                strokeWidth={2}
                dot={{ r: 3, fill: '#F97316' }}
              />
              {/* Reference line at 100 */}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Moving average */}
      <ChartWrapper titulo="Media móvil 3 meses" subtitulo="Línea naranja = ventas reales, línea azul = MA3">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={maData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => {
                const label = String(name) === 'ventaPesos' ? 'Ventas' : 'MA 3 meses';
                return [formatMXN(Number(value)), label];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (value === 'ventaPesos' ? 'Ventas' : 'Media móvil 3m')}
            />
            <Line
              type="monotone"
              dataKey="ventaPesos"
              stroke="#F97316"
              strokeWidth={2}
              dot={{ r: 3, fill: '#F97316' }}
            />
            <Line
              type="monotone"
              dataKey="ma3"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* YoY detailed table */}
      <ChartWrapper titulo="Detalle Year-over-Year" subtitulo="Variación mensual contra año anterior">
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">Mes</th>
                <th className="text-right p-2 text-muted-foreground">Ventas</th>
                <th className="text-right p-2 text-muted-foreground">Año anterior</th>
                <th className="text-right p-2 text-muted-foreground">YoY%</th>
              </tr>
            </thead>
            <tbody>
              {data.yoyData.map((row) => (
                <tr key={row.mes} className="border-b border-border/50">
                  <td className="p-2 font-medium">{formatPeriodo(row.mes)}</td>
                  <td className="p-2 text-right">{formatCompact(row.actual)}</td>
                  <td className="p-2 text-right text-muted-foreground">
                    {row.anterior ? formatCompact(row.anterior) : '—'}
                  </td>
                  <td className={`p-2 text-right ${changeColor(row.yoy)}`}>
                    {formatChange(row.yoy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartWrapper>
    </div>
  );
}
