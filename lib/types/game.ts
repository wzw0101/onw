import type { RoomInfo } from './room';
import type { RoleCard } from './common';

export type GamePhase = "PREPARE" | "GAME_START" | "WEREWOLF_TURN" | "MINION_TURN" | "SEER_TURN" | "ROBBER_TURN" | "TROUBLEMAKER_TURN"
    | "DRUNK_TURN" | "INSOMNIAC_TURN" | "VOTE_TURN" | "GAME_OVER";

export interface RoomChangedMessageBody {
    eventType: "ROOM_STATE_CHANGED";
    data: RoomInfo;
}

export interface VoteDistribution {
    mostVotedPlayer: string | null;
    voteCounts: number[];  // 每个座位的得票数
}
