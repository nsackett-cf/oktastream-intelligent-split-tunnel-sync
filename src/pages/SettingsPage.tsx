import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, saveSettings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
const settingsSchema = z.object({
  cloudflareAccountId: z.string().min(1, 'Account ID is required'),
  cloudflareApiToken: z.string().min(1, 'API Token is required'),
  splitTunnelPolicyId: z.string().min(1, 'Policy ID is required'),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;
export function SettingsPage() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    select: (res) => res.data,
  });
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      cloudflareAccountId: '',
      cloudflareApiToken: '',
      splitTunnelPolicyId: '',
    },
  });
  useEffect(() => {
    if (settings) {
      form.reset({
        cloudflareAccountId: settings.cloudflareAccountId ?? '',
        cloudflareApiToken: settings.cloudflareApiToken ?? '',
        splitTunnelPolicyId: settings.splitTunnelPolicyId ?? '',
      });
    }
  }, [settings, form]);
  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast.error('Failed to save settings', { description: error.message });
    },
  });
  const onSubmit = (data: SettingsFormValues) => {
    mutation.mutate(data);
  };
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Configuration</h1>
        <p className="text-lg text-muted-foreground">
          Manage your Cloudflare Zero Trust API credentials and settings.
        </p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
              <CardDescription>
                Enter the details for your Cloudflare account to enable synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {isLoading ? (
                <div className="space-y-8">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="cloudflareAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cloudflare Account ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Cloudflare Account ID" {...field} />
                        </FormControl>
                        <FormMessage className="animate-in slide-in-from-bottom-2 duration-200" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cloudflareApiToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cloudflare API Token</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••••••••••••••••••" {...field} />
                          </FormControl>
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? 'Hide token' : 'Show token'}</span>
                          </Button>
                        </div>
                        <FormDescription>
                          This token will be securely handled by the Cloudflare Worker.
                        </FormDescription>
                        <FormMessage className="animate-in slide-in-from-bottom-2 duration-200" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="splitTunnelPolicyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Split Tunnel Policy ID</FormLabel>
                        <FormControl>
                          <Input placeholder="The ID of the policy to update" {...field} />
                        </FormControl>
                        <FormMessage className="animate-in slide-in-from-bottom-2 duration-200" />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
              <Button type="submit" disabled={mutation.isPending || isLoading}>
                {mutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
              {mutation.isSuccess && (
                 <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center text-sm text-green-500">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Saved successfully!</span>
                 </motion.div>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}