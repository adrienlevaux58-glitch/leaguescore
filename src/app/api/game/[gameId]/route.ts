import { NextRequest, NextResponse } from 'next/server';

type LiveStatsWindowResponse = {
  esportsGameId?: string;
  frames?: unknown[];
  httpStatus?: number;
  message?: string;
};

type CandidateResult = {
  candidateGameId: string;
  startingTime: string;
  httpStatus: number;
  frames: number;
  payload: LiveStatsWindowResponse;
};

const WINDOW_LOOKBACKS_MS = [5 * 60 * 1000, 20 * 60 * 1000, 45 * 60 * 1000];
const GAME_ID_OFFSETS = [0n, 1n, -1n, 2n, -2n];

async function fetchWindow(candidateGameId: string, startingTime: string): Promise<CandidateResult> {
  const response = await fetch(
    `https://feed.lolesports.com/livestats/v1/window/${candidateGameId}?startingTime=${startingTime}`,
    {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LeagueScore/1.0 (+https://github.com)',
      },
    }
  );

  const payload = (await response.json()) as LiveStatsWindowResponse;

  return {
    candidateGameId,
    startingTime,
    httpStatus: response.status,
    frames: payload?.frames?.length ?? 0,
    payload,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;
    const gameIdNum = BigInt(gameId);

    const candidateIds = Array.from(
      new Set(GAME_ID_OFFSETS.map((offset) => (gameIdNum + offset).toString()))
    );

    const startingTimes = WINDOW_LOOKBACKS_MS.map((lookbackMs) =>
      new Date(Date.now() - lookbackMs).toISOString()
    );

    const attempts = await Promise.all(
      candidateIds.flatMap((candidateGameId) =>
        startingTimes.map((startingTime) => fetchWindow(candidateGameId, startingTime))
      )
    );

    const best = attempts
      .slice()
      .sort((a, b) => b.frames - a.frames || b.httpStatus - a.httpStatus)[0];

    if (best && best.frames > 0 && best.httpStatus === 200) {
      return NextResponse.json({
        window: best.payload,
        diagnostics: {
          selectedGameId: best.candidateGameId,
          selectedStartingTime: best.startingTime,
          topCandidates: attempts
            .sort((a, b) => b.frames - a.frames)
            .slice(0, 5)
            .map(({ candidateGameId, startingTime, httpStatus, frames }) => ({
              candidateGameId,
              startingTime,
              httpStatus,
              frames,
            })),
        },
      });
    }

    return NextResponse.json(
      {
        error: 'Live stats not available for this gameId yet',
        diagnostics: {
          requestedGameId: gameId,
          triedGameIds: candidateIds,
          attempts: attempts.map(({ candidateGameId, startingTime, httpStatus, frames, payload }) => ({
            candidateGameId,
            startingTime,
            httpStatus,
            frames,
            providerStatus: payload?.httpStatus,
            providerMessage: payload?.message,
          })),
        },
      },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch game data',
        diagnostics: {
          reason: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
