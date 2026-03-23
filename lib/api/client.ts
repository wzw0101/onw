import { HTTP_PREFIX } from '../constants/config';
import { ResponseBody } from '../types';

async function request<T>(method: string, url: string, body?: object): Promise<ResponseBody<T>> {
    const init: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        init.body = JSON.stringify(body);
    }
    const response = await fetch(`${HTTP_PREFIX}${url}`, init);
    const text = await response.text();
    return text ? JSON.parse(text) : {} as ResponseBody<T>;
}

export const apiClient = {
    get: <T>(url: string) => request<T>('GET', url),
    post: <T>(url: string, body?: object) => request<T>('POST', url, body ?? {}),
    put: <T>(url: string, body?: object) => request<T>('PUT', url, body ?? {}),
    delete: <T>(url: string) => request<T>('DELETE', url),
};
