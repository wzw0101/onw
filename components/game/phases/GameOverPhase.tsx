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

    React.useEffect(() => {
        gameApi.getVoteResult(playerId).then(text => setMostVotedPlayer(text));
    }, []);

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Game Over</p>
            {mostVotedPlayer ? (
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <p className="text-red-600 font-semibold mb-2">Most voted player:</p>
                    <p className="text-2xl font-bold">{mostVotedPlayer}</p>
                </div>
            ) : <p>Loading...</p>}
            {roomInfo.hostPlayer === playerId && (
                <button className="btn btn-primary"
                    onClick={() => playerApi.restartGame(playerId)}>
                    Restart Game
                </button>
            )}
        </div>
    );
}
