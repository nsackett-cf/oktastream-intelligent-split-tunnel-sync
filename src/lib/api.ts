import type { ApiResponse, OktaResponse, AppConfig, SyncLog } from '@shared/types';
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Failed to read error response.');
    console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
    return { success: false, error: `HTTP error! status: ${response.status}` };
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
export const getSettings = async (): Promise<ApiResponse<AppConfig>> => {
    const response = await fetch('/api/settings');
    return handleResponse<AppConfig>(response);
};
export const saveSettings = async (config: AppConfig): Promise<ApiResponse<AppConfig>> => {
    const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    return handleResponse<AppConfig>(response);
};
export const simulateSync = async (): Promise<ApiResponse<SyncLog>> => {
    const response = await fetch('/api/sync/simulate', { method: 'POST' });
    return handleResponse<SyncLog>(response);
};