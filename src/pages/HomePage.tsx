import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOktaIpRanges, getSettings, getSyncHistory, sync } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Globe, CheckCircle, AlertTriangle, Zap, Info, Settings, History, ArrowRight, Plus, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { SyncLog, SyncPreview } from '@shared/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
const StatusBadge = ({ status }: { status: SyncLog['status'] }) => {
  const variants = {
    success: { variant: 'default', className: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Success' },
    failure: { variant: 'destructive', className: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Failed' },
    preview: { variant: 'secondary', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Preview' },
  } as const;
  const { variant, className, label } = variants[status];
  return <Badge variant={variant} className={cn('capitalize', className || '')}>{label}</Badge>;
};
export function HomePage() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: oktaData, isLoading: isOktaLoading, error: oktaError } = useQuery({
    queryKey: ['oktaIpRanges'],
    queryFn: fetchOktaIpRanges,
  });
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
  const isConfigured = !!(settings?.data?.cloudflareAccountId && settings.data.cloudflareApiToken && settings.data.splitTunnelPolicyId);
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['history'],
    queryFn: getSyncHistory,
    select: (res) => res.data ?? [],
  });
  const syncMutation = useMutation({
    mutationFn: (dryRun: boolean) => sync(dryRun),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      if (res.success) {
        const data = res.data;
        if (data && 'preview' in data) {
          setPreview(data);
          setIsModalOpen(true);
        } else if (data) {
          const log = data as SyncLog;
          toast.success('Live Sync Successful', { description: `Policy updated with ${log.added} added and ${log.removed} removed ranges.` });
          setIsModalOpen(false);
        }
      } else {
        toast.error('Operation Failed', { description: res.error });
      }
    },
    onError: (err) => {
      toast.error('Operation Failed', { description: err.message });
    },
  });
  const ipCount = oktaData?.data?.ip_ranges?.length ?? 0;
  const lastOktaUpdate = oktaData?.data?.last_updated;
  const lastSync = history[0];
  const isLoading = isOktaLoading || isSettingsLoading;
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-lg text-muted-foreground">Oversee and manage the synchronization of Okta IP ranges to Cloudflare Zero Trust.</p>
      </header>
      {!isSettingsLoading && !isConfigured && (
        <Alert variant="destructive" className="bg-yellow-500/5 border-yellow-500/20 text-yellow-200">
          <Settings className="h-4 w-4 !text-yellow-400" />
          <AlertTitle className="text-yellow-300">Setup Required</AlertTitle>
          <AlertDescription>
            Your Cloudflare API credentials are not configured. Please go to the configuration page to complete the setup.
            <Button asChild variant="link" className="p-0 h-auto ml-2 text-yellow-300 hover:text-yellow-100">
              <Link to="/settings">Go to Configuration <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          : oktaError ? (
            <div className="md:col-span-2 lg:col-span-3">
              <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Failed to Fetch Okta Data</AlertTitle><AlertDescription>Could not retrieve IP range information from Okta.</AlertDescription></Alert>
            </div>
          ) : (
            <>
              <StatCard title="Sync Status" value={lastSync?.status === 'success' ? 'Synced' : 'Ready'} icon={lastSync?.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Info className="h-5 w-5 text-blue-500" />} description={lastSync ? `Last sync: ${formatDistanceToNow(new Date(lastSync.timestamp), { addSuffix: true })}` : 'Ready for first sync'} />
              <StatCard title="Total Okta IP Ranges" value={ipCount} icon={<Globe className="h-5 w-5" />} description="Live count from Okta's public list." />
              <StatCard title="Last Okta Update" value={lastOktaUpdate ? formatDistanceToNow(new Date(lastOktaUpdate), { addSuffix: true }) : 'N/A'} icon={<Clock className="h-5 w-5" />} description="How recently Okta published changes." />
            </>
          )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Synchronization Control</CardTitle><CardDescription>Initiate a dry-run to preview changes or a live sync to update your Cloudflare policy.</CardDescription></CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => syncMutation.mutate(true)} disabled={syncMutation.isPending || isLoading || !!oktaError || !isConfigured}>
                <Zap className="mr-2 h-4 w-4" />
                {syncMutation.isPending && syncMutation.variables === true ? 'Scanning...' : 'Scan & Dry Run'}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>A log of the latest sync operations.</CardDescription></CardHeader>
            <CardContent>
              {isHistoryLoading ? <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                : history.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 flex flex-col items-center justify-center h-full"><History className="h-8 w-8 mb-2" /><p>No sync history yet.</p><p className="text-sm">Run a scan to see activity here.</p></div>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 4).map(log => (
                      <div key={log.id} className="flex items-center justify-between text-sm p-3 rounded-md border bg-card-foreground/5">
                        <div className="flex items-center gap-3"><StatusBadge status={log.status} /><span className="text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span></div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="flex items-center text-green-400"><Plus className="h-3 w-3 mr-1" />{log.added}</span>
                          <span className="flex items-center text-red-400"><Minus className="h-3 w-3 mr-1" />{log.removed}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DialogHeader>
              <DialogTitle>Dry Run Preview</DialogTitle>
              <DialogDescription>Review the changes that will be applied to your Split Tunnel policy. No changes have been made yet.</DialogDescription>
            </DialogHeader>
            <div className="my-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: 'Changes', added: preview?.addedCount ?? 0, removed: preview?.removedCount ?? 0 }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="added" fill="hsl(142.1 76.2% 41.2%)" name="Added" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="removed" fill="hsl(0 84.2% 60.2%)" name="Removed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={() => syncMutation.mutate(false)} disabled={syncMutation.isPending}>
                {syncMutation.isPending && syncMutation.variables === false ? 'Applying...' : 'Apply Live Sync'}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
      <footer className="text-center text-sm text-muted-foreground/80 pt-8">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}