'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { RoleCard } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface InsomniacPhaseProps {
    playerId: string;
    initialRole: RoleCard | null;
}

export default function InsomniacPhase({ playerId, initialRole }: InsomniacPhaseProps) {
    const [insomniacInfo, setInsomniacInfo] = React.useState<null | { role: RoleCard }>(null);

    React.useEffect(() => {
        if (initialRole !== "INSOMNIAC") return;
        gameApi.getInsomniacData(playerId).then(body => {
            if (body.code === 0 && body.data) setInsomniacInfo({ role: body.data.roleCard });
        });
    }, []);

    if (initialRole !== "INSOMNIAC") {
        return <WaitingPhase title="😴 Insomniac Turn" description="Insomniac is checking their role..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Insomniac Turn</p>
            {insomniacInfo ? (
                <div className="bg-cyan-500/10 p-4 rounded-lg border border-cyan-500/30">
                    <p className="text-cyan-600 font-semibold mb-2">Your current role is:</p>
                    <p className="text-2xl font-bold">{insomniacInfo.role}</p>
                </div>
            ) : <p>Loading...</p>}
        </div>
    );
}
