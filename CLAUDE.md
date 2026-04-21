# Delikos BI Dashboard

## Descripción
Dashboard de Business Intelligence para **Delikos**, empresa mexicana de botanas.
Analiza datos de sell-out en 43+ tiendas **Merco (Chedraui)** en el norte de México.

## Datos
- **Periodo**: Ene 2025 — Mar 2026 (15 meses)
- **Volumen**: ~$29.1M MXN en ventas, ~12K filas
- **Catálogo**: 52 productos, 48 tiendas, 3 departamentos
- **Fuente**: Archivos Excel en `/merco/` (sell-out Merco/Chedraui)

## Departamentos (agrupación principal)
| Departamento | Color | Descripción |
|---|---|---|
| Abarrotes | Naranja #F97316 | Departamento principal (~mayoría de ventas) |
| Panaderia | Azul #3B82F6 | Productos de panadería |
| Frutas y Verduras | Esmeralda #10B981 | Productos frescos |
| Sin departamento | Gris #6B7280 | Fallback para productos sin clasificar |

> **Nota**: El modelo Product también tiene campo `linea` (Movimiento del catálogo: Tostada, Botanas Delikos, Mi Marca, Botana Mi Marca) pero **no se usa en el dashboard**. Toda la agrupación visual y filtrado es por `departamento`.

## Tech Stack
- **Next.js 15** (App Router, TypeScript, `src/` directory)
- **shadcn/ui** + Tailwind CSS v4 (tema claro, estilo Notion/shadcn)
- **Recharts** para gráficas
- **Prisma** + **PostgreSQL** (Railway) para datos
- **xlsx (SheetJS)** para leer Excel en el seed script
- **Plus Jakarta Sans** como tipografía principal

## Arquitectura
```
Excel (merco/) → prisma/seed.ts → PostgreSQL (Railway) → API Routes → Dashboard
```

### Archivos Excel requeridos (`/merco/`)
| Archivo | Contenido | Columnas clave |
|---|---|---|
| `venta_merco.xls` | Ventas (sell-out) | fecha (serial Excel), tienda_codigo, upc, venta_pesos, unidades |
| `productos_merco.xls` | Catálogo productos | upc, nombre_producto (formato "EAN, NOMBRE") |
| `tiendas_merco.xls` | Catálogo tiendas | codigo_tienda, nombre_tienda |
| `catalogo_departamentos_merco.xlsx` | Enriquecimiento | Artículo, Descripción Delikos, Movimiento, Departamento, EAN 13, Descripcion Merco |

### Base de datos (Prisma + PostgreSQL)
- **ORM**: Prisma con output a `src/generated/prisma`
- **DB**: PostgreSQL en Railway
- **Config**: `DATABASE_URL` en `.env`
- **Modelos**:
  - `Store`: id, codigoTienda (unique), nombreTienda
  - `Product`: id, upc (unique), nombreProducto, linea?, departamento?, descripcionDelikos?
  - `Sale`: id, fecha ("YYYY-MM"), ventaPesos, unidades, tiendaCodigo → Store, upc → Product
- **Seed**: `npm run seed` lee los 4 Excel, enriquece productos con catálogo de departamentos, e inserta en batches de 1000

### Seed: lógica de enriquecimiento
1. Lee `catalogo_departamentos_merco.xlsx` → mapa EAN → {linea, departamento, descripcionDelikos}
2. Para cada producto en `productos_merco.xls`:
   - Busca su UPC en el mapa del catálogo
   - Si encuentra: asigna linea + departamento del catálogo
   - Si no encuentra: infiere `linea` del nombre (Tostada/Delikos/Mi Marca), departamento = "Sin departamento"
3. Limpia nombre del producto (quita prefijo UPC antes de coma)
4. Fechas Excel: serial → "YYYY-MM" (`utcDays = serial - 25569`)

### API Routes (`src/app/api/`)
| Endpoint | Descripción |
|---|---|
| `/api/dashboard` | KPIs, tendencia mensual, mix por departamento, top 10 tiendas, insights |
| `/api/ventas` | Tendencia por departamento (stacked), tabla MoM/YoY, Pareto, resumen departamentos |
| `/api/tiendas` | Ranking tiendas, heatmap tienda×mes, matriz distribución tienda×departamento |
| `/api/productos` | Tabla productos, scatter, distribución, precios, comparación entre departamentos |
| `/api/tendencias` | YoY, estacionalidad, MA3, descomposición crecimiento |
| `/api/filters` | Meses disponibles, departamentos, tiendas, productos para filtros globales |

Todas las rutas aceptan query params: `fechaInicio`, `fechaFin`, `departamento`, `tiendaCodigo`, `upc`.

### Frontend
- **5 páginas**: Dashboard `/`, Ventas, Tiendas, Productos, Tendencias
- **Filtros globales**: React Context (`src/contexts/filter-context.tsx`)
  - **Rango de fechas**: dos selectores Desde/Hasta (dispatcha `SET_PERIODO_RANGO`)
  - **Departamento**: selector que filtra por departamento
  - **Tienda**: selector por tienda individual
  - **Producto**: selector por UPC
  - **Limpiar**: botón reset
