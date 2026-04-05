'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '@/lib/api';
import { RoleCard } from '@/lib/types';
import { ROLE_CONFIGS } from '@/lib/constants/game';

const ALL_ROLES: RoleCard[] = ['WEREWOLF', 'MINION', 'SEER', 'ROBBER', 'TROUBLEMAKER', 'DRUNK', 'INSOMNIAC', 'VILLAGER'];

export default function Home() {
    const router = useRouter();
    const [playerId, setPlayerId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [editPlayer, setEditPlayer] = useState(false);
    const [selectedCards, setSelectedCards] = useState<RoleCard[]>([
        'WEREWOLF', 'WEREWOLF', 'MINION', 'SEER', 'ROBBER', 'TROUBLEMAKER', 'VILLAGER', 'VILLAGER', 'VILLAGER'
    ]);

    const playerCount = selectedCards.length - 3;

    function addCard(card: RoleCard) {
        setSelectedCards(prev => [...prev, card]);
    }

    function removeCard(index: number) {
        setSelectedCards(prev => prev.filter((_, i) => i !== index));
    }

    async function handleJoin() {
        if (!playerId || !roomId) return;
        const body = await roomApi.join(playerId, roomId);
        if (body.code !== 0) {
            console.error(`enter room failed: ${body.message}`);
            return;
        }
        router.push(`/room/${roomId}?player=${encodeURIComponent(playerId)}`);
    }

    async function handleCreate() {
        if (!playerId) return;
        if (selectedCards.length < 6) {
            console.error('至少需要6张卡（3玩家+3中心）');
            return;
        }
        const body = await roomApi.create(playerId, selectedCards);
        if (body.code !== 0 || !body.data) return;
        const roomId = body.data;
        router.push(`/room/${roomId}?player=${encodeURIComponent(playerId)}`);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
            <h1 className="text-3xl font-bold text-primary">🐺 一夜狼人杀</h1>

            <div className="card bg-base-200 p-6 w-full max-w-sm space-y-4">
                {/* Player ID */}
                <div className="flex items-center gap-2">
                    <label className="input input-bordered flex items-center gap-2 flex-1">
                        玩家 ID
                        <input
                            value={playerId}
                            onChange={(e) => setPlayerId(e.target.value)}
                            disabled={!editPlayer}
                            className="grow"
                        />
                    </label>
                    <label className="swap">
                        <input
                            className="peer"
                            type="checkbox"
                            onClick={() => setEditPlayer(!editPlayer)}
                        />
                        <svg className="size-6 swap-off" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        <svg className="size-6 swap-on" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </label>
                </div>

                {/* Room ID + Join */}
                {playerId && !editPlayer && (
                    <>
                        <label className="input input-bordered flex items-center gap-2">
                            房间 ID
                            <input
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="grow"
                            />
                        </label>

                        <div className="flex gap-2">
                            <button
                                className="btn btn-primary flex-1"
                                disabled={!roomId}
                                onClick={handleJoin}
                            >
                                加入房间
                            </button>
                        </div>

                        {/* 卡牌选择 */}
                        <div className="divider">创建房间</div>

                        <p className="text-sm text-base-content/60">
                            玩家人数: {playerCount}（卡牌数 - 3 = 玩家数）
                        </p>

                        {/* 添加卡牌按钮 */}
                        <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map(role => (
                                <button
                                    key={role}
                                    className="btn btn-sm btn-outline"
                                    onClick={() => addCard(role)}
                                >
                                    {ROLE_CONFIGS[role].icon} {ROLE_CONFIGS[role].name}
                                </button>
                            ))}
                        </div>

                        {/* 已选卡牌 */}
                        <div className="flex flex-wrap gap-2 min-h-[2rem]">
                            {selectedCards.map((card, index) => (
                                <span
                                    key={index}
                                    className="badge badge-lg gap-1 cursor-pointer hover:badge-error"
                                    onClick={() => removeCard(index)}
                                >
                                    {ROLE_CONFIGS[card].icon}
                                </span>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary w-full"
                            onClick={handleCreate}
                        >
                            创建房间
                        </button>
                    </>
                )}
                )}
            </div>
        </div>
    );
}
