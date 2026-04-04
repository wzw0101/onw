import { apiClient } from './client';
import type {
    GetWerewolfData, GetMinionData, GetSeerData,
    GetInsomniacData, PutRobberData, ResponseBody,
    VoteDistribution,
} from '../types';

export const gameApi = {
    // 狼人
    getWerewolfData: (playerId: string) =>
        apiClient.get<GetWerewolfData>(`/player/${playerId}/werewolf-turn`),

    werewolfSelectCenter: (playerId: string, cardIndex: number) => {
        const params = new URLSearchParams({ cardIndex: cardIndex.toString() });
        return apiClient.get<GetWerewolfData>(`/player/${playerId}/werewolf-turn?${params}`);
    },

    // 爪牙
    getMinionData: (playerId: string) =>
        apiClient.get<GetMinionData>(`/player/${playerId}/minion-turn`),

    // 预言家
    seerCheck: (playerId: string, cardIndex: number) => {
        const params = new URLSearchParams({ cardIndex: cardIndex.toString() });
        return apiClient.get<GetSeerData>(`/player/${playerId}/seer-turn?${params}`);
    },

    // 强盗
    robberSteal: (playerId: string, cardIndex: number) =>
        apiClient.put<PutRobberData>(`/player/${playerId}/robber-turn`, { cardIndex }),

    // 捣蛋鬼
    troublemakerSwap: (playerId: string, cardIndices: number[]) =>
        apiClient.put(`/player/${playerId}/troublemaker-turn`, { cardIndices }),

    // 酒鬼
    drunkSwap: (playerId: string, cardIndex: number) =>
        apiClient.put(`/player/${playerId}/drunk-turn`, { cardIndex }),

    // 失眠者
    getInsomniacData: (playerId: string) =>
        apiClient.get<GetInsomniacData>(`/player/${playerId}/insomniac-turn`),

    // 投票
    vote: (playerId: string, seatIndex: number) =>
        apiClient.post(`/player/${playerId}/vote/${seatIndex}`),

    endVoting: (playerId: string) =>
        apiClient.post(`/player/${playerId}/vote/done`),

    getVoteResult: (playerId: string) =>
        apiClient.get<VoteDistribution>(`/player/${playerId}/vote/result`),

    // 行动确认
    turnEnd: (playerId: string) =>
        apiClient.post<void>(`/player/${playerId}/turn-end`),
};
