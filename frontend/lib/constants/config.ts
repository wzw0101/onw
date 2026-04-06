// NEXT_PUBLIC_API_URL 仅用于开发环境；生产环境通过 nginx 代理，运行时取 window.location.host
function getAuthority(): string {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') return window.location.host;
    return '127.0.0.1:8080';
}
export const AUTHORITY = getAuthority();
export const HTTP_PREFIX = `http://${AUTHORITY}`;
