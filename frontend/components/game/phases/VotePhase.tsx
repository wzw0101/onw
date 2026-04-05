'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { RoomInfo } from '@/lib/types';

interface VotePhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
}

export default function VotePhase({ roomInfo, playerId }: VotePhaseProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [selected, setSelected] = React.useState(false);

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">🗳️ 投票阶段</p>
            <p className="text-sm text-base-content/60 mb-4">选择一名玩家投票处决：</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
                {roomInfo.seats.map((seatPlayerId, index) => {
                    if (!seatPlayerId) return null;
                    const isSelf = seatPlayerId === playerId;
                    const isSelected = selectedIndex === index;
                    return (
                        <div key={index} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors text-center
                            ${isSelected ? "border-primary bg-primary/20" : "border-base-content/30 hover:border-primary"}
                            ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => { if (!selected && !isSelf) setSelectedIndex(index); }}>
                            <div className="font-semibold">{seatPlayerId}</div>
                            {isSelf && <div className="text-xs text-error">你</div>}
                            {isSelected && <div className="text-xs text-primary mt-1">已选择</div>}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4">
                <button disabled={selected || selectedIndex < 0} className="btn btn-primary"
                    onClick={async () => {
                        if (selected || selectedIndex < 0) return;
                        await gameApi.vote(playerId, selectedIndex);
                        setSelected(true);
                    }}>确认投票</button>
                {roomInfo.hostPlayer === playerId && (
                    <button className="btn btn-secondary"
                        onClick={() => gameApi.endVoting(playerId)}>结束投票</button>
                )}
            </div>
        </div>
    );
}
