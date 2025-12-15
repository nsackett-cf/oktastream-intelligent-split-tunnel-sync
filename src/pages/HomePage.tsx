import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchOktaIpRanges, simulateSync } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Globe, CheckCircle, AlertTriangle, Zap, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
export function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['oktaIpRanges'],
    queryFn: fetchOktaIpRanges,
  });
  const syncMutation = useMutation({
    mutationFn: simulateSync,
    onSuccess: (res) => {
      if (res.success && res.data) {
        toast.success('Simulation Complete', {
          description: `Added ${res.data.added} and removed ${res.data.removed} IP ranges.`,
        });
      } else {
        toast.error('Simulation Failed', { description: res.error });
      }
    },
    onError: (err) => {
      toast.error('Simulation Failed', { description: err.message });
    },
  });
  const ipCount = data?.data?.ip_ranges?.length ?? 0;
  const lastUpdated = data?.data?.last_updated;
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-lg text-muted-foreground">
          Oversee and manage the synchronization of Okta IP ranges to Cloudflare Zero Trust.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : error ? (
          <div className="md:col-span-2 lg:col-span-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Failed to Fetch Okta Data</AlertTitle>
              <AlertDescription>
                Could not retrieve IP range information from Okta. The dashboard may not function correctly.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <StatCard
              title="Sync Status"
              value="Ready"
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              description="System is operational and ready to sync."
            />
            <StatCard
              title="Total Okta IP Ranges"
              value={ipCount}
              icon={<Globe className="h-5 w-5" />}
              description="Live count from Okta's public list."
            />
            <StatCard
              title="Last Okta Update"
              value={lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 'N/A'}
              icon={<Clock className="h-5 w-5" />}
              description="How recently Okta published changes."
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Control</CardTitle>
              <CardDescription>
                Initiate a dry-run or a live sync to update your Cloudflare policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Phase 1: Simulation Mode</AlertTitle>
                <AlertDescription>
                  The "Sync Now" button currently performs a simulated dry-run. No actual changes will be made to your Cloudflare account in this phase.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || isLoading || !!error}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {syncMutation.isPending ? 'Simulating...' : 'Run Sync Simulation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
           <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Logs of recent sync operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <p>No sync history yet.</p>
                <p className="text-sm">Run a simulation to see activity here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="text-center text-sm text-muted-foreground/80 pt-8">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}