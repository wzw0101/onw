'use client';

import React from 'react';
import { RoleCard, RoomInfo } from '@/lib/types';
import { ROLE_CONFIGS } from '@/lib/constants/game';

interface GameStartPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    initialRole: RoleCard | null;
}

export default function GameStartPhase({ roomInfo, playerId, initialRole }: GameStartPhaseProps) {
    return (
        <div className="space-y-6">
            <p className="text-2xl font-bold text-center text-primary">🎮 游戏开始</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {roomInfo.seats.map((seatPlayerId, index) => {
                    if (!seatPlayerId) return null;
                    const isSelf = seatPlayerId === playerId;
                    const role = isSelf ? initialRole : null;
                    const roleConfig = role ? ROLE_CONFIGS[role] : null;

                    return (
                        <div key={index}
                            className={`p-4 rounded-lg border-2 text-center transition-colors
                                ${isSelf ? 'border-primary bg-primary/10' : 'border-base-content/20 bg-base-200'}`}>
                            <div className="font-semibold mb-1">{seatPlayerId}</div>
                            {roleConfig ? (
                                <div>
                                    <span className="text-2xl">{roleConfig.icon}</span>
                                    <div className="text-sm font-bold mt-1">{roleConfig.name}</div>
                                </div>
                            ) : (
                                <div className="text-sm text-base-content/40">???</div>
                            )}
                            {isSelf && <div className="text-xs text-primary mt-1">（你）</div>}
                        </div>
                    );
                })}
            </div>
            <p className="text-sm text-center text-base-content/40">即将进入夜晚行动阶段...</p>
        </div>
    );
}
