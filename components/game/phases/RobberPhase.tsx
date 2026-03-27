'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { ResponseBody, RoleCard, RoomInfo } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface RobberPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    initialRole: RoleCard | null;
}

export default function RobberPhase({ roomInfo, playerId, initialRole }: RobberPhaseProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [selected, setSelected] = React.useState(false);
    const [result, setResult] = React.useState("");
    const [turnEnding, setTurnEnding] = React.useState(false);

    if (initialRole !== "ROBBER") {
        return <WaitingPhase title="⏳ 请稍候" description="等待其他玩家操作中..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Robber Turn</p>
            <p className="text-sm text-base-content/60 mb-4">Choose a player to steal their role:</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
                {roomInfo.seats.map((seatPlayerId, index) => {
                    if (!seatPlayerId || seatPlayerId === playerId) return null;
                    return (
                        <div key={index} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors text-center
                            ${selectedIndex === index ? "border-primary bg-primary/20" : "border-base-content/30 hover:border-primary"}`}
                            onClick={() => !selected && setSelectedIndex(index)}>
                            <div className="font-semibold">{seatPlayerId}</div>
                            {selectedIndex === index && <div className="text-xs text-primary mt-1">Selected</div>}
                        </div>
                    );
                })}
            </div>
            <button disabled={selected || selectedIndex < 0} className="btn btn-primary"
                onClick={async () => {
                    if (selected || selectedIndex < 0) return;
                    const body = await gameApi.robberSteal(playerId, selectedIndex);
                    if (body.code === 0 && body.data) {
                        setResult(body.data.roleCard);
                        setSelected(true);
                    }
                }}>Confirm</button>
            {result && (
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30 mt-4">
                    <p className="text-purple-600 font-semibold">You stole the role:</p>
                    <p className="text-xl font-bold mt-2">{result}</p>
                </div>
            )}
            {result && (
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
