import { DurableObject } from "cloudflare:workers";
import type { AppConfig, SyncLog } from '@shared/types';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // Generic storage handler for simple key-value operations
    async handleStorageRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const key = url.pathname.split('/').pop();
        if (!key) {
            return new Response('Invalid storage key', { status: 400 });
        }
        switch (request.method) {
            case 'GET': {
                const data = await this.ctx.storage.get(key);
                return new Response(JSON.stringify(data || null), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            case 'POST': {
                const body = await request.text();
                await this.ctx.storage.put(key, JSON.parse(body));
                return new Response('OK', { status: 200 });
            }
            case 'DELETE': {
                await this.ctx.storage.delete(key);
                return new Response('OK', { status: 200 });
            }
            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    }
    // Override fetch to handle different request types
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/storage/')) {
            return this.handleStorageRequest(request);
        }
        // Fallback for original fetch behavior if needed, or handle other paths
        return new Response('Not Found', { status: 404 });
    }
    async getAppConfig(): Promise<AppConfig | null> {
        const cfg = await this.ctx.storage.get<AppConfig>('app_config');
        return cfg ?? null;
    }
    async saveAppConfig(cfg: AppConfig): Promise<void> {
        await this.ctx.storage.put('app_config', cfg);
    }
    async getSyncHistory(): Promise<SyncLog[]> {
        const logs = await this.ctx.storage.get<SyncLog[]>('sync_history');
        return (logs || []).slice(0, 20); // Return last 20, or empty array
    }
    async addSyncLog(log: SyncLog): Promise<SyncLog[]> {
        const logs = await this.getSyncHistory();
        const updated = [log, ...logs].slice(0, 20);
        await this.ctx.storage.put('sync_history', updated);
        return updated;
    }
}