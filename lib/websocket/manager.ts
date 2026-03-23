/**
 * STOMP 客户端管理器
 *
 * 管理单个 STOMP 连接和房间订阅
 */

import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { ReconnectionTimeMode } from "@stomp/stompjs";
import { AUTHORITY } from "@/lib/constants";

type MessageHandler = (message: IMessage) => void;

class StompClientManager {
    private static instance: StompClientManager;
    private client: Client | null = null;
    private subscription: StompSubscription | null = null;
    private topic: string | null = null;
    private handler: MessageHandler | null = null;

    private constructor() { }

    public static getInstance(): StompClientManager {
        if (!StompClientManager.instance) {
            StompClientManager.instance = new StompClientManager();
        }
        return StompClientManager.instance;
    }

    private getClient(): Client {
        if (!this.client) {
            this.client = new Client({
                brokerURL: `ws://${AUTHORITY}/stomp/registry`,
                reconnectDelay: 1000,
                reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
                maxReconnectDelay: 10000,
            });

            this.client.onConnect = () => {
                console.log('[STOMP] Connected');
                this.resubscribe();
            };

            this.client.onDisconnect = () => {
                console.log('[STOMP] Disconnected');
            };
        }
        return this.client;
    }

    public activate(): void {
        this.getClient().activate();
    }

    public deactivate(): void {
        if (this.client) {
            this.client.deactivate();
        }
    }

    public subscribe(topic: string, handler: MessageHandler): void {
        this.topic = topic;
        this.handler = handler;

        // 取消旧订阅
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        // 已连接则立即订阅
        if (this.client?.connected) {
            this.subscription = this.client.subscribe(topic, handler);
        }
    }

    public unsubscribe(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        this.topic = null;
        this.handler = null;
    }

    private resubscribe(): void {
        if (!this.client?.connected || !this.topic || !this.handler) return;

        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        console.log(`[STOMP] Subscribing to ${this.topic}`);
        this.subscription = this.client.subscribe(this.topic, this.handler);
    }

    public destroy(): void {
        this.unsubscribe();
        this.deactivate();
        this.client = null;
        StompClientManager.instance = (null as unknown) as StompClientManager;
    }
}

export const stompClient = StompClientManager.getInstance();

export function activateStomp(): void {
    stompClient.activate();
}

export function deactivateStomp(): void {
    stompClient.deactivate();
}
