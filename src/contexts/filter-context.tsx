'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { FilterState, FilterAction } from '@/lib/types';

const initialState: FilterState = {
  periodo: null,
  periodoInicio: null,
  periodoFin: null,
  departamento: null,
  tienda: null,
  producto: null,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_PERIODO':
      return { ...state, periodo: action.payload, periodoInicio: action.payload, periodoFin: action.payload };
    case 'SET_PERIODO_RANGO':
      return { ...state, periodo: null, periodoInicio: action.payload.inicio, periodoFin: action.payload.fin };
    case 'SET_DEPARTAMENTO':
      return { ...state, departamento: action.payload };
    case 'SET_TIENDA':
      return { ...state, tienda: action.payload };
    case 'SET_PRODUCTO':
      return { ...state, producto: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface FilterContextType {
  filters: FilterState;
  dispatch: React.Dispatch<FilterAction>;
  queryParams: Record<string, string>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, initialState);

  // Build query params for API calls
  const queryParams: Record<string, string> = {};
  if (filters.periodoInicio) queryParams.fechaInicio = filters.periodoInicio;
  if (filters.periodoFin) queryParams.fechaFin = filters.periodoFin;
  if (filters.departamento) queryParams.departamento = filters.departamento;
  if (filters.tienda) queryParams.tiendaCodigo = String(filters.tienda);
  if (filters.producto) queryParams.upc = filters.producto;

  return (
    <FilterContext.Provider value={{ filters, dispatch, queryParams }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
