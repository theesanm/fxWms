import postgrest from '@/lib/postgrest';
import { Product } from '@/types/product';
import { ProductFormData } from '../types/product-form';
import { AxiosError } from 'axios';

class ProductService {
    static async create(productData: Omit<ProductFormData, 'meta_key' | 'meta_value'>): Promise<Product | Product[]> {
        try {
            console.log('ProductService.create - Sending data:', productData);

            const response = await postgrest.post('/products', productData, {
                headers: {
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }
            });

            console.log('ProductService.create - Raw response:', response);
            
            if (!response.data) {
                throw new Error('No data received from server');
            }

            // Handle array response
            const productResponse = Array.isArray(response.data) ? response.data[0] : response.data;
            
            // Validate the response has required fields
            if (!productResponse || typeof productResponse.product_id !== 'number') {
                console.error('Invalid product response structure:', productResponse);
                throw new Error('Invalid product response structure');
            }

            // Ensure all required fields are present
            const createdProduct: Product = {
                product_id: productResponse.product_id,
                sku: productResponse.sku,
                name: productResponse.name,
                description: productResponse.description,
                category: productResponse.category,
                unit_weight: productResponse.unit_weight,
                dimensions: productResponse.dimensions || {
                    width: 0,
                    height: 0,
                    length: 0
                },
                season: productResponse.season || '',
                gender: productResponse.gender || '',
                collection: productResponse.collection || '',
                material: productResponse.material || '',
                style: productResponse.style || ''
            };

            return createdProduct;

        } catch (error) {
            console.error('ProductService.create - Error details:', {
                error,
                message: (error as { message?: string })?.message,
                response: (error as AxiosError)?.response?.data
            });
            throw error;
        }
    }
}

export { ProductService };




