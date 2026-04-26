import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;

    const response = await fetch(
      `https://esports-api.lolesports.com/persisted/gw/getEventDetails?hl=en-GB&id=${matchId}`,
      {
        headers: { 'x-api-key': '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z' },
        next: { revalidate: 60 }
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event details' }, { status: 500 });
  }
}