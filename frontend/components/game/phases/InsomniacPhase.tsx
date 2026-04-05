'use client';

import React from 'react';
import { ROLE_CONFIGS } from '@/lib/constants/game';
import { gameApi } from '@/lib/api';
import { RoleCard } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface InsomniacPhaseProps {
    playerId: string;
    initialRole: RoleCard | null;
}

export default function InsomniacPhase({ playerId, initialRole }: InsomniacPhaseProps) {
    const [insomniacInfo, setInsomniacInfo] = React.useState<null | { role: RoleCard }>(null);
    const [turnEnding, setTurnEnding] = React.useState(false);

    React.useEffect(() => {
        if (initialRole !== "INSOMNIAC") return;
        gameApi.getInsomniacData(playerId).then(body => {
            if (body.code === 0 && body.data) setInsomniacInfo({ role: body.data.roleCard });
        });
    }, []);

    if (initialRole !== "INSOMNIAC") {
        return <WaitingPhase title="⏳ 请稍候" description="等待其他玩家操作中..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">🦉 失眠者回合</p>
            {insomniacInfo ? (
                <div className="bg-cyan-500/10 p-4 rounded-lg border border-cyan-500/30">
                    <p className="text-cyan-600 font-semibold mb-2">你当前的角色是：</p>
                    <p className="text-2xl font-bold">{ROLE_CONFIGS[insomniacInfo.role]?.icon} {ROLE_CONFIGS[insomniacInfo.role]?.name}</p>
                </div>
            ) : <p>加载中...</p>}
            {insomniacInfo && (
                <button className="btn btn-success w-full mt-4" disabled={turnEnding}
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
