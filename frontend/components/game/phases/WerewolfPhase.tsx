'use client';

import React from 'react';
import { HTTP_PREFIX } from '@/lib/constants';
import { ROLE_CONFIGS } from '@/lib/constants/game';
import { gameApi } from '@/lib/api';
import { GetWerewolfData, ResponseBody, RoleCard, RoomInfo } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface WerewolfPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    initialRole: RoleCard | null;
}

export default function WerewolfPhase({ roomInfo, playerId, initialRole }: WerewolfPhaseProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [selected, setSelected] = React.useState(false);
    const [werewolfInfo, setWerewolfInfo] = React.useState<null | { otherWerewolves: number[]; selectedCenterCard?: RoleCard }>(null);
    const [turnEnding, setTurnEnding] = React.useState(false);

    React.useEffect(() => {
        if (initialRole !== "WEREWOLF") return;
        gameApi.getWerewolfData(playerId).then(body => {
            if (body.code === 0 && body.data) {
                setWerewolfInfo({
                    otherWerewolves: body.data.werewolfIndex !== null ? [body.data.werewolfIndex] : [],
                });
            }
        });
    }, []);

    if (initialRole !== "WEREWOLF") {
        return <WaitingPhase title="⏳ 请稍候" description="等待其他玩家操作中..." />;
    }

    const centerCards = ["中央牌 1", "中央牌 2", "中央牌 3"];

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">🐺 狼人回合</p>
            {werewolfInfo && werewolfInfo.otherWerewolves.length > 0 ? (
                <div className="bg-red-500/10 p-6 rounded-lg border-2 border-red-500/30">
                    <p className="mb-4 text-red-600 font-semibold text-lg">🤝 你有狼人队友：</p>
                    <div className="space-y-3">
                        {werewolfInfo.otherWerewolves.map((index) => (
                            <div key={index} className="p-4 bg-red-500/20 rounded-lg border border-red-500/40">
                                <div className="font-bold text-xl mb-1">{roomInfo.seats[index]}</div>
                                <div className="text-sm text-red-600">🔴 狼人</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-blue-500/10 p-6 rounded-lg border-2 border-blue-500/30">
                    <p className="mb-4 text-blue-600 font-semibold text-lg">👁️ 你是唯一的狼人，选择一张中央牌查看：</p>
                    <div className="flex gap-4 mb-6">
                        {centerCards.map((card, index) => (
                            <div key={index}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${selectedIndex === index
                                        ? "border-primary bg-primary/20 scale-105"
                                        : "border-base-content/30 hover:border-primary hover:bg-primary/10"}`}
                                onClick={() => !selected && setSelectedIndex(index)}>
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🃏</div>
                                    <div className="font-semibold">{card}</div>
                                    {selectedIndex === index && <div className="text-xs text-primary mt-1">✓ 已选择</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button disabled={selected || selectedIndex < 0} className="btn btn-primary w-full"
                        onClick={async () => {
                            if (selected || selectedIndex < 0) return;
                            const body = await gameApi.werewolfSelectCenter(playerId, selectedIndex);
                            if (body.code === 0 && body.data) {
                                setWerewolfInfo({ ...werewolfInfo!, selectedCenterCard: body.data.centerCard });
                                setSelected(true);
                            }
                        }}>确认选择</button>
                    {werewolfInfo?.selectedCenterCard && (
                        <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border-2 border-blue-500/40">
                            <p className="text-blue-600 font-semibold mb-2">👁️ 中央牌是：</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {ROLE_CONFIGS[werewolfInfo.selectedCenterCard]?.icon} {ROLE_CONFIGS[werewolfInfo.selectedCenterCard]?.name}
                            </p>
                        </div>
                    )}
                    {werewolfInfo?.selectedCenterCard && (
                        <button className="btn btn-success w-full mt-4" disabled={turnEnding}
                            onClick={async () => {
                                setTurnEnding(true);
                                await gameApi.turnEnd(playerId);
                            }}>
                            {turnEnding ? '等待流转...' : '确认，进入下一阶段'}
                        </button>
                    )}
                </div>
            )}
            {werewolfInfo && werewolfInfo.otherWerewolves.length > 0 && (
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
