const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const mxnDecimalFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format as MXN currency (no decimals) — "$1,234,567" */
export function formatMXN(value: number): string {
  return mxnFormatter.format(value);
}

/** Format as MXN currency with decimals — "$1,234.56" */
export function formatMXNDecimal(value: number): string {
  return mxnDecimalFormatter.format(value);
}

/** Format number with thousands separator — "1,234,567" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Format as percentage — "12.3%" */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

/** Format large numbers in compact form — "$1.2M", "$456K" */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return formatMXN(value);
}

/** Format change percentage with sign — "+12.3%" or "-5.2%" */
export function formatChange(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/** Determine color class based on change direction */
export function changeColor(value: number | null | undefined): string {
  if (value == null) return 'text-muted-foreground';
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-red-500';
  return 'text-muted-foreground';
}
