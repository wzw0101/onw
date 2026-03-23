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

    if (initialRole !== "TROUBLEMAKER") {
        return <WaitingPhase title="🃏 Troublemaker Turn" description="Troublemaker is taking action..." />;
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Troublemaker Turn</p>
            <p className="text-sm text-base-content/60 mb-4">Choose two players to swap their roles:</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
                {roomInfo.seats.map((seatPlayerId, index) => {
                    if (!seatPlayerId) return null;
                    const isSelected = selectedIndex === index || selectedIndex2 === index;
                    return (
                        <div key={index} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors text-center
                            ${isSelected ? "border-primary bg-primary/20" : "border-base-content/30 hover:border-primary"}`}
                            onClick={() => {
                                if (selected) return;
                                if (selectedIndex < 0) setSelectedIndex(index);
                                else if (selectedIndex2 < 0 && index !== selectedIndex) setSelectedIndex2(index);
                            }}>
                            <div className="font-semibold">{seatPlayerId}</div>
                            {isSelected && (
                                <div className="text-xs text-primary mt-1">
                                    {selectedIndex === index ? "First" : "Second"}
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
                }}>Confirm Swap</button>
            {selected && <p className="text-green-600 font-semibold mt-4">Roles have been swapped!</p>}
        </div>
    );
}
