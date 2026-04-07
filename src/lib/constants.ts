// ─── Colores por línea de negocio ───
export const LINEA_COLORS: Record<string, string> = {
  'Tostada': '#F97316',          // naranja
  'Botanas Delikos': '#3B82F6',  // azul
  'Mi Marca': '#8B5CF6',         // morado
  'Botana Mi Marca': '#10B981',  // esmeralda
  'Otros': '#6B7280',            // gris
};

// Para Recharts
export const LINEA_CHART_COLORS = [
  '#F97316', // Tostada - naranja
  '#3B82F6', // Botanas Delikos - azul
  '#8B5CF6', // Mi Marca - morado
  '#10B981', // Botana Mi Marca - esmeralda
  '#6B7280', // Otros - gris
];

// ─── Brand ───
export const BRAND = {
  primary: '#F97316',    // naranja Delikos
  primaryLight: '#FB923C',
  primaryDark: '#EA580C',
  background: '#0F0F0F',
  cardBg: '#1A1A1A',
  border: '#2A2A2A',
};

// ─── Navegación ───
export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/ventas', label: 'Ventas', icon: 'TrendingUp' },
  { href: '/tiendas', label: 'Tiendas', icon: 'Store' },
  { href: '/productos', label: 'Productos', icon: 'Package' },
  { href: '/tendencias', label: 'Tendencias', icon: 'BarChart3' },
] as const;

// ─── Líneas de negocio conocidas ───
export const LINEAS_NEGOCIO = [
  'Tostada',
  'Botanas Delikos',
  'Mi Marca',
  'Botana Mi Marca',
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
