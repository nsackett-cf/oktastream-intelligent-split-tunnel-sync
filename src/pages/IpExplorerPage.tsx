import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOktaIpRanges } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, List } from 'lucide-react';
export function IpExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['oktaIpRanges'],
    queryFn: fetchOktaIpRanges,
  });
  const filteredIps = useMemo(() => {
    if (!data?.data?.ip_ranges) return [];
    return data.data.ip_ranges.filter(
      (ip) =>
        ip.ip_range.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.service.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">IP Explorer</h1>
        <p className="text-lg text-muted-foreground">
          Browse and search all public IP ranges published by Okta.
        </p>
      </header>
      <div className="space-y-4">
        <Input
          placeholder="Search by CIDR, region, or service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CIDR Block</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Region</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
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
                    No results found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && filteredIps.map((ip, index) => (
                <TableRow key={`${ip.ip_range}-${index}`} className="font-mono text-sm">
                  <TableCell className="font-medium">{ip.ip_range}</TableCell>
                  <TableCell className="text-muted-foreground">{ip.service}</TableCell>
                  <TableCell className="text-muted-foreground">{ip.region}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
         {data?.data?.last_updated && (
          <p className="text-sm text-muted-foreground text-right">
            Last updated by Okta: {new Date(data.data.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}