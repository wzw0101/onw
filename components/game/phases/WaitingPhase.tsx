'use client';

import React from 'react';

interface WaitingPhaseProps {
    title: string;
    description: string;
}

export default function WaitingPhase({ title, description }: WaitingPhaseProps) {
    return (
        <div className="text-center space-y-4">
            <p className="text-xl font-bold text-primary">{title}</p>
            <p className="text-base-content/60">{description}</p>
            <p className="text-sm text-base-content/40">Please wait for the phase to end.</p>
        </div>
    );
}
