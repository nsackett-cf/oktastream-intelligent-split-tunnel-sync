import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, AppConfig, OktaResponse, SyncLog, CfDeviceProfile, SyncRequest, SyncPreview } from '@shared/types';
const OKTA_IP_RANGES_URL = "https://s3.amazonaws.com/okta-ip-ranges/ip_ranges.json";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/okta/fetch', async (c) => {
        try {
            const response = await fetch(OKTA_IP_RANGES_URL, { headers: { 'User-Agent': 'OktaStream-Sync-Worker/1.0' } });
            if (!response.ok) throw new Error(`Failed to fetch Okta IP ranges: ${response.statusText}`);
            const data: OktaResponse = await response.json();
            return c.json({ success: true, data } satisfies ApiResponse<OktaResponse>);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return c.json({ success: false, error: errorMessage }, 500);
        }
    });
    app.get('/api/settings', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const config = await stub.getAppConfig();
        return c.json({ success: true, data: config ?? {} } satisfies ApiResponse<Partial<AppConfig>>);
    });
    app.post('/api/settings', async (c) => {
        const body = await c.req.json<AppConfig>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        await stub.saveAppConfig(body);
        return c.json({ success: true, data: body } satisfies ApiResponse<AppConfig>);
    });
    app.get('/api/history', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const history = await stub.getSyncHistory();
        return c.json({ success: true, data: history } satisfies ApiResponse<SyncLog[]>);
    });
    app.post('/api/sync', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        try {
            const { dryRun } = await c.req.json<SyncRequest>();
            const config = await stub.getAppConfig();
            if (!config?.cloudflareAccountId || !config.cloudflareApiToken || !config.splitTunnelPolicyId) {
                return c.json({ success: false, error: 'Configuration is incomplete. Please update settings.' }, 400);
            }
            const oktaRes = await fetch(OKTA_IP_RANGES_URL);
            if (!oktaRes.ok) throw new Error('Failed to fetch Okta IPs');
            const oktaData: OktaResponse = await oktaRes.json();
            const oktaSet = new Set(oktaData.ip_ranges.map(r => r.ip_range));
            const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/devices/profiles/${config.splitTunnelPolicyId}`;
            const cfHeaders = { 'Authorization': `Bearer ${config.cloudflareApiToken}`, 'Content-Type': 'application/json' };
            const cfRes = await fetch(cfUrl, { headers: cfHeaders });
            const cfData: CfDeviceProfile = await cfRes.json();
            if (!cfData.success || cfData.errors?.length > 0) {
                throw new Error(cfData.errors[0]?.message || 'Failed to fetch Cloudflare profile.');
            }
            const currentIps = cfData.result.split_tunnel?.ips ?? [];
            const currentSet = new Set(currentIps);
            const added = [...oktaSet].filter(ip => !currentSet.has(ip)).length;
            const removed = [...currentSet].filter(ip => !oktaSet.has(ip)).length;
            if (dryRun) {
                const preview: SyncPreview = { preview: true, addedCount: added, removedCount: removed };
                const log: SyncLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), status: 'preview', added, removed, details: 'Dry run preview generated.' };
                await stub.addSyncLog(log);
                return c.json({ success: true, data: preview } satisfies ApiResponse<SyncPreview>);
            }
            const newIps = [...oktaSet];
            const patchBody = JSON.stringify({ split_tunnel: { mode: 'include', ips: newIps } });
            const patchRes = await fetch(cfUrl, { method: 'PATCH', headers: cfHeaders, body: patchBody });
            if (!patchRes.ok) {
                const errorText = await patchRes.text();
                throw new Error(`Cloudflare API Error: ${errorText}`);
            }
            const log: SyncLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), status: 'success', added, removed, details: 'Policy updated successfully.' };
            await stub.addSyncLog(log);
            return c.json({ success: true, data: log } satisfies ApiResponse<SyncLog>);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'An unknown error occurred during sync.';
            const log: SyncLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), status: 'failure', added: 0, removed: 0, details: msg };
            await stub.addSyncLog(log);
            return c.json({ success: false, error: msg }, 500);
        }
    });
}
declare module './durableObject' {
    interface GlobalDurableObject {
        getAppConfig(): Promise<AppConfig | null>;
        saveAppConfig(cfg: AppConfig): Promise<void>;
        getSyncHistory(): Promise<SyncLog[]>;
        addSyncLog(log: SyncLog): Promise<SyncLog[]>;
    }
}