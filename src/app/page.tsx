'use client';

import { useMemo } from 'react';
import { DollarSign, ShoppingCart, Store, Package, TrendingUp, Receipt } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { useApi } from '@/hooks/use-api';
import { KPICard } from '@/components/layout/kpi-card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { LoadingPage } from '@/components/layout/loading';
import { Badge } from '@/components/ui/badge';
import { formatMXN, formatNumber, formatCompact } from '@/lib/format';
import { formatPeriodo, LINEA_COLORS } from '@/lib/constants';
import type { MonthlySummary, LineaSummary, StorePerformance, Insight } from '@/lib/types';

interface DashboardResponse {
  kpis: {
    ventaMesActual: number;
    unidadesMesActual: number;
    tiendasActivas: number;
    skusActivos: number;
    ventaPromedioTienda: number;
    ticketPromedio: number;
    cambioVentas: number | null;
    cambioUnidades: number | null;
    totalVentas: number;
    totalUnidades: number;
    mesActual: string;
  };
  tendenciaMensual: MonthlySummary[];
  mixLineas: LineaSummary[];
  topTiendas: StorePerformance[];
  insights: Insight[];
}

export default function DashboardPage() {
  const { data, loading } = useApi<DashboardResponse>('dashboard');

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.tendenciaMensual.map((m) => ({
      ...m,
      label: formatPeriodo(m.mes),
    }));
  }, [data]);

  if (loading || !data) return <LoadingPage />;

  const { kpis, mixLineas, topTiendas, insights } = data;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Vista ejecutiva — Sell-out Merco (Chedraui)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          titulo="Ventas del mes"
          valor={formatCompact(kpis.ventaMesActual)}
          cambio={kpis.cambioVentas}
          icono={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          titulo="Unidades"
          valor={formatNumber(kpis.unidadesMesActual)}
          cambio={kpis.cambioUnidades}
          icono={<ShoppingCart className="h-4 w-4" />}
        />
        <KPICard
          titulo="Tiendas activas"
          valor={String(kpis.tiendasActivas)}
          icono={<Store className="h-4 w-4" />}
        />
        <KPICard
          titulo="SKUs activos"
          valor={String(kpis.skusActivos)}
          icono={<Package className="h-4 w-4" />}
        />
        <KPICard
          titulo="Venta prom./tienda"
          valor={formatCompact(kpis.ventaPromedioTienda)}
          icono={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          titulo="Ticket promedio"
          valor={formatMXN(kpis.ticketPromedio)}
          icono={<Receipt className="h-4 w-4" />}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartWrapper titulo="Tendencia de ventas" subtitulo="15 meses (pesos)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXN(Number(value)), 'Ventas']}
              />
              <Line
                type="monotone"
                dataKey="ventaPesos"
                stroke="#F97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#F97316' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper titulo="Mix por línea" subtitulo="Distribución de ventas">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mixLineas}
                dataKey="ventaTotal"
                nameKey="linea"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {mixLineas.map((entry) => (
                  <Cell
                    key={entry.linea}
                    fill={LINEA_COLORS[entry.linea] || LINEA_COLORS['Otros']}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXN(Number(value)), 'Ventas']}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper titulo="Top 10 tiendas" subtitulo="Por venta total">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topTiendas} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => formatCompact(v)} />
              <YAxis
                type="category"
                dataKey="nombreTienda"
                width={140}
                tick={{ fontSize: 9, fill: '#6b7280' }}
                tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + '...' : v}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatMXN(Number(value)), 'Ventas']}
              />
              <Bar dataKey="ventaTotal" fill="#F97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper titulo="Insights automáticos" subtitulo="Alertas y oportunidades detectadas">
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge
                  variant={insight.tipo === 'alerta' ? 'destructive' : 'default'}
                  className="shrink-0 mt-0.5 text-[10px]"
                >
                  {insight.tipo === 'alerta' ? 'Alerta' : insight.tipo === 'oportunidad' ? 'Oportunidad' : 'Info'}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{insight.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.descripcion}</p>
                  {insight.valor && (
                    <p className="text-xs font-mono text-brand mt-1">{insight.valor}</p>
                  )}
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin alertas activas
              </p>
            )}
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}
