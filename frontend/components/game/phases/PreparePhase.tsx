'use client';

import React from 'react';
import { HTTP_PREFIX, PLAYER_COLORS } from '@/lib/constants';
import { ROLE_CONFIGS } from '@/lib/constants/game';
import { playerApi } from '@/lib/api';
import { ResponseBody, RoleCard, RoomInfo, SeatData } from '@/lib/types';

interface PreparePhaseProps {
    roomInfo: RoomInfo;
    playerId: string;
    playerSeatNum: number;
    initialRole: RoleCard | null;
    setInitialRole: React.Dispatch<React.SetStateAction<RoleCard | null>>;
}

export default function PreparePhase({ roomInfo, playerId, playerSeatNum, initialRole, setInitialRole }: PreparePhaseProps) {
    const [showRole, setShowRole] = React.useState(false);

    return (
        <>
            <ul className="flex flex-row gap-4 mb-8">
                {roomInfo.seats.map((seatPlayerId, index) => seatPlayerId
                    ? <li key={`seat-${index}`}
                        className={`indicator flex justify-center items-center size-16 rounded-md transition-colors
                        ${PLAYER_COLORS[roomInfo.playerColorMap[seatPlayerId]]}`}>
                        {roomInfo.readyList[index]
                            && <span className="indicator-item badge badge-success p-0 size-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg></span>}
                        <div>{seatPlayerId}</div>
                    </li>
                    : <li key={`seat-${index}`}
                        className="flex justify-center items-center size-16 border-2 border-neutral-50 border-dashed rounded-md transition-colors cursor-pointer"
                        onClick={async () => {
                            const body = await playerApi.takeSeat(playerId, index);
                            if (body.code) { console.error(body.message); return; }
                            if (body.data) setInitialRole(body.data.initialRole);
                        }} />)}
            </ul>

            <div className="mb-8">
                <p className="text-sm text-base-content/60 mb-4">等候区（点击此处离开座位）</p>
                <div
                    className={`flex gap-4 p-4 border-2 border-dashed rounded-lg transition-colors
                        ${playerSeatNum >= 0
                            ? "border-primary bg-primary/10 cursor-pointer hover:bg-primary/20"
                            : "border-base-content/30"}`}
                    onClick={async () => {
                        if (playerSeatNum >= 0) {
                            const body = await playerApi.leaveSeat(playerId);
                            if (body.code !== 0) { console.error("leave seat failed:", body.message); return; }
                            setInitialRole(null);
                        }
                    }}
                >
                    {[...roomInfo.players]
                        .filter((p) => !roomInfo.seats.includes(p))
                        .map((p) => (
                            <li key={p}
                                className={`flex justify-center items-center size-16 rounded-md transition-colors
                                ${PLAYER_COLORS[roomInfo.playerColorMap[p]]}`}>
                                {p}
                            </li>))}
                    {playerSeatNum >= 0 &&
                        <div className="flex items-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-16" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            <span className="ml-2">点击此处返回等候区</span>
                        </div>}
                </div>
            </div>

            <div>
                {playerSeatNum >= 0 && (
                    <>
                        <button className="btn btn-primary" onClick={() => setShowRole(!showRole)}>查看角色</button>
                        {showRole && initialRole && <div className="mt-2">{ROLE_CONFIGS[initialRole].icon} {ROLE_CONFIGS[initialRole].name}</div>}
                        <button className="btn btn-primary ml-2"
                            onClick={() => playerApi.setReady(playerId, !roomInfo.readyList[playerSeatNum])}>
                            准备</button>
                    </>
                )}
                {roomInfo.hostPlayer === playerId &&
                    <button className="btn btn-primary ml-2"
                        onClick={() => playerApi.startGame(playerId)}>开始游戏</button>}
            </div>
        </>
    );
}
