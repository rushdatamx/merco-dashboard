'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/filter-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { formatPeriodo } from '@/lib/constants';

interface FilterOptions {
  months: string[];
  lineas: string[];
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

  const hasFilters = filters.periodoInicio || filters.linea || filters.departamento || filters.tienda || filters.producto;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3 overflow-x-auto">
        {/* Mobile brand */}
        <h1 className="lg:hidden text-lg font-bold text-brand mr-2 shrink-0">DELIKOS</h1>

        {/* Period */}
        <Select
          value={filters.periodoInicio || 'all'}
          onValueChange={(v) => dispatch({ type: 'SET_PERIODO', payload: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los meses</SelectItem>
            {options?.months.map((m) => (
              <SelectItem key={m} value={m}>{formatPeriodo(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Linea */}
        <Select
          value={filters.linea || 'all'}
          onValueChange={(v) => dispatch({ type: 'SET_LINEA', payload: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs shrink-0">
            <SelectValue placeholder="Línea" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las líneas</SelectItem>
            {options?.lineas.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
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
