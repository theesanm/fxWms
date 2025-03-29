import { BaseService } from './base.service';

export interface Product {
    product_id: number;
    sku: string;
    name: string;
    description: string;
    category: string;
    unit_weight: number;
    dimensions: {
        width: number;
        height: number;
        length: number;
    };
    season: string;
    gender: string;
    collection: string;
    material: string;
    style: string;
}

export class ProductService extends BaseService {
    private static readonly endpoint = '/products';

    static async getAll() {
        const response = await this.get<Product[]>(this.endpoint);
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

    static async delete(endpoint: string) {
        return super.delete(endpoint);
    }

    static async deleteById(productId: number) {
        const endpoint = `${this.endpoint}?product_id=eq.${productId}`;
        return this.delete(endpoint);
    }

    static async checkSkuExists(sku: string): Promise<boolean> {
        const response = await this.get<Product[]>(`${this.endpoint}?sku=eq.${sku}`);
        return response.data.length > 0;
    }
}

