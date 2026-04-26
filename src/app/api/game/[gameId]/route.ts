import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;

    const windowRes = await fetch(
      `https://feed.lolesports.com/livestats/v1/window/${gameId}`,
      { next: { revalidate: 10 } }
    );

    const windowData = await windowRes.json();
    return NextResponse.json({ window: windowData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 });
  }
}