export interface Product {
    product_id?: number;
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
    created_at?: string;
    updated_at?: string;
}

export interface ProductMetadata {
    meta_id: number;
    product_id: number;
    meta_key: string;
    meta_value: string;
}


