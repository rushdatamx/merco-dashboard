import { NextResponse } from 'next/server';
import { getAvailableMonths, getAvailableDepartamentos, getAllStores, getAllProducts } from '@/lib/data';

export async function GET() {
  try {
    const [months, departamentos, stores, products] = await Promise.all([
      getAvailableMonths(),
      getAvailableDepartamentos(),
      getAllStores(),
      getAllProducts(),
    ]);

    return NextResponse.json({ months, departamentos, stores, products });
  } catch (error) {
    console.error('API /filters error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
