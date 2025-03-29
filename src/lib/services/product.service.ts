import { BaseService } from './base.service';
import { Product } from '@/types/product';

export class ProductService extends BaseService {
    private static readonly endpoint = '/products';

    static async getAll() {
        const response = await this.get<Product[]>(this.endpoint);
        return response.data;
    }

    static async search(searchTerm: string) {
        const response = await this.get<Product[]>(`${this.endpoint}?name=ilike.*${searchTerm}*`);
        return response.data;
    }

    static async getById(productId: number) {
        const response = await this.get<Product[]>(`${this.endpoint}?product_id=eq.${productId}`);
        return response.data[0];
    }

    static async create(data: Omit<Product, 'product_id'>) {
        const response = await this.post<Product>(this.endpoint, data);
        return response.data;
    }

    static async update(productId: number, data: Partial<Product>) {
        const response = await this.patch<Product>(
            `${this.endpoint}?product_id=eq.${productId}`,
            data
        );
        return response.data;
    }

    static async delete(productId: number) {
        return this.delete(`${this.endpoint}?product_id=eq.${productId}`);
    }

    static async checkSkuExists(sku: string): Promise<boolean> {
        const response = await this.get<Product[]>(`${this.endpoint}?sku=eq.${sku}`);
        return response.data.length > 0;
    }
}


