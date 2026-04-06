export const AUTHORITY = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.host : '127.0.0.1:8080');
export const HTTP_PREFIX = `http://${AUTHORITY}`;
