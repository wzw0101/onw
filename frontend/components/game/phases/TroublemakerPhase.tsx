'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { RoleCard, RoomInfo } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface TroublemakerPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    initialRole: RoleCard | null;
}

export default function TroublemakerPhase({ roomInfo, playerId, initialRole }: TroublemakerPhaseProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [selectedIndex2, setSelectedIndex2] = React.useState(-1);
    const [selected, setSelected] = React.useState(false);
    const [turnEnding, setTurnEnding] = React.useState(false);

    const handleCardClick = (index: number) => {
        if (selected) return; // 确认后锁定

        if (index === selectedIndex) {
            setSelectedIndex(-1); // 反选第一张
        } else if (index === selectedIndex2) {
            setSelectedIndex2(-1); // 反选第二张
        } else if (selectedIndex < 0) {
            setSelectedIndex(index); // 第一张未选，选中第一张
        } else {
            setSelectedIndex2(index); // 其他情况选第二张
        }
    };

    if (initialRole !== "TROUBLEMAKER") {
        return <WaitingPhase title="⏳ 请稍候" description="等待其他玩家操作中..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">🤡 捣蛋鬼回合</p>
            <p className="text-sm text-base-content/60 mb-4">选择两名玩家交换他们的角色：</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
                {roomInfo.seats.map((seatPlayerId, index) => {
                    if (!seatPlayerId) return null;
                    const isSelected = selectedIndex === index || selectedIndex2 === index;
                    return (
                        <div key={index} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors text-center
                            ${isSelected ? "border-primary bg-primary/20" : "border-base-content/30 hover:border-primary"}`}
                            onClick={() => handleCardClick(index)}>
                            <div className="font-semibold">{seatPlayerId}</div>
                            {isSelected && (
                                <div className="text-xs text-primary mt-1">
                                    {selectedIndex === index ? "第一张" : "第二张"}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <button disabled={selected || selectedIndex < 0 || selectedIndex2 < 0} className="btn btn-primary"
                onClick={async () => {
                    if (selected || selectedIndex < 0 || selectedIndex2 < 0) return;
                    const body = await gameApi.troublemakerSwap(playerId, [selectedIndex, selectedIndex2]);
                    if (body.code === 0) setSelected(true);
                }}>确认交换</button>
            {selected && <p className="text-green-600 font-semibold mt-4">角色已交换！</p>}
            {selected && (
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
