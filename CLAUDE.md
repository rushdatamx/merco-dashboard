# Delikos BI Dashboard

## Descripción
Dashboard de Business Intelligence para **Delikos**, empresa mexicana de botanas.
Analiza datos de sell-out en 43+ tiendas **Merco (Chedraui)** en el norte de México.

## Datos
- **Periodo**: Ene 2025 — Mar 2026 (15 meses)
- **Volumen**: ~$29.1M MXN en ventas, ~12K filas
- **Catálogo**: 52 productos, 48 tiendas, 4 líneas de negocio
- **Fuente**: Archivos Excel en `/merco/` (sell-out Merco/Chedraui)

## Líneas de negocio
| Línea | Color | Producto principal |
|-------|-------|--------------------|
| Tostada | Naranja #F97316 | Tostada Roja 70pz (~63% ventas) |
| Botanas Delikos | Azul #3B82F6 | Papas, cacahuates Delikos |
| Mi Marca | Morado #8B5CF6 | Productos marca blanca Chedraui |
| Botana Mi Marca | Esmeralda #10B981 | Botanas marca blanca |

## Tech Stack
- **Next.js 15** (App Router, TypeScript, `src/` directory)
- **shadcn/ui** + Tailwind CSS v4 (tema oscuro permanente)
- **Recharts** para gráficas
- **Prisma** + **PostgreSQL** (Railway) para datos
- **xlsx (SheetJS)** para leer Excel en el seed script

## Arquitectura
```
Excel (merco/) → prisma/seed.ts → PostgreSQL (Railway) → API Routes → Dashboard
```

### Base de datos
- **ORM**: Prisma con output a `src/generated/prisma`
- **DB**: PostgreSQL en Railway
- **Config**: `DATABASE_URL` en `.env`
- **Modelos**: Store, Product, Sale (con relaciones)
- **Seed**: `npm run seed` lee Excel y popula la DB

### API Routes (`src/app/api/`)
| Endpoint | Descripción |
|----------|-------------|
| `/api/dashboard` | KPIs, tendencia, mix, top tiendas, insights |
| `/api/ventas` | Tendencia por línea, tabla MoM/YoY, Pareto, departamentos |
| `/api/tiendas` | Ranking, heatmap, matriz distribución |
| `/api/productos` | Tabla productos, scatter, distribución, precios |
| `/api/tendencias` | YoY, estacionalidad, MA3, descomposición crecimiento |
| `/api/filters` | Meses, líneas, tiendas disponibles para filtros |

### Frontend
- **5 páginas**: Dashboard `/`, Ventas, Tiendas, Productos, Tendencias
- **Filtros globales**: React Context (`src/contexts/filter-context.tsx`)
- **Hook de datos**: `useApi<T>()` con filtros automáticos
- **Todo en español** (labels, tooltips, títulos) — código en inglés

## Estructura de archivos clave
```
src/
├── app/
│   ├── api/          # API routes (server-side, Prisma queries)
│   ├── ventas/       # Página de ventas
│   ├── tiendas/      # Página de tiendas
│   ├── productos/    # Página de productos
│   ├── tendencias/   # Página de tendencias
│   ├── layout.tsx    # Layout raíz (sidebar, header, filtros)
│   └── page.tsx      # Dashboard principal
├── components/
│   ├── layout/       # Sidebar, Header, KPICard, MobileNav, Loading
│   ├── charts/       # ChartWrapper
│   └── ui/           # shadcn components
├── contexts/         # FilterProvider
├── hooks/            # useApi
├── lib/
│   ├── types.ts      # TypeScript types
│   ├── constants.ts  # Colores, navegación, meses
│   ├── format.ts     # Formateo MXN, números, porcentajes
│   ├── data.ts       # Capa de datos (queries Prisma)
│   ├── calculations.ts # KPIs, Pareto, insights, MA, etc.
│   ├── prisma.ts     # Singleton Prisma client
│   └── utils.ts      # cn() de shadcn
└── generated/prisma/ # Prisma client generado
```

## Comandos
```bash
npm run dev          # Development server
npm run build        # Production build
npm run seed         # Seed database from Excel files
npm run db:push      # Push Prisma schema to database
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## Reglas de diseño
- **Tema oscuro siempre** — sin toggle light/dark
- **Acentos naranja** (#F97316) — brand Delikos
- **Formato MXN** para todos los valores monetarios
- **Tostada Roja** siempre visible en gráficas
- **Responsive**: sidebar en desktop, bottom nav en mobile

## Deploy
- **Hosting**: Railway (Next.js)
- **Database**: PostgreSQL en Railway
- **Repo**: GitHub → Railway auto-deploy
