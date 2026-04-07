import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as XLSX from 'xlsx';
import path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MERCO_DIR = path.join(__dirname, '..', 'merco');

/** Convert Excel serial date to "YYYY-MM" string */
function excelDateToMonth(serial: number): string {
  // Excel serial date: days since 1900-01-01 (with 1900 bug)
  const utcDays = Math.floor(serial) - 25569;
  const date = new Date(utcDays * 86400 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Clean product name (remove UPC prefix if present) */
function cleanProductName(raw: string): string {
  // Format: "7501795836520, TOSTADA ROJA 70 PZ MIMARCA"
  const commaIdx = raw.indexOf(',');
  if (commaIdx > 0 && commaIdx < 20) {
    return raw.substring(commaIdx + 1).trim();
  }
  return raw.trim();
}

async function main() {
  console.log('🌱 Starting seed...');
  console.log(`📁 Reading Excel files from: ${MERCO_DIR}`);

  // 1. Read departamentos catalog (has linea/movimiento info)
  const deptWb = XLSX.readFile(path.join(MERCO_DIR, 'catalogo_departamentos_merco.xlsx'));
  const deptData = XLSX.utils.sheet_to_json<{
    'Artículo': string;
    'Descripción Delikos': string;
    'Movimiento': string;
    'Departamento': string;
    'EAN 13': number | string;
    'Descripcion Merco': string;
  }>(deptWb.Sheets[deptWb.SheetNames[0]]);

  // Build EAN → linea/departamento lookup
  const eanToInfo = new Map<string, { linea: string; departamento: string; descripcionDelikos: string }>();
  for (const row of deptData) {
    const ean = String(row['EAN 13']).trim();
    eanToInfo.set(ean, {
      linea: row['Movimiento'] || 'Otros',
      departamento: row['Departamento'] || 'Sin departamento',
      descripcionDelikos: row['Descripción Delikos'] || '',
    });
  }

  console.log(`  📋 Departamentos: ${deptData.length} registros`);

  // 2. Read stores
  const storesWb = XLSX.readFile(path.join(MERCO_DIR, 'tiendas_merco.xls'));
  const storesData = XLSX.utils.sheet_to_json<{
    codigo_tienda: number;
    nombre_tienda: string;
  }>(storesWb.Sheets[storesWb.SheetNames[0]]);

  console.log(`  🏪 Tiendas: ${storesData.length} registros`);

  // 3. Read products
  const productsWb = XLSX.readFile(path.join(MERCO_DIR, 'productos_merco.xls'));
  const productsData = XLSX.utils.sheet_to_json<{
    upc: string | number;
    nombre_producto: string;
  }>(productsWb.Sheets[productsWb.SheetNames[0]]);

  console.log(`  📦 Productos: ${productsData.length} registros`);

  // 4. Read sales
  const salesWb = XLSX.readFile(path.join(MERCO_DIR, 'venta_merco.xls'));
  const salesData = XLSX.utils.sheet_to_json<{
    fecha: number;
    tienda_codigo: number;
    upc: string | number;
    venta_pesos: number;
    unidades: number;
  }>(salesWb.Sheets[salesWb.SheetNames[0]]);

  console.log(`  💰 Ventas: ${salesData.length} registros`);

  // ─── Clear existing data ───
  console.log('\n🗑️  Clearing existing data...');
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  // ─── Insert stores ───
  console.log('📥 Inserting stores...');
  await prisma.store.createMany({
    data: storesData.map((s) => ({
      codigoTienda: s.codigo_tienda,
      nombreTienda: s.nombre_tienda,
    })),
  });

  // ─── Insert products with linea/departamento enrichment ───
  console.log('📥 Inserting products...');
  const productRecords = productsData.map((p) => {
    const upc = String(p.upc).trim();
    const info = eanToInfo.get(upc);
    return {
      upc,
      nombreProducto: cleanProductName(p.nombre_producto),
      linea: info?.linea || inferLinea(cleanProductName(p.nombre_producto)),
      departamento: info?.departamento || 'Sin departamento',
      descripcionDelikos: info?.descripcionDelikos || null,
    };
  });

  await prisma.product.createMany({ data: productRecords });

  // Build product UPC set for validation
  const validUPCs = new Set(productRecords.map((p) => p.upc));

  // Build store codes set for validation
  const validStores = new Set(storesData.map((s) => s.codigo_tienda));

  // ─── Insert sales in batches ───
  console.log('📥 Inserting sales (batches of 1000)...');
  const saleBatches: Array<{
    fecha: string;
    tiendaCodigo: number;
    upc: string;
    ventaPesos: number;
    unidades: number;
  }> = [];

  let skipped = 0;
  for (const s of salesData) {
    const upc = String(s.upc).trim();
    if (!validUPCs.has(upc)) {
      skipped++;
      continue;
    }
    if (!validStores.has(s.tienda_codigo)) {
      skipped++;
      continue;
    }
    saleBatches.push({
      fecha: excelDateToMonth(s.fecha),
      tiendaCodigo: s.tienda_codigo,
      upc,
      ventaPesos: s.venta_pesos,
      unidades: s.unidades,
    });
  }

  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} sales with missing product/store references`);
  }

  // Insert in batches of 1000
  const BATCH_SIZE = 1000;
  for (let i = 0; i < saleBatches.length; i += BATCH_SIZE) {
    const batch = saleBatches.slice(i, i + BATCH_SIZE);
    await prisma.sale.createMany({ data: batch });
    process.stdout.write(`  ✅ ${Math.min(i + BATCH_SIZE, saleBatches.length)}/${saleBatches.length}\r`);
  }

  console.log(`\n\n🎉 Seed complete!`);
  console.log(`   Stores: ${storesData.length}`);
  console.log(`   Products: ${productRecords.length}`);
  console.log(`   Sales: ${saleBatches.length}`);

  // Print summary
  const months = [...new Set(saleBatches.map((s) => s.fecha))].sort();
  console.log(`   Months: ${months[0]} → ${months[months.length - 1]}`);
  const totalPesos = saleBatches.reduce((a, b) => a + b.ventaPesos, 0);
  console.log(`   Total sales: $${(totalPesos / 1_000_000).toFixed(1)}M MXN`);
}

/** Infer linea from product name when not in catalog */
function inferLinea(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('tostada')) return 'Tostada';
  if (lower.includes('delikos')) return 'Botanas Delikos';
  if (lower.includes('mimarca') || lower.includes('mi marca')) return 'Mi Marca';
  return 'Otros';
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
