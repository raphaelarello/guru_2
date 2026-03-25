import { useState } from "react";
import { Heart, Bell, X, Check } from "lucide-react";

interface PersonalizedAlertsProps {
  onClose?: () => void;
}

export function PersonalizedAlerts({ onClose }: PersonalizedAlertsProps) {
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(["Manchester City", "Liverpool"]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(["Premier League", "Champions League"]);
  const [alertSettings, setAlertSettings] = useState({
    goals: true,
    cards: true,
    corners: true,
    substitutions: true,
    oddsChanges: true,
    soundEnabled: true,
  });

  const [newTeam, setNewTeam] = useState("");
  const [newLeague, setNewLeague] = useState("");

  const allTeams = [
    "Manchester City",
    "Liverpool",
    "Arsenal",
    "Chelsea",
    "Manchester United",
    "Real Madrid",
    "Barcelona",
    "Bayern Munich",
    "PSG",
    "Juventus",
  ];

  const allLeagues = ["Premier League", "La Liga", "Serie A", "Ligue 1", "Bundesliga", "Champions League", "Europa League"];

  const addTeam = (team: string) => {
    if (!favoriteTeams.includes(team)) {
      setFavoriteTeams([...favoriteTeams, team]);
    }
  };

  const removeTeam = (team: string) => {
    setFavoriteTeams(favoriteTeams.filter((t) => t !== team));
  };

  const addLeague = (league: string) => {
    if (!favoriteLeagues.includes(league)) {
      setFavoriteLeagues([...favoriteLeagues, league]);
    }
  };

  const removeLeague = (league: string) => {
    setFavoriteLeagues(favoriteLeagues.filter((l) => l !== league));
  };

  const toggleAlert = (key: keyof typeof alertSettings) => {
    setAlertSettings({
      ...alertSettings,
      [key]: !alertSettings[key],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">Alertas Personalizados</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* SEÇÃO 1: TIMES FAVORITOS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-slate-100">Times Favoritos</h3>
            </div>

            {/* TIMES SELECIONADOS */}
            <div className="flex flex-wrap gap-2">
              {favoriteTeams.map((team) => (
                <div key={team} className="bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1 flex items-center gap-2 text-sm">
                  <span className="text-red-300">{team}</span>
                  <button onClick={() => removeTeam(team)} className="text-red-400 hover:text-red-300 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* ADICIONAR NOVO TIME */}
            <div className="flex gap-2">
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm"
              >
                <option value="">Selecionar time...</option>
                {allTeams.filter((t) => !favoriteTeams.includes(t)).map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (newTeam) {
                    addTeam(newTeam);
                    setNewTeam("");
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold text-sm transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* SEÇÃO 2: LIGAS FAVORITAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-100">Ligas Favoritas</h3>
            </div>

            {/* LIGAS SELECIONADAS */}
            <div className="flex flex-wrap gap-2">
              {favoriteLeagues.map((league) => (
                <div key={league} className="bg-blue-500/20 border border-blue-500/50 rounded-full px-3 py-1 flex items-center gap-2 text-sm">
                  <span className="text-blue-300">{league}</span>
                  <button onClick={() => removeLeague(league)} className="text-blue-400 hover:text-blue-300 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* ADICIONAR NOVA LIGA */}
            <div className="flex gap-2">
              <select
                value={newLeague}
                onChange={(e) => setNewLeague(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm"
              >
                <option value="">Selecionar liga...</option>
                {allLeagues.filter((l) => !favoriteLeagues.includes(l)).map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (newLeague) {
                    addLeague(newLeague);
                    setNewLeague("");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* SEÇÃO 3: TIPOS DE ALERTAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-100 mb-3">Tipos de Alertas</h3>

            <div className="space-y-2">
              {[
                { key: "goals" as const, label: "⚽ Gols", description: "Notificação quando um gol é marcado" },
                { key: "cards" as const, label: "🟨 Cartões", description: "Notificação para cartões amarelos e vermelhos" },
                { key: "corners" as const, label: "🚩 Escanteios", description: "Notificação para escanteios" },
                { key: "substitutions" as const, label: "🔄 Substituições", description: "Notificação para trocas de jogadores" },
                { key: "oddsChanges" as const, label: "📊 Mudanças de Odds", description: "Notificação para grandes mudanças de odds" },
              ].map(({ key, label, description }) => (
                <button
                  key={key}
                  onClick={() => toggleAlert(key)}
                  className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${
                    alertSettings[key]
                      ? "bg-green-500/10 border-green-500/50 hover:bg-green-500/20"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">{label}</div>
                    <div className="text-xs text-slate-400">{description}</div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    alertSettings[key]
                      ? "bg-green-500 border-green-600"
                      : "border-slate-600"
                  }`}>
                    {alertSettings[key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SEÇÃO 4: CONFIGURAÇÕES GERAIS */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-100 mb-3">Configurações Gerais</h3>

            <button
              onClick={() => toggleAlert("soundEnabled")}
              className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${
                alertSettings.soundEnabled
                  ? "bg-green-500/10 border-green-500/50 hover:bg-green-500/20"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-slate-200">🔊 Som nas Notificações</div>
                <div className="text-xs text-slate-400">Reproduzir som quando receber alertas</div>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                alertSettings.soundEnabled
                  ? "bg-green-500 border-green-600"
                  : "border-slate-600"
              }`}>
                {alertSettings.soundEnabled && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          </div>

          {/* RESUMO */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm font-bold text-slate-300 mb-2">📋 Resumo de Alertas</div>
            <div className="space-y-1 text-xs text-slate-400">
              <div>
                • Você receberá alertas para <strong>{favoriteTeams.length} times</strong> favoritos
              </div>
              <div>
                • Você receberá alertas para <strong>{favoriteLeagues.length} ligas</strong> favoritas
              </div>
              <div>
                • <strong>5 tipos</strong> de eventos monitorados
              </div>
              <div>
                • Som: <strong>{alertSettings.soundEnabled ? "Ativado" : "Desativado"}</strong>
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              ✓ Salvar Configurações
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded font-semibold transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
