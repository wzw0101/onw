export interface ResponseBody<T> {
    code: number;
    message: string;
    data: T;
}

export type PlayerColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "CYAN" | "BLUE" | "PURPLE" | "PINK";
export type RoleCard = "DRUNK" | "INSOMNIAC" | "MINION" | "ROBBER" | "SEER" | "TROUBLEMAKER" | "VILLAGER" | "WEREWOLF";
export type EventType = "ROOM_STATE_CHANGED" | "GAME_START";
