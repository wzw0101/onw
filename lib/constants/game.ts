import type { PlayerColor, RoleCard } from '../types';

export const PLAYER_COLORS: Record<PlayerColor, string> = {
    RED: "bg-red-500",
    ORANGE: "bg-orange-500",
    YELLOW: "bg-yellow-500",
    GREEN: "bg-green-500",
    CYAN: "bg-cyan-500",
    BLUE: "bg-blue-500",
    PURPLE: "bg-purple-500",
    PINK: "bg-pink-500",
};

export const ROLE_CONFIGS: Record<RoleCard, { icon: string; name: string }> = {
    DRUNK: { icon: "🍺", name: "酒鬼" },
    INSOMNIAC: { icon: "🦉", name: "失眠者" },
    MINION: { icon: "🐾", name: "爪牙" },
    ROBBER: { icon: "🥷", name: "强盗" },
    SEER: { icon: "🔮", name: "预言家" },
    TROUBLEMAKER: { icon: "🤡", name: "捣蛋鬼" },
    VILLAGER: { icon: "👱", name: "村民" },
    WEREWOLF: { icon: "🐺", name: "狼人" },
};
