'use client';

import React from 'react';

interface WaitingPhaseProps {
    title: string;
    description: string;
}

export default function WaitingPhase({ title, description }: WaitingPhaseProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-4xl">⏳</div>
            <p className="text-xl font-bold text-primary">{title}</p>
            <p className="text-base text-base-content/60">{description}</p>
            <span className="loading loading-dots loading-md text-primary"></span>
        </div>
    );
}
