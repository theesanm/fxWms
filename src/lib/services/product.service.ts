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

    // Updated delete method to match BaseService signature
    static async deleteProduct(productId: number) {
        const endpoint = `${this.endpoint}?product_id=eq.${productId}`;
        return this.delete(endpoint);
    }

    static async update(productId: number, data: Partial<Product>) {
        const response = await this.patch<Product>(`${this.endpoint}?product_id=eq.${productId}`, data);
        return response.data;
    }
}



