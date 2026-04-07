import { NextResponse } from 'next/server';
import { getAvailableMonths, getAvailableLineas, getAllStores } from '@/lib/data';

export async function GET() {
  try {
    const [months, lineas, stores] = await Promise.all([
      getAvailableMonths(),
      getAvailableLineas(),
      getAllStores(),
    ]);

    return NextResponse.json({ months, lineas, stores });
  } catch (error) {
    console.error('API /filters error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
