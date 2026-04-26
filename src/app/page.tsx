"use client";
import { useState, useEffect } from "react";

interface Team {
  id: string;
  name: string;
  code: string;
  image: string;
  result: { outcome: string | null; gameWins: number };
  record: { wins: number; losses: number };
}

interface Match {
  id: string;
  startTime: string;
  state: string;
  blockName: string;
  league: { name: string; slug: string; image: string };
  match: {
    teams: Team[];
    strategy: { count: number };
    games: { number: number; state: string }[];
  };
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState("All");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchLive = async () => {
    try {
      const res = await fetch("/api/live");
      const data = await res.json();
      const events = data?.data?.schedule?.events || [];
      setMatches(events);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  const leagues = ["All", ...Array.from(new Set(matches.map(m => m.league.name)))];

  const filteredMatches = activeLeague === "All"
    ? matches
    : matches.filter(m => m.league.name === activeLeague);

  const getCurrentGame = (match: Match) => {
    return match.match.games.filter(g => g.state === "inProgress").length ||
      match.match.games.filter(g => g.state === "completed").length;
  };

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white">

      {/* HEADER */}
      <header className="border-b border-[#1e2a3a] bg-[#0d1220] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C89B3C] rounded-lg flex items-center justify-center font-black text-black text-sm">LS</div>
            <span className="font-black text-xl tracking-tight">League<span className="text-[#C89B3C]">Score</span></span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="text-white font-semibold">Scores</a>
            <a href="#" className="hover:text-white transition">Standings</a>
            <a href="#" className="hover:text-white transition">Teams</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* LIVE HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-bold tracking-wider">LIVE</span>
            </div>
            <h1 className="text-2xl font-black">Live Matches</h1>
            <span className="text-gray-500 text-sm">{matches.length} match{matches.length > 1 ? "es" : ""}</span>
          </div>
          {lastUpdate && (
            <span className="text-gray-600 text-xs">Updated {lastUpdate}</span>
          )}
        </div>

        {/* LEAGUE TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                activeLeague === league
                  ? "bg-[#C89B3C] text-black"
                  : "bg-[#1e2a3a] text-gray-400 hover:text-white"
              }`}
            >
              {league}
            </button>
          ))}
        </div>

        {/* MATCHES */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0d1220] border border-[#1e2a3a] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-[#1e2a3a] rounded w-32 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-[#1e2a3a] rounded w-40"></div>
                  <div className="h-8 bg-[#1e2a3a] rounded w-20"></div>
                  <div className="h-6 bg-[#1e2a3a] rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="font-black text-2xl mb-2">No Live Matches</h2>
            <p className="text-gray-500">Check back when tournaments are live!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((event) => {
              const team1 = event.match.teams[0];
              const team2 = event.match.teams[1];
              const currentGame = getCurrentGame(event);
              const isLive = event.state === "inProgress";

              return (
                <div
                  key={event.id}
                  className={`bg-[#0d1220] border rounded-xl p-5 cursor-pointer transition ${
                    isLive
                      ? "border-[#C89B3C]/40 hover:border-[#C89B3C]/80"
                      : "border-[#1e2a3a] hover:border-[#2e3a4a]"
                  }`}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 text-xs font-bold">LIVE</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <img
                          src={event.league.image}
                          alt={event.league.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-gray-400 text-sm font-bold">{event.league.name}</span>
                      </div>
                      <span className="text-gray-600 text-xs">{event.blockName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentGame > 0 && (
                        <span className="text-gray-500 text-xs bg-[#1e2a3a] px-2 py-1 rounded-lg">
                          Game {currentGame} · Bo{event.match.strategy.count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between">
                    {/* Team 1 */}
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={team1?.image}
                        alt={team1?.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                      />
                      <div>
                        <div className="font-black text-lg">{team1?.code}</div>
                        <div className="text-gray-500 text-xs">{team1?.record.wins}W {team1?.record.losses}L</div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center px-6">
                      {isLive ? (
                        <div className="font-black text-3xl text-[#C89B3C]">
                          {team1?.result.gameWins} — {team2?.result.gameWins}
                        </div>
                      ) : (
                        <div className="font-bold text-gray-500 text-xl">VS</div>
                      )}
                      <div className="text-gray-600 text-xs mt-1">
                        Bo{event.match.strategy.count}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <div className="font-black text-lg">{team2?.code}</div>
                        <div className="text-gray-500 text-xs">{team2?.record.wins}W {team2?.record.losses}L</div>
                      </div>
                      <img
                        src={team2?.image}
                        alt={team2?.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}