'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { playerApi } from '@/lib/api';
import { RoomInfo } from '@/lib/types';

interface GameOverPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
}

export default function GameOverPhase({ roomInfo, playerId }: GameOverPhaseProps) {
    const [mostVotedPlayer, setMostVotedPlayer] = React.useState<null | string>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchResult = () => {
            gameApi.getVoteResult(playerId).then(res => {
                if (res.code === 0 && res.data) {
                    setMostVotedPlayer(res.data);
                } else {
                    // 可能 WebSocket 延迟，重试一次
                    setTimeout(() => {
                        gameApi.getVoteResult(playerId).then(res2 => {
                            if (res2.code === 0 && res2.data) {
                                setMostVotedPlayer(res2.data);
                            } else {
                                setError(res2.message || 'Failed to load result');
                            }
                        });
                    }, 1000);
                }
            });
        };
        fetchResult();
    }, []);

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Game Over</p>
            {mostVotedPlayer ? (
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <p className="text-red-600 font-semibold mb-2">Most voted player:</p>
                    <p className="text-2xl font-bold">{mostVotedPlayer}</p>
                </div>
            ) : error ? (
                <p className="text-error">{error}</p>
            ) : (
                <div className="flex justify-center"><span className="loading loading-dots loading-md"></span></div>
            )}
            {roomInfo.hostPlayer === playerId && (
                <button className="btn btn-primary"
                    onClick={() => playerApi.restartGame(playerId)}>
                    Restart Game
                </button>
            )}
        </div>
    );
}
