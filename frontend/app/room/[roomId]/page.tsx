'use client';

import React, { use, useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { IMessage } from "@stomp/stompjs";
import { RoleCard, RoomInfo } from "@/lib/types";
import { RoomChangedMessageBody } from "@/lib/types/game";
import { roomApi, playerApi } from "@/lib/api";
import { stompClient } from "@/lib/websocket/manager";
import GameContent from "@/components/game/GameContent";

interface RoomPageProps {
    params: Promise<{ roomId: string }>;
    searchParams: Promise<{ player?: string }>;
}

export default function RoomPage({ params, searchParams }: RoomPageProps) {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl">Loading room...</p>
            </div>
        }>
            <RoomInner params={params} searchParams={searchParams} />
        </Suspense>
    );
}

function RoomInner({ params, searchParams }: RoomPageProps) {
    const { roomId } = use(params);
    const { player: playerId } = use(searchParams);
    const router = useRouter();

    const [roomInfo, setRoomInfo] = useState<null | RoomInfo>(null);
    const [error, setError] = useState<string | null>(null);
    const [initialRole, setInitialRole] = useState<null | RoleCard>(null);

    useEffect(() => {
        if (!playerId) {
            router.replace('/');
            return;
        }

        let cancelled = false;

        roomApi.get(playerId).then(body => {
            if (cancelled) return;

            if (!body.data) {
                setError(body.message || 'Failed to load room');
                return;
            }
            if ((body.data as any).roomId !== roomId) {
                setError('You are not in this room');
                return;
            }

            setRoomInfo(body.data);

            // 通过单独的 API 获取 initialRole
            playerApi.getInitialRole(playerId).then(roleRes => {
                if (roleRes.data?.initialRole) {
                    setInitialRole(roleRes.data.initialRole);
                }
            });

            // 校验通过，订阅 WebSocket
            const handleMessage = (message: IMessage) => {
                const body: RoomChangedMessageBody = JSON.parse(message.body);
                if (body.eventType === 'ROOM_STATE_CHANGED') {
                    console.log('[Room] Received roomInfo:', body.data);
                    setRoomInfo(body.data);
                }
            };

            stompClient.subscribe(`/topic/room/${roomId}`, handleMessage);
        });

        return () => {
            cancelled = true;
            stompClient.unsubscribe();
        };
    }, [playerId, roomId, router]);

    if (!playerId) return null;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-xl text-error">{error}</p>
                <button className="btn btn-primary" onClick={() => router.push('/')}>
                    Back to Home
                </button>
            </div>
        );
    }

    if (!roomInfo) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl">Connecting to room {roomId}...</p>
            </div>
        );
    }

    const playerSeatNum = roomInfo.seats.indexOf(playerId);
    const gamePhase = roomInfo.gamePhase;

    return (
        <div className="mt-4">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-base-content/60">Room: {roomId}</p>
                        <p className="text-sm font-semibold">{playerId}</p>
                        {initialRole && gamePhase !== "PREPARE" && (
                            <span className="badge badge-primary">{initialRole}</span>
                        )}
                    </div>
                    <button className="btn btn-ghost btn-sm" disabled={gamePhase !== "PREPARE"} onClick={async () => {
                        await roomApi.leave(playerId);
                        router.push('/');
                    }}>
                        Leave Room
                    </button>
                </div>

                <GameContent
                    gamePhase={gamePhase}
                    roomInfo={roomInfo}
                    playerId={playerId}
                    playerSeatNum={playerSeatNum}
                    initialRole={initialRole}
                    setInitialRole={setInitialRole}
                />
            </div>
        </div>
    );
}
