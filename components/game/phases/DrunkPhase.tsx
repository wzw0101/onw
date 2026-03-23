'use client';

import React from 'react';
import { gameApi } from '@/lib/api';
import { RoleCard } from '@/lib/types';
import WaitingPhase from './WaitingPhase';

interface DrunkPhaseProps {
    playerId: string;
    initialRole: RoleCard | null;
}

export default function DrunkPhase({ playerId, initialRole }: DrunkPhaseProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [selected, setSelected] = React.useState(false);

    if (initialRole !== "DRUNK") {
        return <WaitingPhase title="🥃 Drunk Turn" description="Drunk is swapping cards..." />;
    }

    const centerCards = ["Card 1", "Card 2", "Card 3"];
    return (
        <div className="space-y-4">
            <p className="text-lg font-bold text-center">Drunk Turn</p>
            <p className="text-sm text-base-content/60 mb-4">Choose a center card to swap with your role:</p>
            <div className="flex gap-4 mb-4">
                {centerCards.map((card, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors text-center
                        ${selectedIndex === index ? "border-primary bg-primary/20" : "border-base-content/30 hover:border-primary"}`}
                        onClick={() => !selected && setSelectedIndex(index)}>
                        <div className="font-semibold">{card}</div>
                        {selectedIndex === index && <div className="text-xs text-primary mt-1">Selected</div>}
                    </div>
                ))}
            </div>
            <button disabled={selected || selectedIndex < 0} className="btn btn-primary"
                onClick={async () => {
                    if (selected || selectedIndex < 0) return;
                    const body = await gameApi.drunkSwap(playerId, selectedIndex);
                    if (body.code === 0) setSelected(true);
                }}>Confirm Swap</button>
            {selected && <p className="text-green-600 font-semibold mt-4">Role has been swapped!</p>}
        </div>
    );
}
