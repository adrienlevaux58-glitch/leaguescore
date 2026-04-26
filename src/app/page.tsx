"use client";
import { useState, useEffect } from "react";
import LiveGameStats from "./components/LiveGameStats";

interface Team {
  id?: string;
  name: string;
  code: string;
  image: string;
  result: { outcome: string | null; gameWins: number };
  record: { wins: number; losses: number } | null;
}

interface Game {
  number: number;
  id: string;
  state: string;
}

interface Match {
  id?: string;
  startTime: string;
  state: string;
  type?: string;
  blockName: string;
  league: { name: string; slug: string; image?: string };
  match: {
    id?: string;
    teams: Team[];
    strategy: { count: number };
    games?: Game[];
  };
}

export default function Home() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [scheduleMatches, setScheduleMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState("All");
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "results">("live");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      const [liveRes, scheduleRes] = await Promise.all([
        fetch("/api/live"),
        fetch("/api/schedule")
      ]);
      const liveData = await liveRes.json();
      const scheduleData = await scheduleRes.json();
     setLiveMatches((liveData?.data?.schedule?.events || []).filter((e: Match) => e.type === "match"));
      setScheduleMatches(scheduleData?.data?.schedule?.events || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const upcoming = scheduleMatches.filter(m =>
    m.state === "unstarted" && new Date(m.startTime) > now
  );
  const results = scheduleMatches.filter(m =>
    m.state === "completed" ||
    (m.state === "unstarted" && new Date(m.startTime) < now)
  );

  const getCurrentMatches = () => {
    if (activeTab === "live") return liveMatches;
    if (activeTab === "upcoming") return upcoming;
    return results;
  };

  const allMatches = getCurrentMatches();
  const leagues = ["All", ...Array.from(new Set(allMatches.map(m => m.league.name)))];
  const filteredMatches = activeLeague === "All"
    ? allMatches
    : allMatches.filter(m => m.league.name === activeLeague);

  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (time: string) =>
    new Date(time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const getCurrentGame = (match: Match) => {
    if (!match.match.games) return 1;
    return match.match.games.filter(g => g.state === "inProgress").length ||
      match.match.games.filter(g => g.state === "completed").length || 1;
  };

  const getLiveGameId = (match: Match): string | null => {
    if (!match.match.games) return null;
    const inProgress = match.match.games.find(g => g.state === "inProgress");
    return inProgress?.id || match.match.games[0]?.id || null;
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

        {/* TABS */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#0d1220] border border-[#1e2a3a] rounded-xl p-1">
            <button
              onClick={() => { setActiveTab("live"); setActiveLeague("All"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "live" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-gray-500 hover:text-white"}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === "live" ? "bg-red-500 animate-pulse" : "bg-gray-600"}`}></div>
              LIVE
              {liveMatches.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{liveMatches.length}</span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("upcoming"); setActiveLeague("All"); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "upcoming" ? "bg-[#1e2a3a] text-white" : "text-gray-500 hover:text-white"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => { setActiveTab("results"); setActiveLeague("All"); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "results" ? "bg-[#1e2a3a] text-white" : "text-gray-500 hover:text-white"}`}
            >
              Results
            </button>
          </div>
          {lastUpdate && (
            <span className="text-gray-600 text-xs">Updated {lastUpdate}</span>
          )}
        </div>

        {/* LEAGUE TABS */}
        {leagues.length > 1 && (
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
        )}

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
            <h2 className="font-black text-2xl mb-2">
              {activeTab === "live" ? "No Live Matches" : activeTab === "upcoming" ? "No Upcoming Matches" : "No Results Yet"}
            </h2>
            <p className="text-gray-500">
              {activeTab === "live" ? "Check back when tournaments are live!" : "Check back later!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((event, idx) => {
const team1 = event.match?.teams?.[0];
const team2 = event.match?.teams?.[1];
if (!team1 || !team2) return null;
              const isLive = event.state === "inProgress";
              const isCompleted = event.state === "completed";
              const currentGame = isLive ? getCurrentGame(event) : null;
              const winner1 = team1?.result?.outcome === "win";
              const winner2 = team2?.result?.outcome === "win";
              const liveGameId = isLive ? getLiveGameId(event) : null;

              return (
                <div
                  key={event.match.id || idx}
                  className={`bg-[#0d1220] border rounded-xl p-5 transition ${
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
                      {event.league.image && (
                        <img
                          src={event.league.image}
                          alt={event.league.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="text-gray-300 text-sm font-bold">{event.league.name}</span>
                      <span className="text-gray-600 text-xs">{event.blockName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-gray-500 text-xs">{formatDate(event.startTime)}</span>
                      )}
                      {!isLive && !isCompleted && (
                        <span className="text-[#C89B3C] text-sm font-bold">{formatTime(event.startTime)}</span>
                      )}
                      {currentGame && (
                        <span className="text-gray-500 text-xs bg-[#1e2a3a] px-2 py-1 rounded-lg">
                          Game {currentGame} · Bo{event.match.strategy.count}
                        </span>
                      )}
                      {!isLive && (
                        <span className="text-gray-600 text-xs bg-[#1e2a3a] px-2 py-1 rounded-lg">
                          Bo{event.match.strategy.count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 flex-1 ${isCompleted && !winner1 ? "opacity-50" : ""}`}>
                      <img
                        src={team1?.image}
                        alt={team1?.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-black text-lg">
                          {team1?.code}
                          {winner1 && <span className="ml-2 text-green-400 text-xs">WIN</span>}
                        </div>
                        <div className="text-gray-500 text-xs">{team1?.record?.wins ?? 0}W {team1?.record?.losses ?? 0}L</div>
                      </div>
                    </div>

                    <div className="text-center px-6">
                      {isLive ? (
                        <div className="font-black text-3xl text-[#C89B3C]">
                          {team1?.result.gameWins} — {team2?.result.gameWins}
                        </div>
                      ) : isCompleted ? (
                        <div className="font-black text-3xl text-white">
                          {team1?.result.gameWins} — {team2?.result.gameWins}
                        </div>
                      ) : (
                        <div className="font-bold text-gray-500 text-xl">VS</div>
                      )}
                      <div className="text-gray-600 text-xs mt-1">
                        {isLive ? `Bo${event.match.strategy.count}` : !isCompleted ? formatDate(event.startTime) : "Final"}
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 flex-1 justify-end ${isCompleted && !winner2 ? "opacity-50" : ""}`}>
                      <div className="text-right">
                        <div className="font-black text-lg">
                          {winner2 && <span className="mr-2 text-green-400 text-xs">WIN</span>}
                          {team2?.code}
                        </div>
                        <div className="text-gray-500 text-xs">{team2?.record?.wins ?? 0}W {team2?.record?.losses ?? 0}L</div>
                      </div>
                      <img
                        src={team2?.image}
                        alt={team2?.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* Live Game Stats */}
                  {isLive && liveGameId && (
  <LiveGameStats
    gameId={liveGameId}
    blueTeamName={team1?.code}
    redTeamName={team2?.code}
    games={event.match.games}
  />
)}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}