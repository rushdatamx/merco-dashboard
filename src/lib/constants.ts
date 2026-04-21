// ─── Colores por departamento ───
export const DEPARTAMENTO_COLORS: Record<string, string> = {
  'Abarrotes': '#F97316',          // naranja
  'Panaderia': '#3B82F6',          // azul
  'Frutas y Verduras': '#10B981',  // esmeralda
  'Sin departamento': '#6B7280',   // gris
};

// Para Recharts
export const DEPARTAMENTO_CHART_COLORS = [
  '#F97316', // Abarrotes - naranja
  '#3B82F6', // Panaderia - azul
  '#10B981', // Frutas y Verduras - esmeralda
  '#6B7280', // Sin departamento - gris
];

// ─── Brand ───
export const BRAND = {
  primary: '#F97316',    // naranja Delikos
  primaryLight: '#FB923C',
  primaryDark: '#EA580C',
  background: '#FAFAFA',
  cardBg: '#FFFFFF',
  border: '#E5E5E5',
};

// ─── Navegación ───
export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/ventas', label: 'Ventas', icon: 'TrendingUp' },
  { href: '/tiendas', label: 'Tiendas', icon: 'Store' },
  { href: '/productos', label: 'Productos', icon: 'Package' },
  { href: '/tendencias', label: 'Tendencias', icon: 'BarChart3' },
] as const;

// ─── Meses en español ───
export const MESES_ES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

export const MESES_COMPLETO: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
};

// ─── Formato de periodo legible ───
export function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-');
  return `${MESES_ES[month]} ${year}`;
}

export function formatPeriodoCompleto(periodo: string): string {
  const [year, month] = periodo.split('-');
  return `${MESES_COMPLETO[month]} ${year}`;
}
