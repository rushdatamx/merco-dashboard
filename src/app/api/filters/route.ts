import { NextResponse } from 'next/server';
import { getAvailableMonths, getAvailableLineas, getAllStores, getAllProducts } from '@/lib/data';

export async function GET() {
  try {
    const [months, lineas, stores, products] = await Promise.all([
      getAvailableMonths(),
      getAvailableLineas(),
      getAllStores(),
      getAllProducts(),
    ]);

    return NextResponse.json({ months, lineas, stores, products });
  } catch (error) {
    console.error('API /filters error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
