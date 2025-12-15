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
  status: 'success' | 'failure' | 'preview';
  added: number;
  removed: number;
  details?: string;
}
export interface CfError {
    code: number;
    message: string;
}
export interface CfDeviceProfile {
  result: {
    id: string;
    split_tunnel?: {
      mode: 'include' | 'exclude';
      ips?: string[];
    };
  };
  success: boolean;
  errors: CfError[];
  messages: string[];
}
export interface SyncPreview {
  preview: true;
  addedCount: number;
  removedCount: number;
}
export interface SyncRequest {
  dryRun: boolean;
}