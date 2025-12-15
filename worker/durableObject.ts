import { DurableObject } from "cloudflare:workers";
import type { DemoItem } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // Generic storage handler for simple key-value operations
    async handleStorageRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const key = url.pathname.split('/').pop();
        if (!key) {
            return new Response('Invalid storage key', { status: 400 });
        }
        switch (request.method) {
            case 'GET': {
                const data = await this.ctx.storage.get(key);
                return new Response(JSON.stringify(data || null), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            case 'POST': {
                const body = await request.text();
                await this.ctx.storage.put(key, JSON.parse(body));
                return new Response('OK', { status: 200 });
            }
            case 'DELETE': {
                await this.ctx.storage.delete(key);
                return new Response('OK', { status: 200 });
            }
            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    }
    // Override fetch to handle different request types
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/storage/')) {
            return this.handleStorageRequest(request);
        }
        // Fallback for original fetch behavior if needed, or handle other paths
        return new Response('Not Found', { status: 404 });
    }
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async decrement(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value -= amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get("demo_items");
      if (items) {
        return items as DemoItem[];
      }
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
    async addDemoItem(item: DemoItem): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = [...items, item];
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async updateDemoItem(id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async deleteDemoItem(id: string): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
}