'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFilters } from '@/contexts/filter-context';

export function useApi<T>(endpoint: string, extraParams?: Record<string, string>) {
  const { queryParams } = useFilters();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allParams = { ...queryParams, ...extraParams };
      const qs = new URLSearchParams(allParams).toString();
      const url = `/api/${endpoint}${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [endpoint, queryParams, extraParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
