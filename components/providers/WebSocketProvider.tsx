'use client';

import { useEffect } from 'react';
import { stompClient } from '@/lib/websocket/manager';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

/**
 * WebSocket 提供者
 * 
 * 在应用启动时初始化 WebSocket 连接
 * 在应用卸载时清理连接
 */
export default function WebSocketProvider({ children }: WebSocketProviderProps) {
    useEffect(() => {
        console.log('[WebSocketProvider] Initializing WebSocket');

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, []);

    return <>{children}</>;
}
