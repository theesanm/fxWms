export interface TransactionType {
    transactiontype_id: number;
    name: string;
    created_at: string;
}

export type TransactionTypeFormData = Omit<TransactionType, 'transactiontype_id' | 'created_at'>;