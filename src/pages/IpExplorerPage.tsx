import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOktaIpRanges } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, List, Server, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from 'react-use';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
export function IpExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 300, [searchTerm]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['oktaIpRanges'],
    queryFn: fetchOktaIpRanges,
  });
  const services = useMemo(() => Array.from(new Set(data?.data?.ip_ranges.map(r => r.service) ?? [])).sort(), [data]);
  const regions = useMemo(() => Array.from(new Set(data?.data?.ip_ranges.map(r => r.region) ?? [])).sort(), [data]);
  const filteredIps = useMemo(() => {
    let ips = data?.data?.ip_ranges ?? [];
    if (debouncedSearchTerm) {
      ips = ips.filter(ip =>
        ip.ip_range.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        ip.service.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        ip.region.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (serviceFilter) ips = ips.filter(ip => ip.service === serviceFilter);
    if (regionFilter) ips = ips.filter(ip => ip.region === regionFilter);
    return ips;
  }, [data, debouncedSearchTerm, serviceFilter, regionFilter]);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">IP Explorer</h1>
        <p className="text-lg text-muted-foreground">
          Browse, search, and filter all public IP ranges published by Okta.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Ranges" value={isLoading ? '...' : data?.data?.ip_ranges?.length ?? 0} icon={<List className="h-5 w-5" />} />
        <StatCard title="Filtered Results" value={isLoading ? '...' : filteredIps.length} icon={<List className="h-5 w-5 text-blue-500" />} />
        <StatCard title="Unique Services" value={isLoading ? '...' : services.length} icon={<Server className="h-5 w-5" />} />
        <StatCard title="Unique Regions" value={isLoading ? '...' : regions.length} icon={<Globe className="h-5 w-5" />} />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search by CIDR, region, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Select onValueChange={(v) => setServiceFilter(v === 'all' ? '' : v)} value={serviceFilter || 'all'}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setRegionFilter(v === 'all' ? '' : v)} value={regionFilter || 'all'}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border">
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>CIDR Block</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Region</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 15 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {error && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            Failed to load IP ranges. Please try again later.
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && filteredIps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No results found for your filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && filteredIps.map((ip, index) => (
                    <TableRow key={`${ip.ip_range}-${index}`} className="font-mono text-sm hover:bg-accent transition-colors">
                      <TableCell className="font-medium">{ip.ip_range}</TableCell>
                      <TableCell className="text-muted-foreground">{ip.service}</TableCell>
                      <TableCell className="text-muted-foreground">{ip.region}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          {data?.data?.last_updated && (
            <p className="text-sm text-muted-foreground text-right mt-2">
              Last updated by Okta: {new Date(data.data.last_updated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}