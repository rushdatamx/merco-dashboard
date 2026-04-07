import { NextResponse } from 'next/server';
import { getAvailableMonths, getAvailableLineas, getAllStores } from '@/lib/data';

export async function GET() {
  const [months, lineas, stores] = await Promise.all([
    getAvailableMonths(),
    getAvailableLineas(),
    getAllStores(),
  ]);

  return NextResponse.json({ months, lineas, stores });
}
