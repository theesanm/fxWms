import { Warehouse } from '@/types/warehouse';

export class WarehouseService extends BaseService {
    private static readonly endpoint = '/warehouses';

    static async getWarehouses() {
        const response = await this.get<Warehouse[]>(this.endpoint);
        return response.data;
    }

    static async updateWarehouse(warehouseId: number, data: Partial<Warehouse>) {
        const filter = this.buildFilter('warehouse_id', 'eq', warehouseId);
        const response = await this.patch<Warehouse>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async createWarehouse(data: Omit<Warehouse, 'warehouse_id'>) {
        const response = await this.post<Warehouse>(this.endpoint, data);
        return response.data;
    }

    static async deleteWarehouse(warehouseId: number) {
        const filter = this.buildFilter('warehouse_id', 'eq', warehouseId);
        return this.delete(`${this.endpoint}?${filter}`);
    }
}