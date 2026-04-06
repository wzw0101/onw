// 生产环境通过 nginx 代理访问，使用当前域名；开发环境使用 NEXT_PUBLIC_API_URL
export const AUTHORITY = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.host : '127.0.0.1:8080');
export const HTTP_PREFIX = `http://${AUTHORITY}`;
