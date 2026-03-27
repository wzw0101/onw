import type { PlayerColor, RoleCard } from './common';
import { GamePhase } from './game';

export interface RoomInfo {
    id: string;
    players: Set<string>;
    seats: Array<string>;
    readyList: Array<boolean>;
    playerColorMap: { [index: string]: PlayerColor };
    hostPlayer: string;
    gamePhase: GamePhase;
    playerInitialCards: Array<RoleCard>;
}
