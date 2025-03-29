'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/postgrest';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Product {
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
}

interface ProductMetadata {
    meta_id: number;
    product_id: number;
    meta_key: string;
    meta_value: string;
}

interface ProductImage {
    product_id: number;
    image_url: string;
    is_primary: boolean;
    created_at: string;
}

export default function EditProducts() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [metadata, setMetadata] = useState<ProductMetadata[]>([]);
    const [productImages, setProductImages] = useState<ProductImage[]>([]);

    const productForm = useForm<Product>({
        defaultValues: {
            dimensions: {
                width: 0,
                height: 0,
                length: 0
            }
        }
    });
    const metadataForm = useForm<Omit<ProductMetadata, 'meta_id' | 'product_id'>>({
        defaultValues: {
            meta_key: '',
            meta_value: ''
        }
    });

    const searchProducts = async () => {
        try {
            const response = await api.get(`/products?name=ilike.*${searchTerm}*`);
            if (response.data.length === 0) {
                toast.info('No products found matching your search');
            } else {
                setProducts(response.data);
                toast.success(`Found ${response.data.length} products`);
            }
        } catch (error) {
            toast.error('Failed to search products');
            setProducts([]);
        }
    };

    const fetchMetadata = async (productId: number) => {
        if (typeof productId !== 'number') {
            console.warn('Invalid product ID for metadata fetch');
            return;
        }

        try {
            // Use proper PostgREST filter format
            const response = await api.get('/product_metadata', {
                params: {
                    product_id: `eq.${productId}`
                }
            });

            if (Array.isArray(response.data)) {
                setMetadata(response.data);
            } else {
                console.warn('Unexpected metadata response format:', response.data);
                setMetadata([]);
            }
        } catch (error) {
            console.error('Fetch metadata error:', error);
            toast.error('Failed to fetch metadata');
            setMetadata([]);
        }
    };

    const fetchProductImages = async (productId: number) => {
        try {
            const response = await api.get(`/product_images?product_id=eq.${productId}`);
            setProductImages(response.data);
        } catch (error) {
            toast.error('Failed to fetch product images');
        }
    };

    const onProductSubmit = async (data: Product) => {
        try {
            if (selectedProduct?.product_id) {
                await api.patch(`/products?product_id=eq.${selectedProduct.product_id}`, data);
                toast.success('Product updated successfully');
                searchProducts();
            }
            productForm.reset();
            setSelectedProduct(null);
        } catch (error) {
            toast.error('Failed to update product');
        }
    };

    const onMetadataSubmit = async (data: Omit<ProductMetadata, 'meta_id' | 'product_id'>) => {
        if (!selectedProduct?.product_id) {
            toast.error('No product selected');
            return;
        }

        try {
            // Check if metadata with same key already exists
            const existingMetadata = await api.get('/product_metadata', {
                params: {
                    product_id: `eq.${selectedProduct.product_id}`,
                    meta_key: `eq.${data.meta_key}`
                }
            });

            if (existingMetadata.data?.length > 0) {
                // If exists, update instead of create
                const existingId = existingMetadata.data[0].meta_id;
                await api.patch('/product_metadata', {
                    meta_value: data.meta_value
                }, {
                    params: {
                        meta_id: `eq.${existingId}`
                    }
                });
                toast.success('Metadata updated successfully');
            } else {
                // If doesn't exist, create new
                await api.post('/product_metadata', {
                    product_id: selectedProduct.product_id,
                    meta_key: data.meta_key,
                    meta_value: data.meta_value
                });
                toast.success('Metadata added successfully');
            }

            // Refresh metadata list
            await fetchMetadata(selectedProduct.product_id);
            metadataForm.reset();
        } catch (error: any) {
            console.error('Metadata submission error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save metadata';
            toast.error(errorMessage);
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        try {
            await api.delete(`/products?product_id=eq.${productId}`);
            toast.success('Product deleted successfully');
            searchProducts();
            setSelectedProduct(null);
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleDeleteMetadata = async (metaId: number) => {
        if (typeof metaId !== 'number' || isNaN(metaId)) {
            toast.error('Invalid metadata ID');
            return;
        }

        try {
            await api.delete('/product_metadata', {
                params: {
                    meta_id: `eq.${metaId}`
                }
            });
            toast.success('Metadata deleted successfully');
            if (selectedProduct?.product_id) {
                await fetchMetadata(selectedProduct.product_id);
            }
        } catch (error) {
            console.error('Delete metadata error:', error);
            toast.error('Failed to delete metadata');
        }
    };

    const handleSelectProduct = async (product: Product) => {
        if (!product?.product_id) {
            toast.error('Invalid product selected');
            return;
        }

        setSelectedProduct(product);
        productForm.reset(product);
        await fetchMetadata(product.product_id);
        await fetchProductImages(product.product_id);
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Search Products</h2>
                <div className="flex gap-4 mb-6">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products by name..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                    />
                    <Button 
                        onClick={searchProducts}
                        className="dark:bg-primary-dark dark:hover:bg-primary"
                    >
                        Search
                    </Button>
                </div>

                <div className="space-y-4">
                    {products.map((product) => (
                        <div 
                            key={product.product_id} 
                            className="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {product.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    SKU: {product.sku}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline"
                                    onClick={() => handleSelectProduct(product)}
                                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="danger"
                                    onClick={() => handleDeleteProduct(product.product_id!)}
                                    className="dark:bg-red-900 dark:hover:bg-red-800"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedProduct && (
                <div className="card">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Edit Product</h2>
                    <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                SKU (Stock Keeping Unit)
                            </label>
                            <Input
                                {...productForm.register('sku')}
                                placeholder="SKU"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Product Name
                            </label>
                            <Input
                                {...productForm.register('name')}
                                placeholder="Product Name"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <Textarea
                                {...productForm.register('description')}
                                placeholder="Enter product description"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <Input
                                {...productForm.register('category')}
                                placeholder="Product category"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Weight (kg)
                            </label>
                            <Input
                                {...productForm.register('unit_weight')}
                                type="number"
                                step="0.01"
                                placeholder="Enter weight in kilograms"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Dimensions (cm)
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Width
                                    </label>
                                    <Input
                                        {...productForm.register('dimensions.width')}
                                        type="number"
                                        step="0.1"
                                        placeholder="Width"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Height
                                    </label>
                                    <Input
                                        {...productForm.register('dimensions.height')}
                                        type="number"
                                        step="0.1"
                                        placeholder="Height"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Length
                                    </label>
                                    <Input
                                        {...productForm.register('dimensions.length')}
                                        type="number"
                                        step="0.1"
                                        placeholder="Length"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Season
                            </label>
                            <Input
                                {...productForm.register('season')}
                                placeholder="e.g., Spring/Summer 2024"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Gender
                            </label>
                            <Input
                                {...productForm.register('gender')}
                                placeholder="e.g., Men, Women, Unisex"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Collection
                            </label>
                            <Input
                                {...productForm.register('collection')}
                                placeholder="Collection name"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Material
                            </label>
                            <Input
                                {...productForm.register('material')}
                                placeholder="e.g., Cotton, Polyester, Leather"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Style
                            </label>
                            <Input
                                {...productForm.register('style')}
                                placeholder="e.g., Casual, Formal, Sports"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                        </div>

                        <Button 
                            type="submit"
                            className="w-full dark:bg-primary-dark dark:hover:bg-primary"
                        >
                            Update Product
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}



