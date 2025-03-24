'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api'; // Use PostgREST client
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

export default function EditProductsPage() {
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
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Edit Products</h1>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search Products
                        </label>
                        <Input
                            id="search"
                            placeholder="Search products by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                        />
                    </div>
                    <Button onClick={searchProducts} className="self-end">Search</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6">Products</h2>
                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No products found</p>
                        ) : (
                            products.map((product) => (
                                <div key={`product-${product.product_id}`} className="border p-4 rounded">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{product.name}</h3>
                                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleSelectProduct(product)}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleDeleteProduct(product.product_id!)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                {selectedProduct && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-6">Edit Product</h2>
                        <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                <Input {...productForm.register('sku')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <Input {...productForm.register('name')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <Textarea {...productForm.register('description')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <Input {...productForm.register('category')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Weight (kg)</label>
                                <Input {...productForm.register('unit_weight')} type="number" step="0.01" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Width</label>
                                        <Input {...productForm.register('dimensions.width')} type="number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Height</label>
                                        <Input {...productForm.register('dimensions.height')} type="number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Length</label>
                                        <Input {...productForm.register('dimensions.length')} type="number" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                                <Input {...productForm.register('season')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <Input {...productForm.register('gender')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                                <Input {...productForm.register('collection')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                <Input {...productForm.register('material')} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                                <Input {...productForm.register('style')} />
                            </div>

                            <Button type="submit" className="w-full">Update Product</Button>
                        </form>

                        {/* Add Images Section */}
                        <div className="mt-8 border-t pt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Product Images</h3>
                                <Button 
                                    onClick={() => router.push(`/product/${selectedProduct.product_id}/images`)}
                                    variant="outline"
                                >
                                    Manage Images
                                </Button>
                            </div>

                            {productImages.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No images available</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {productImages.sort((a, b) => (a.is_primary ? -1 : 1)).map((image) => (
                                        <div key={`image-${image.product_id}-${image.image_url}`} className="relative aspect-square">
                                            <Image
                                                src={image.image_url}
                                                alt={`Product image${image.is_primary ? ' (Primary)' : ''}`}
                                                fill
                                                className="object-cover rounded-md"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                            />
                                            {image.is_primary && (
                                                <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-sm">
                                                    Primary
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Metadata Section */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Product Metadata</h3>
                            <form onSubmit={metadataForm.handleSubmit((data) => onMetadataSubmit({
                                meta_key: data.meta_key,
                                meta_value: data.meta_value
                            }))} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Key</label>
                                    <Input {...metadataForm.register('meta_key')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Value</label>
                                    <Input {...metadataForm.register('meta_value')} />
                                </div>
                                <Button type="submit" className="md:col-span-2">Add Metadata</Button>
                            </form>

                            <div className="space-y-4">
                                {metadata.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No metadata found</p>
                                ) : (
                                    metadata.map((meta, index) => (
                                        <div 
                                            key={meta.meta_id ? `metadata-${meta.meta_id}` : `metadata-new-${index}`} 
                                            className="flex justify-between items-center border p-4 rounded"
                                        >
                                            <div>
                                                <p className="font-semibold">{meta.meta_key}</p>
                                                <p className="text-sm text-gray-600">{meta.meta_value}</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {
                                                    const metaId = Number(meta.meta_id);
                                                    if (!isNaN(metaId)) {
                                                        handleDeleteMetadata(metaId);
                                                    } else {
                                                        toast.error('Invalid metadata ID');
                                                    }
                                                }}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



































