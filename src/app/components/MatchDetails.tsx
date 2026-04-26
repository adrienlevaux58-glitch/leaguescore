"use client";
import { useState, useEffect } from "react";
import LiveGameStats from "./LiveGameStats";

interface GameDetail {
  number: number;
  id: string;
  state: string;
}

interface TeamDetail {
  id: string;
  name: string;
  code: string;
  image: string;
  result: { gameWins: number };
}

interface EventDetail {
  match: {
    teams: TeamDetail[];
    games: GameDetail[];
    strategy: { count: number };
  };
}

export default function MatchDetails({ matchId }: { matchId: string }) {
  const [data, setData] = useState<EventDetail | null>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/event/${matchId}`);
        const json = await res.json();
        const event = json?.data?.event;
        if (event) {
          setData(event);
          const completedGames = event.match.games.filter((g: GameDetail) => g.state === "completed");
          if (completedGames.length > 0) {
            setActiveGame(completedGames[completedGames.length - 1].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [matchId]);

  if (loading) {
    return (
      <div className="mt-4 bg-[#080c18] rounded-xl p-4 animate-pulse">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-20 bg-[#1e2a3a] rounded-lg"></div>
          ))}
        </div>
        <div className="h-40 bg-[#1e2a3a] rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const completedGames = data.match.games.filter(g => g.state === "completed");
  const team1 = data.match.teams[0];
  const team2 = data.match.teams[1];

  return (
    <div className="mt-4">
      {/* Game tabs */}
      <div className="flex gap-2 mb-3">
        {completedGames.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeGame === game.id
                ? "bg-[#C89B3C] text-black"
                : "bg-[#1e2a3a] text-gray-400 hover:text-white"
            }`}
          >
            Game {game.number}
          </button>
        ))}
      </div>

      {/* Stats */}
      {activeGame && (
        <LiveGameStats
          gameId={activeGame}
          blueTeamName={team1?.code}
          redTeamName={team2?.code}
          games={completedGames}
        />
      )}
    </div>
  );
}