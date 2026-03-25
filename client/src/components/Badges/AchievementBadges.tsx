import React from 'react';

interface BadgeProps {
  type: 'first_goal' | 'ten_goals' | 'fifty_goals' | 'hundred_goals' | 'five_streak' | 'ten_streak' | 'hundred_points' | 'five_combos';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  unlocked?: boolean;
}

const badgeConfigs = {
  first_goal: {
    name: 'Primeiro Gol',
    color: '#3b82f6',
    emoji: '⚽',
    description: 'Marque seu primeiro gol',
  },
  ten_goals: {
    name: '10 Gols',
    color: '#8b5cf6',
    emoji: '🎯',
    description: 'Marque 10 gols',
  },
  fifty_goals: {
    name: '50 Gols',
    color: '#ec4899',
    emoji: '🔥',
    description: 'Marque 50 gols',
  },
  hundred_goals: {
    name: '100 Gols',
    color: '#f59e0b',
    emoji: '💯',
    description: 'Marque 100 gols',
  },
  five_streak: {
    name: 'Streak de 5',
    color: '#10b981',
    emoji: '🔗',
    description: 'Atinja 5 vitórias consecutivas',
  },
  ten_streak: {
    name: 'Streak de 10',
    color: '#06b6d4',
    emoji: '⛓️',
    description: 'Atinja 10 vitórias consecutivas',
  },
  hundred_points: {
    name: '100 Pontos',
    color: '#a855f7',
    emoji: '💎',
    description: 'Acumule 100 pontos',
  },
  five_combos: {
    name: '5 Combos',
    color: '#ef4444',
    emoji: '💥',
    description: 'Desbloqueie 5 combos',
  },
};

const getSizeClass = (size: string) => {
  switch (size) {
    case 'sm':
      return 'w-12 h-12';
    case 'lg':
      return 'w-24 h-24';
    default:
      return 'w-16 h-16';
  }
};

const getSizeValue = (size: string) => {
  switch (size) {
    case 'sm':
      return 48;
    case 'lg':
      return 96;
    default:
      return 64;
  }
};

export function AchievementBadge({
  type,
  size = 'md',
  animated = true,
  unlocked = true,
}: BadgeProps) {
  const config = badgeConfigs[type];
  const sizeClass = getSizeClass(size);
  const sizeValue = getSizeValue(size);
  const opacity = unlocked ? 1 : 0.4;

  const animationClass = animated && unlocked ? 'animate-pulse' : '';

  return (
    <div
      className={`relative ${sizeClass} ${animationClass}`}
      title={`${config.name}: ${config.description}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 8px ${config.color}${unlocked ? 'cc' : '44'})` }}
      >
        {/* Fundo do badge */}
        <defs>
          <radialGradient id={`grad-${type}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.color} stopOpacity={unlocked ? 0.8 : 0.3} />
            <stop offset="100%" stopColor={config.color} stopOpacity={unlocked ? 0.4 : 0.1} />
          </radialGradient>

          <filter id={`glow-${type}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Círculo externo */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill={`url(#grad-${type})`}
          stroke={config.color}
          strokeWidth="2"
          opacity={opacity}
          filter={`url(#glow-${type})`}
        />

        {/* Estrelas ao redor (se desbloqueado) */}
        {unlocked && (
          <>
            {[0, 72, 144, 216, 288].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 42 * Math.cos(rad);
              const y = 50 + 42 * Math.sin(rad);
              return (
                <circle
                  key={angle}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={config.color}
                  opacity="0.8"
                />
              );
            })}
          </>
        )}

        {/* Borda interna */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={config.color}
          strokeWidth="1"
          opacity={opacity * 0.5}
          strokeDasharray="5,5"
        />

        {/* Texto do badge */}
        <text
          x="50"
          y="95"
          textAnchor="middle"
          fontSize="8"
          fill={config.color}
          opacity={opacity}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {config.name.substring(0, 10)}
        </text>
      </svg>

      {/* Emoji no centro */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl">
        {config.emoji}
      </div>

      {/* Indicador de desbloqueado */}
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}

      {/* Indicador de bloqueado */}
      {!unlocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-xs">🔒</span>
        </div>
      )}
    </div>
  );
}

export function BadgeShowcase() {
  const badges = Object.keys(badgeConfigs) as Array<keyof typeof badgeConfigs>;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">🏅 Badges Desbloqueáveis</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
        {badges.map((badge) => (
          <div key={badge} className="flex flex-col items-center gap-2">
            <AchievementBadge type={badge} size="md" unlocked={Math.random() > 0.5} />
            <p className="text-xs text-gray-400 text-center">{badgeConfigs[badge].name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AchievementBadge;
