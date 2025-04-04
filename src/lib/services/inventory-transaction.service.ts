import { InventoryTransaction } from '@/types/inventory-transaction';
import { BaseService } from './base.service';

export class InventoryTransactionService extends BaseService {
    private static readonly endpoint = '/inventory_transactions';

    static async getInventoryTransactions() {
        const response = await this.get<InventoryTransaction[]>(this.endpoint);
        return response.data;
    }

    static async createInventoryTransaction(data: Omit<InventoryTransaction, 'transaction_id' | 'transaction_date'>) {
        const response = await this.post<InventoryTransaction>(this.endpoint, data);
        return response.data;
    }

    static async updateInventoryTransaction(transactionId: number, data: Partial<InventoryTransaction>) {
        const filter = this.buildFilter('transaction_id', 'eq', transactionId);
        const response = await this.patch<InventoryTransaction>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async deleteInventoryTransaction(transactionId: number) {
        const filter = this.buildFilter('transaction_id', 'eq', transactionId);
        await this.delete(`${this.endpoint}?${filter}`);
    }
}