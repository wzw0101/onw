export interface Player {
    userId: string;
    roomId: string;
}

export interface SeatData {
    initialRole: import('./common').RoleCard;
}

export interface GetWerewolfData {
    werewolfIndex: number;
    centerCard: import('./common').RoleCard;
}

export interface GetMinionData {
    werewolfIndex: number;
}

export interface GetSeerData {
    roleCard: import('./common').RoleCard;
}

export interface GetInsomniacData {
    roleCard: import('./common').RoleCard;
}

export interface PutRobberData {
    roleCard: import('./common').RoleCard;
}
