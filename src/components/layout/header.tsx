'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/filter-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { formatPeriodo } from '@/lib/constants';

interface FilterOptions {
  months: string[];
  departamentos: string[];
  stores: { codigoTienda: number; nombreTienda: string }[];
  products: { upc: string; nombreProducto: string }[];
}

export function Header() {
  const { filters, dispatch } = useFilters();
  const [options, setOptions] = useState<FilterOptions | null>(null);

  useEffect(() => {
    fetch('/api/filters')
      .then((r) => r.json())
      .then(setOptions)
      .catch(console.error);
  }, []);

  const hasFilters = filters.periodoInicio || filters.periodoFin || filters.departamento || filters.tienda || filters.producto;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3 overflow-x-auto">
        {/* Mobile brand */}
        <h1 className="lg:hidden text-lg font-bold text-brand mr-2 shrink-0">DELIKOS</h1>

        {/* Date range: Desde */}
        <Select
          value={filters.periodoInicio || 'all'}
          onValueChange={(v) => {
            const inicio = v === 'all' ? null : v;
            dispatch({ type: 'SET_PERIODO_RANGO', payload: { inicio, fin: filters.periodoFin } });
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Desde" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Desde inicio</SelectItem>
            {options?.months.map((m) => (
              <SelectItem key={m} value={m}>{formatPeriodo(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range: Hasta */}
        <Select
          value={filters.periodoFin || 'all'}
          onValueChange={(v) => {
            const fin = v === 'all' ? null : v;
            dispatch({ type: 'SET_PERIODO_RANGO', payload: { inicio: filters.periodoInicio, fin } });
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Hasta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hasta hoy</SelectItem>
            {options?.months.map((m) => (
              <SelectItem key={m} value={m}>{formatPeriodo(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Departamento */}
        <Select
          value={filters.departamento || 'all'}
          onValueChange={(v) => dispatch({ type: 'SET_DEPARTAMENTO', payload: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {options?.departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tienda */}
        <Select
          value={filters.tienda ? String(filters.tienda) : 'all'}
          onValueChange={(v) => dispatch({ type: 'SET_TIENDA', payload: v === 'all' ? null : Number(v) })}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Tienda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tiendas</SelectItem>
            {options?.stores.map((s) => (
              <SelectItem key={s.codigoTienda} value={String(s.codigoTienda)}>
                {s.nombreTienda}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Producto */}
        <Select
          value={filters.producto || 'all'}
          onValueChange={(v) => dispatch({ type: 'SET_PRODUCTO', payload: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[200px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {options?.products.map((p) => (
              <SelectItem key={p.upc} value={p.upc}>
                {p.nombreProducto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'RESET' })}
            className="h-8 text-xs text-muted-foreground shrink-0"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </header>
  );
}
