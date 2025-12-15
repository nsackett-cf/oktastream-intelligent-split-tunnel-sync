import type { ApiResponse, OktaResponse, AppConfig, SyncLog, SyncPreview } from '@shared/types';
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type");
  if (!response.ok) {
    let errorText = `HTTP error! status: ${response.status}`;
    if (contentType && contentType.includes("application/json")) {
        const errorJson = await response.json().catch(() => ({ error: 'Failed to parse error JSON.' }));
        errorText = errorJson.error || errorJson.message || JSON.stringify(errorJson);
    } else {
        errorText = await response.text().catch(() => 'Failed to read error response.');
    }
    console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
    return { success: false, error: errorText };
  }
  try {
    return await response.json() as ApiResponse<T>;
  } catch (e) {
    console.error('API Error: Failed to parse JSON response', e);
    return { success: false, error: 'Invalid JSON response from server.' };
  }
};
export const fetchOktaIpRanges = async (): Promise<ApiResponse<OktaResponse>> => {
  const response = await fetch('/api/okta/fetch');
  return handleResponse<OktaResponse>(response);
};
export const getSettings = async (): Promise<ApiResponse<Partial<AppConfig>>> => {
    const response = await fetch('/api/settings');
    return handleResponse<Partial<AppConfig>>(response);
};
export const saveSettings = async (config: AppConfig): Promise<ApiResponse<AppConfig>> => {
    const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    return handleResponse<AppConfig>(response);
};
export const getSyncHistory = async (): Promise<ApiResponse<SyncLog[]>> => {
  const res = await fetch('/api/history');
  return handleResponse<SyncLog[]>(res);
};
export const sync = async (dryRun: boolean): Promise<ApiResponse<SyncPreview | SyncLog>> => {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ dryRun })
  });
  return handleResponse<SyncPreview | SyncLog>(res);
};