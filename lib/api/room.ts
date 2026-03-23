import { apiClient } from './client';
import type { RoomInfo } from '../types';
import { ResponseBody } from '../types';

export const roomApi = {
    get: (playerId: string) =>
        apiClient.get<RoomInfo>(`/player/${playerId}/room`),

    create: (playerId: string) =>
        apiClient.post(`/player/${playerId}/room`),

    join: (playerId: string, roomId: string) =>
        apiClient.post(`/player/${playerId}/room/${roomId}`),

    leave: (playerId: string) =>
        apiClient.delete(`/player/${playerId}/room`),
};
