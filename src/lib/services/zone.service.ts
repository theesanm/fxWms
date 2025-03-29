import { Zone } from '../../types/zone';
import { BaseService } from './base.service';

export class ZoneService extends BaseService {
    private static readonly endpoint = '/zones';

    static async getZones() {
        const response = await this.get<Zone[]>(this.endpoint);
        return response.data;
    }

    static async getZonesByWarehouse(warehouseId: number) {
        const filter = this.buildFilter('warehouse_id', 'eq', warehouseId);
        const response = await this.get<Zone[]>(`${this.endpoint}?${filter}`);
        return response.data;
    }

    static async createZone(data: Omit<Zone, 'zone_id'>) {
        const response = await this.post<Zone>(this.endpoint, data);
        return response.data;
    }

    static async updateZone(zoneId: number, data: Partial<Zone>) {
        const filter = this.buildFilter('zone_id', 'eq', zoneId);
        const response = await this.patch<Zone>(
            `${this.endpoint}?${filter}`,
            data
        );
        return response.data;
    }

    static async deleteZone(zoneId: number) {
        const filter = this.buildFilter('zone_id', 'eq', zoneId);
        return this.delete(`${this.endpoint}?${filter}`);
    }
}

