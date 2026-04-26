import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://esports-api.lolesports.com/persisted/gw/getLive?hl=en-GB',
      {
        headers: { 'x-api-key': '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z' },
        next: { revalidate: 30 }
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}