import { TransactionType } from '@/types/transaction-type';
import { BaseService } from './base.service';

export class TransactionTypeService extends BaseService {
    private static readonly endpoint = '/transaction_type';

    static async getTransactionTypes() {
        const response = await this.get<TransactionType[]>(this.endpoint);
        return response.data;
    }

    static async createTransactionType(data: Omit<TransactionType, 'transactiontype_id' | 'created_at'>) {
        const response = await this.post<TransactionType>(this.endpoint, data);
        return response.data;
    }

    static async updateTransactionType(id: number, data: Partial<TransactionType>) {
        const filter = this.buildFilter('transactiontype_id', 'eq', id);
        const response = await this.patch<TransactionType>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async deleteTransactionType(id: number) {
        const filter = this.buildFilter('transactiontype_id', 'eq', id);
        return this.delete(`${this.endpoint}?${filter}`);
    }
}