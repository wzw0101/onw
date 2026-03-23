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

    React.useEffect(() => {
        if (initialRole !== "MINION") return;
        gameApi.getMinionData(playerId).then(body => {
            if (body.code === 0) setMinionInfo(body.data);
        });
    }, []);

    if (initialRole !== "MINION") {
        return <WaitingPhase title="🤡 Minion Turn" description="Minion is checking for werewolves..." />;
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
                        <p className="p-2">There are no werewolves in this round</p>
                    )}
                </div>
            ) : <p>Loading...</p>}
        </div>
    );
}
