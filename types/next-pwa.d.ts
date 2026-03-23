declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface PWAOptions {
        dest?: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        runtimeCaching?: Array<{
            urlPattern: RegExp | string;
            handler: string;
            options?: Record<string, unknown>;
        }>;
    }

    function withPWA(options?: PWAOptions): (config: NextConfig) => NextConfig;
    export default withPWA;
}
