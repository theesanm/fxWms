import { Inventory } from '@/types/inventory';
import { BaseService } from './base.service';

export class InventoryService extends BaseService {
    private static readonly endpoint = '/inventory';

    static async getInventory() {
        const response = await this.get<Inventory[]>(this.endpoint);
        return response.data;
    }

    static async updateInventory(inventoryId: number, data: Partial<Inventory>) {
        const filter = this.buildFilter('inventory_id', 'eq', inventoryId);
        const response = await this.patch<Inventory>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async createInventory(data: Omit<Inventory, 'inventory_id'>) {
        const response = await this.post<Inventory>(this.endpoint, data);
        return response.data;
    }

    static async deleteInventory(inventoryId: number) {
        const filter = this.buildFilter('inventory_id', 'eq', inventoryId);
        await this.delete(`${this.endpoint}?${filter}`);
    }
}