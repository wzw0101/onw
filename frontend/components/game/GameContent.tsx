'use client';

import React from 'react';
import { GamePhase, RoleCard, RoomInfo } from '@/lib/types';
import PreparePhase from './phases/PreparePhase';
import GameStartPhase from './phases/GameStartPhase';
import WerewolfPhase from './phases/WerewolfPhase';
import MinionPhase from './phases/MinionPhase';
import SeerPhase from './phases/SeerPhase';
import RobberPhase from './phases/RobberPhase';
import TroublemakerPhase from './phases/TroublemakerPhase';
import DrunkPhase from './phases/DrunkPhase';
import InsomniacPhase from './phases/InsomniacPhase';
import VotePhase from './phases/VotePhase';
import GameOverPhase from './phases/GameOverPhase';

export interface GameContentProps {
    gamePhase: GamePhase;
    roomInfo: RoomInfo;
    playerId: string;
    playerSeatNum: number;
    initialRole: RoleCard | null;
    setInitialRole: React.Dispatch<React.SetStateAction<RoleCard | null>>;
}

export default function GameContent(p: GameContentProps) {
    const content = (() => {
        switch (p.gamePhase) {
            case "PREPARE":
                return <PreparePhase roomInfo={p.roomInfo} playerId={p.playerId} playerSeatNum={p.playerSeatNum}
                    initialRole={p.initialRole} setInitialRole={p.setInitialRole} />;

            case "GAME_START":
                return <GameStartPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "WEREWOLF_TURN":
                return <WerewolfPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "MINION_TURN":
                return <MinionPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "SEER_TURN":
                return <SeerPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "ROBBER_TURN":
                return <RobberPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "TROUBLEMAKER_TURN":
                return <TroublemakerPhase roomInfo={p.roomInfo} playerId={p.playerId} initialRole={p.initialRole} />;

            case "DRUNK_TURN":
                return <DrunkPhase playerId={p.playerId} initialRole={p.initialRole} />;

            case "INSOMNIAC_TURN":
                return <InsomniacPhase playerId={p.playerId} initialRole={p.initialRole} />;

            case "VOTE_TURN":
                return <VotePhase roomInfo={p.roomInfo} playerId={p.playerId} />;

            case "GAME_OVER":
                return <GameOverPhase roomInfo={p.roomInfo} playerId={p.playerId} />;

            default:
                return null;
        }
    })();

    return <div key={p.gamePhase}>{content}</div>;
}
