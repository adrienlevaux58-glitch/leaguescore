import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;
    const startingTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Essayer le gameId original et gameId+1
    const gameIdNum = BigInt(gameId);
    const gameIdPlus1 = (gameIdNum + BigInt(1)).toString();

    const [res1, res2] = await Promise.all([
      fetch(`https://feed.lolesports.com/livestats/v1/window/${gameId}?startingTime=${startingTime}`, { cache: 'no-store' }),
      fetch(`https://feed.lolesports.com/livestats/v1/window/${gameIdPlus1}?startingTime=${startingTime}`, { cache: 'no-store' })
    ]);

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    // Retourner celui qui a des frames
    const frames1 = data1?.frames?.length || 0;
    const frames2 = data2?.frames?.length || 0;

    if (frames2 > frames1) {
      return NextResponse.json({ window: data2 });
    }
    return NextResponse.json({ window: data1 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 });
  }
}