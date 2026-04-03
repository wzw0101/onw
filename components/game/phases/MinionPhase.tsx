'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { ResponseBody, RoleCard, RoomInfo } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface MinionPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    initialRole: RoleCard | null;
}

export default function MinionPhase({ roomInfo, playerId, initialRole }: MinionPhaseProps) {
    const [minionInfo, setMinionInfo] = React.useState<null | { werewolfIndex: number }>(null);
    const [turnEnding, setTurnEnding] = React.useState(false);

    React.useEffect(() => {
        if (initialRole !== "MINION") return;
        gameApi.getMinionData(playerId).then(body => {
            if (body.code === 0) setMinionInfo(body.data);
        });
    }, []);

    if (initialRole !== "MINION") {
        return <WaitingPhase title="⏳ 请稍候" description="等待其他玩家操作中..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Minion Turn</p>
            {minionInfo ? (
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                    <p className="mb-2 text-orange-600 font-semibold">The werewolf is:</p>
                    {minionInfo.werewolfIndex !== null ? (
                        <div className="p-2 bg-orange-500/20 rounded">{roomInfo.seats[minionInfo.werewolfIndex]}</div>
                    ) : (
                        <div className="p-4 bg-warning/20 rounded-lg border-2 border-warning text-center">
                            <p className="text-2xl mb-2">⚠️</p>
                            <p className="text-lg font-bold text-warning">本轮没有狼人！</p>
                            <p className="text-sm text-base-content/60 mt-1">所有狼人都在中央牌堆中</p>
                        </div>
                    )}
                </div>
            ) : <p>Loading...</p>}
            {minionInfo && (
                <button className="btn btn-success w-full" disabled={turnEnding}
                    onClick={async () => {
                        setTurnEnding(true);
                        await gameApi.turnEnd(playerId);
                    }}>
                    {turnEnding ? '等待流转...' : '确认，进入下一阶段'}
                </button>
            )}
        </div>
    );
}
