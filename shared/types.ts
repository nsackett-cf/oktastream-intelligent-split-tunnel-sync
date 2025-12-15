export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface OktaIpRange {
  ip_range: string;
  region: string;
  service: string;
  version: string;
}
export interface OktaResponse {
  ip_ranges: OktaIpRange[];
  last_updated: string;
}
export interface AppConfig {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  splitTunnelPolicyId: string;
}
export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failure' | 'simulated';
  added: number;
  removed: number;
  details?: string;
}