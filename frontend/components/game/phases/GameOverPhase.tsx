'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { playerApi } from '@/lib/api';
import { RoomInfo } from '@/lib/types';
import { VoteDistribution } from '@/lib/types/game';

interface GameOverPhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
}

export default function GameOverPhase({ roomInfo, playerId }: GameOverPhaseProps) {
    const [voteDistribution, setVoteDistribution] = React.useState<null | VoteDistribution>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchResult = () => {
            gameApi.getVoteResult(playerId).then(res => {
                if (res.code === 0 && res.data) {
                    setVoteDistribution(res.data);
                } else {
                    // 可能 WebSocket 延迟，重试一次
                    setTimeout(() => {
                        gameApi.getVoteResult(playerId).then(res2 => {
                            if (res2.code === 0 && res2.data) {
                                setVoteDistribution(res2.data);
                            } else {
                                setError(res2.message || '加载结果失败');
                            }
                        });
                    }, 1000);
                }
            });
        };
        fetchResult();
    }, []);

    if (!voteDistribution) {
        if (error) {
            return <p className="text-error text-center">{error}</p>;
        }
        return <div className="flex justify-center"><span className="loading loading-dots loading-md"></span></div>;
    }

    // 找出最大票数用于柱状图缩放
    const maxVotes = Math.max(...voteDistribution.voteCounts, 0);
    const maxVotesForScale = maxVotes === 0 ? 1 : maxVotes;  // 避免除以0
    const executedSet = new Set(voteDistribution.executedPlayers);

    return (
        <div className="space-y-6">
            <p className="text-lg font-bold text-center">🏁 游戏结束</p>

            {/* 胜负结果 */}
            {voteDistribution.villagerWin ? (
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30 text-center">
                    <p className="text-green-500 text-2xl font-bold">村民阵营胜利！</p>
                    <p className="text-sm text-base-content/60 mt-1">狼人被处决了</p>
                </div>
            ) : (
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 text-center">
                    <p className="text-red-500 text-2xl font-bold">狼人阵营胜利！</p>
                    <p className="text-sm text-base-content/60 mt-1">
                        {voteDistribution.executedPlayers.length === 0 ? '没有玩家被处决' : '处决的玩家中没有狼人'}
                    </p>
                </div>
            )}

            {/* 投票结果柱状图 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">投票结果</h3>
                <div className="space-y-3">
                    {roomInfo.seats.map((seatPlayerId, index) => {
                        if (!seatPlayerId) return null;
                        const voteCount = voteDistribution.voteCounts[index];
                        const barWidth = (voteCount / maxVotesForScale) * 100;
                        const isExecuted = executedSet.has(seatPlayerId);
                        const isSelf = seatPlayerId === playerId;

                        return (
                            <div key={index} className="flex items-center gap-3">
                                {/* 玩家名字 */}
                                <div className="w-20 text-right font-medium shrink-0">
                                    {seatPlayerId}
                                    {isSelf && <span className="ml-1 text-xs text-primary">(你)</span>}
                                </div>

                                {/* 柱状图 */}
                                <div className="flex-1 flex items-center">
                                    <div
                                        className={`h-8 rounded-l-md transition-all ${
                                            isExecuted ? 'bg-error' : 'bg-neutral'
                                        }`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                    {/* 票数标签 */}
                                    {voteCount > 0 && (
                                        <div className="ml-2 text-sm font-bold min-w-[1.5rem]">
                                            {voteCount}票
                                        </div>
                                    )}
                                </div>

                                {/* 处决标识 */}
                                {isExecuted && (
                                    <span className="text-sm text-error font-semibold">
                                        ☠️ 被处决
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 被处决的玩家列表 */}
            {voteDistribution.executedPlayers.length > 0 && (
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <p className="text-red-600 font-semibold mb-2">
                        被处决的玩家{voteDistribution.executedPlayers.length > 1 ? '（平票）' : ''}:
                    </p>
                    <p className="text-2xl font-bold">{voteDistribution.executedPlayers.join('、')}</p>
                </div>
            )}

            {roomInfo.hostPlayer === playerId && (
                <button className="btn btn-primary w-full"
                    onClick={() => playerApi.restartGame(playerId)}>
                    重新开始
                </button>
            )}
        </div>
    );
}
