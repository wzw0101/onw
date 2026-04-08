import { apiClient } from './client';
import type { SeatData, ResponseBody, RoomInfo } from '../types';

export const playerApi = {
    getRoom: (playerId: string) =>
        apiClient.get<RoomInfo>(`/player/${playerId}/room`),

    takeSeat: (playerId: string, seatIndex: number) =>
        apiClient.post<SeatData>(`/player/${playerId}/seat/${seatIndex}`),

    leaveSeat: (playerId: string) =>
        apiClient.delete(`/player/${playerId}/seat`),

    setReady: (playerId: string, ready: boolean) =>
        apiClient.put(`/player/${playerId}/ready/${ready}`),

    startGame: (playerId: string) =>
        apiClient.post(`/player/${playerId}/game-start`),

    restartGame: (playerId: string) =>
        apiClient.post(`/player/${playerId}/restart`),

    getInitialRole: (playerId: string) =>
        apiClient.get<SeatData>(`/player/${playerId}/initialRole`),
};
