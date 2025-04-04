export interface InventoryTransaction {
    transaction_id: number;
    inventory_id: number;
    transaction_type: string;
    quantity_change: number;
    transaction_date: string;
    reference_id: string;
    notes: string;
}

export interface InventoryTransactionFormData {
    inventory_id: string;
    transaction_type: string;
    quantity_change: string;
    reference_id: string;
    notes?: string;
}
