export interface Inventory {
  inventory_id?: number;
  product_id: number;
  location_id: number;
  lot_number: string;
  expiration_date: string;
  quantity_on_hand: number;
  updated_at?: string;
}

export interface InventoryFormData {
  product_id: string;
  location_id: string;
  lot_number: string;
  expiration_date: string;
  quantity_on_hand: string;
}