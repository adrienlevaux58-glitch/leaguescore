"use client";
import { useState, useEffect } from "react";

interface Participant {
  participantId: number;
  summonerName: string;
  championId: string;
  role: string;
}

interface ParticipantStats {
  participantId: number;
  totalGold: number;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  currentHealth: number;
  maxHealth: number;
}

interface TeamStats {
  totalGold: number;
  totalKills: number;
  towers: number;
  inhibitors: number;
  barons: number;
  dragons: string[];
  participants: ParticipantStats[];
}

interface GameWindow {
  esportsGameId: string;
  gameMetadata: {
    patchVersion: string;
    blueTeamMetadata: { esportsTeamId: string; participantMetadata: Participant[] };
    redTeamMetadata: { esportsTeamId: string; participantMetadata: Participant[] };
  };
  frames: {
    rfc460Timestamp: string;
    gameState: string;
    blueTeam: TeamStats;
    redTeam: TeamStats;
  }[];
}

const ROLE_ORDER = ["top", "jungle", "mid", "bottom", "support"];
const ROLE_SHORT: Record<string, string> = {
  top: "T", jungle: "J", mid: "M", bottom: "B", support: "S"
};

const DRAGON_ICONS: Record<string, string> = {
  fire: "🔥", water: "💧", earth: "🌍", air: "💨",
  hextech: "⚡", chemtech: "☣️", elder: "👴",
};

const PATCH_VERSION = "14.8.1";

