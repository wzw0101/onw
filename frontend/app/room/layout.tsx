'use client';

import WebSocketProvider from "@/components/providers/WebSocketProvider";

export default function RoomLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <WebSocketProvider>
            {children}
        </WebSocketProvider>
    );
}
