import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://esports-api.lolesports.com/persisted/gw/getSchedule?hl=en-GB',
      {
        headers: { 'x-api-key': '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z' },
        next: { revalidate: 60 }
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}