function ChampionIcon({ championId, size = 32 }: { championId: string; size?: number }) {
  const [error, setError] = useState(false);
  const url = `https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/champion/${championId}.png`;

  if (error) {
    return (
      <div
        className="rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs font-bold text-[#C89B3C]"
        style={{ width: size, height: size }}
      >
        {championId.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={championId}
      width={size}
      height={size}
      className="rounded-full border-2 border-[#1e2a3a] object-cover"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

export default function LiveGameStats({
  gameId,
  blueTeamName,
  redTeamName,
  games,
}: {
  gameId: string;
  blueTeamName: string;
  redTeamName: string;
  games?: { number: number; id: string; state: string }[];
}) {
  const [data, setData] = useState<GameWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameTime, setGameTime] = useState<string>("");
  const [activeGame, setActiveGame] = useState<string>(gameId);

  const fetchStats = async (gId: string) => {
    try {
      const res = await fetch(`/api/game/${gId}`);
      const json = await res.json();
      if (json.window && !json.window.httpStatus) {
        setData(json.window);
        const frames = json.window.frames;
        if (frames && frames.length > 0) {
          const lastFrame = frames[frames.length - 1];
          const ts = new Date(lastFrame.rfc460Timestamp);
          setGameTime(`${ts.getMinutes()}:${ts.getSeconds().toString().padStart(2, "0")}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats(activeGame);
    const interval = setInterval(() => fetchStats(activeGame), 10000);
    return () => clearInterval(interval);
  }, [activeGame]);

  if (loading) {
    return (
      <div className="mt-4 bg-[#080c18] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-[#1e2a3a] rounded w-48 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#1e2a3a] rounded"></div>)}
        </div>
      </div>
    );
  }

  if (!data || !data.frames || data.frames.length === 0) {
    return (
      <div className="mt-4 bg-[#080c18] rounded-xl p-4 text-center text-gray-500 text-sm">
        Stats not available yet
      </div>
    );
  }

  const lastFrame = data.frames[data.frames.length - 1];
  const blue = lastFrame.blueTeam;
  const red = lastFrame.redTeam;
  const blueMeta = data.gameMetadata.blueTeamMetadata.participantMetadata;
  const redMeta = data.gameMetadata.redTeamMetadata.participantMetadata;
  const goldDiff = blue.totalGold - red.totalGold;
  const blueAhead = goldDiff > 0;

  const sortByRole = (meta: Participant[]) =>
    [...meta].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

  const availableGames = games?.filter(g => g.state !== "unstarted") || [];

  return (
    <div className="mt-4 bg-[#080c18] border border-[#1e2a3a] rounded-xl overflow-hidden">

      {/* Header with game tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1220] border-b border-[#1e2a3a]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-bold">LIVE STATS</span>
          {/* Game tabs */}
          {availableGames.length > 1 && (
            <div className="flex gap-1">
              {availableGames.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGame(g.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeGame === g.id
                      ? "bg-[#C89B3C] text-black"
                      : "bg-[#1e2a3a] text-gray-400 hover:text-white"
                  }`}
                >
                  Game {g.number}
                  {g.state === "inProgress" && (
                    <span className="ml-1 w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {gameTime && (
            <span className="text-[#C89B3C] font-black text-sm">⏱ {gameTime}</span>
          )}
          <span className="text-xs text-gray-600">
            Patch {data.gameMetadata.patchVersion.split(".").slice(0, 2).join(".")}
          </span>
        </div>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#1e2a3a]">

        {/* Blue team */}
        <div className="p-4 bg-blue-500/5">
          <div className="text-blue-400 font-black text-sm mb-3">{blueTeamName}</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Kills</span><span className="font-black text-white">{blue.totalKills}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gold</span><span className="font-black text-[#C89B3C]">{(blue.totalGold / 1000).toFixed(1)}k</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Towers</span><span className="font-black text-white">{blue.towers}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Barons</span><span className="font-black text-purple-400">{blue.barons}</span></div>
            {blue.dragons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {blue.dragons.map((d, i) => <span key={i}>{DRAGON_ICONS[d] || "🐉"}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Gold diff */}
        <div className="p-4 flex flex-col items-center justify-center border-x border-[#1e2a3a]">
          <div className="text-gray-500 text-xs mb-2">GOLD DIFF</div>
          <div className={`font-black text-2xl ${blueAhead ? "text-blue-400" : goldDiff < 0 ? "text-red-400" : "text-gray-400"}`}>
            {goldDiff > 0 ? "+" : ""}{(goldDiff / 1000).toFixed(1)}k
          </div>
          <div className={`text-xs mt-1 ${blueAhead ? "text-blue-400" : goldDiff < 0 ? "text-red-400" : "text-gray-400"}`}>
            {goldDiff !== 0 ? (blueAhead ? `${blueTeamName} ahead` : `${redTeamName} ahead`) : "Even"}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>Inhib: <span className="text-white font-bold">{blue.inhibitors}</span></span>
            <span>Inhib: <span className="text-white font-bold">{red.inhibitors}</span></span>
          </div>
        </div>

        {/* Red team */}
        <div className="p-4 bg-red-500/5">
          <div className="text-red-400 font-black text-sm mb-3 text-right">{redTeamName}</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Kills</span><span className="font-black text-white">{red.totalKills}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gold</span><span className="font-black text-[#C89B3C]">{(red.totalGold / 1000).toFixed(1)}k</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Towers</span><span className="font-black text-white">{red.towers}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Barons</span><span className="font-black text-purple-400">{red.barons}</span></div>
            {red.dragons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 justify-end">
                {red.dragons.map((d, i) => <span key={i}>{DRAGON_ICONS[d] || "🐉"}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 divide-x divide-[#1e2a3a]">

        {/* Blue side */}
        <div className="p-3">
          <div className="text-xs text-gray-600 font-bold mb-2 uppercase">Blue Side</div>
          <div className="space-y-2">
            {sortByRole(blueMeta).map((player) => {
              const stats = blue.participants.find(p => p.participantId === player.participantId);
              return (
                <div key={player.participantId} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 w-3">{ROLE_SHORT[player.role]}</span>
                  <ChampionIcon championId={player.championId} size={28} />
                  <span className="text-gray-400 flex-1 truncate">{player.summonerName.replace(/^[A-Z]+ /, "")}</span>
                  <div className="flex items-center gap-1 text-right">
                    <span className="text-green-400 font-bold">{stats?.kills ?? 0}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-red-400 font-bold">{stats?.deaths ?? 0}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-blue-400 font-bold">{stats?.assists ?? 0}</span>
                    <span className="text-gray-500 w-10 text-right">{stats?.creepScore ?? 0}cs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Red side */}
        <div className="p-3">
          <div className="text-xs text-gray-600 font-bold mb-2 uppercase">Red Side</div>
          <div className="space-y-2">
            {sortByRole(redMeta).map((player) => {
              const stats = red.participants.find(p => p.participantId === player.participantId);
              return (
                <div key={player.participantId} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 w-3">{ROLE_SHORT[player.role]}</span>
                  <ChampionIcon championId={player.championId} size={28} />
                  <span className="text-gray-400 flex-1 truncate">{player.summonerName.replace(/^[A-Z]+ /, "")}</span>
                  <div className="flex items-center gap-1 text-right">
                    <span className="text-green-400 font-bold">{stats?.kills ?? 0}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-red-400 font-bold">{stats?.deaths ?? 0}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-blue-400 font-bold">{stats?.assists ?? 0}</span>
                    <span className="text-gray-500 w-10 text-right">{stats?.creepScore ?? 0}cs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}