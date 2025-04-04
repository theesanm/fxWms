export interface ProductFormData {
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
    meta_key?: string;
    meta_value?: string;
}