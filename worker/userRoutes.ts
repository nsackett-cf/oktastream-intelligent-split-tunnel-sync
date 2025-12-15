import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, AppConfig, OktaResponse, SyncLog } from '@shared/types';
const OKTA_IP_RANGES_URL = "https://s3.amazonaws.com/okta-ip-ranges/ip_ranges.json";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Proxy to fetch Okta IP ranges, avoiding client-side CORS issues.
    app.get('/api/okta/fetch', async (c) => {
        try {
            const response = await fetch(OKTA_IP_RANGES_URL, {
                headers: {
                    'User-Agent': 'OktaStream-Sync-Worker/1.0'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch Okta IP ranges: ${response.statusText}`);
            }
            const data: OktaResponse = await response.json();
            return c.json({ success: true, data } satisfies ApiResponse<OktaResponse>);
        } catch (error) {
            console.error('Error fetching Okta IP ranges:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return c.json({ success: false, error: errorMessage }, 500);
        }
    });
    // Mock endpoints for Phase 1
    app.get('/api/settings', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const config = await durableObjectStub.fetch("storage:app_config").then(res => res.json()).catch(() => ({}));
        return c.json({ success: true, data: config } satisfies ApiResponse<AppConfig>);
    });
    app.post('/api/settings', async (c) => {
        const body = await c.req.json() as AppConfig;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        await durableObjectStub.fetch("storage:app_config", { method: "POST", body: JSON.stringify(body) });
        return c.json({ success: true, data: body } satisfies ApiResponse<AppConfig>);
    });
    app.post('/api/sync/simulate', async (c) => {
        const newLog: SyncLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'simulated',
            added: Math.floor(Math.random() * 10),
            removed: Math.floor(Math.random() * 3),
            details: 'This is a simulated dry-run. No changes were applied.'
        };
        return c.json({ success: true, data: newLog } satisfies ApiResponse<SyncLog>);
    });
}
// Add storage methods to Durable Object
declare module './durableObject' {
    interface GlobalDurableObject {
        handleStorageRequest(request: Request): Promise<Response>;
    }
}