- **Hook de datos**: `useApi<T>(endpoint)` — automáticamente agrega filtros del context como query params
- **Todo en español** (labels, tooltips, títulos) — código en inglés

### Visualizaciones por página
| Página | Visualizaciones |
|---|---|
| Dashboard `/` | 6 KPI cards, line chart tendencia, pie chart mix departamentos, bar chart top tiendas, insights automáticos |
| Ventas | Stacked area por departamento, tabla MoM/YoY, bar chart por departamento, Pareto 80/20 |
| Tiendas | Ranking tabla sorteable, scatter volumen vs crecimiento, heatmap tienda×mes, matriz distribución tienda×departamento |
| Productos | Tabla con sparklines + badge departamento, scatter crecimiento vs volumen, bar distribución por tiendas, bar precios, bar comparación departamentos |
| Tendencias | YoY, estacionalidad, media móvil 3m, descomposición crecimiento |

## Estructura de archivos clave
```
src/
├── app/
│   ├── api/             # API routes (server-side, Prisma queries)
│   │   ├── dashboard/   # KPIs + insights
│   │   ├── ventas/      # Tendencia + Pareto
│   │   ├── tiendas/     # Ranking + heatmap + matriz
│   │   ├── productos/   # Tabla + scatter + departamentos
│   │   ├── tendencias/  # YoY + estacionalidad
│   │   └── filters/     # Opciones para filtros globales
│   ├── ventas/          # Página de ventas
│   ├── tiendas/         # Página de tiendas
│   ├── productos/       # Página de productos
│   ├── tendencias/      # Página de tendencias
│   ├── layout.tsx       # Layout raíz (sidebar, header, filtros)
│   └── page.tsx         # Dashboard principal
├── components/
│   ├── layout/          # Sidebar, Header, KPICard, MobileNav, Loading
│   ├── charts/          # ChartWrapper
│   └── ui/              # shadcn components
├── contexts/
│   └── filter-context.tsx  # FilterProvider + useFilters (estado global de filtros)
├── hooks/
│   └── use-api.ts       # useApi<T>() — fetch con filtros automáticos
├── lib/
│   ├── types.ts         # TypeScript types (Sale, Product, Store, DepartamentoSummary, FilterState, etc.)
│   ├── constants.ts     # DEPARTAMENTO_COLORS, NAV_ITEMS, meses en español
│   ├── format.ts        # formatMXN, formatNumber, formatCompact, formatChange, changeColor
│   ├── data.ts          # Capa de datos: getEnrichedSales, getMonthlySummary, getStorePerformance, getProductPerformance, getDepartamentoSummary, getAvailableDepartamentos
│   ├── calculations.ts  # calculateKPIs, calculatePareto, generateInsights, calculateSeasonality, calculateMovingAverage, decomposeGrowth
│   ├── prisma.ts        # Singleton Prisma client
│   └── utils.ts         # cn() de shadcn
├── generated/prisma/    # Prisma client generado
└── globals.css          # Tailwind + custom styles
prisma/
├── schema.prisma        # Schema: Store, Product, Sale
└── seed.ts              # Script de seed (Excel → DB)
merco/                   # Archivos Excel fuente
```

## Comandos
```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run seed         # Seed database from Excel files
npm run db:push      # Push Prisma schema to database
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## Reglas de diseño
- **Tema claro** — estilo Notion/shadcn, sin toggle dark/light
- **Acentos naranja** (#F97316) — brand Delikos
- **Formato MXN** para todos los valores monetarios
- **Colores por departamento**: Abarrotes=#F97316, Panaderia=#3B82F6, Frutas y Verduras=#10B981
- **Responsive**: sidebar en desktop, bottom nav en mobile
- **Tipografía**: Plus Jakarta Sans

## Deploy
- **Hosting**: Vercel (auto-deploy desde GitHub)
- **Database**: PostgreSQL en Railway
- **Repo**: GitHub (`rushdatamx/merco-dashboard`) → Vercel auto-deploy

## Cómo recrear para otra cadena
Para crear un dashboard similar con datos de otra cadena (ej. Alsuper, HEB, etc.):

1. **Datos**: Preparar los 4 archivos Excel en `/[cadena]/` con las mismas columnas
2. **Seed**: Ajustar `prisma/seed.ts` — cambiar `MERCO_DIR`, adaptar nombres de columnas si difieren
3. **DB**: Crear nueva PostgreSQL, configurar `DATABASE_URL`
4. **Catálogo de departamentos**: El archivo clave es `catalogo_departamentos_[cadena].xlsx` — mapea productos a departamentos. Si no existe, todos los productos quedan como "Sin departamento"
5. **Colores**: Ajustar `DEPARTAMENTO_COLORS` en `constants.ts` si la cadena tiene departamentos distintos
6. **Brand**: Cambiar `BRAND.primary` en `constants.ts`, nombre en sidebar/layout
7. **Run**: `npm run db:push && npm run seed && npm run build`
