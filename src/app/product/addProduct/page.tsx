'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api'; // Use PostgREST client
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define validation schema
const productSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    unit_weight: z.number().min(0.01, 'Weight must be greater than 0'),
    dimensions: z.object({
        width: z.number().min(0, 'Width cannot be negative'),
        height: z.number().min(0, 'Height cannot be negative'),
        length: z.number().min(0, 'Length cannot be negative'),
    }),
    season: z.string().min(1, 'Season is required'),
    gender: z.string().min(1, 'Gender is required'),
    collection: z.string().min(1, 'Collection is required'),
    material: z.string().min(1, 'Material is required'),
    style: z.string().min(1, 'Style is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product extends ProductFormData {
    product_id?: number;
}

interface ProductMetadata {
    meta_id: number;
    product_id: number;
    meta_key: string;
    meta_value: string;
}

export default function Page() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [metadata, setMetadata] = useState<ProductMetadata[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            dimensions: {
                width: 0,
                height: 0,
                length: 0
            }
        }
    });
    const metadataForm = useForm<ProductMetadata>();
    const router = useRouter();

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            toast.error('Failed to fetch products');
        }
    };

    const fetchMetadata = async (productId: number) => {
        try {
            const response = await api.get(`/product_metadata?product_id=eq.${productId}`);
            setMetadata(response.data);
        } catch (error) {
            toast.error('Failed to fetch metadata');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onProductSubmit = async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            if (editingProduct) {
                await api.patch(`/products?product_id=eq.${editingProduct.product_id}`, data);
                toast.success('Product updated successfully', {
                    description: `${data.name} has been updated.`
                });
            } else {
                await api.post('/products', data);
                toast.success('Product created successfully', {
                    description: `${data.name} has been added to the catalog.`
                });
            }
            fetchProducts();
            reset();
            setEditingProduct(null);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
            toast.error('Failed to save product', {
                description: errorMessage
            });
            
            // Handle specific API errors
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach((err: any) => {
                    setError(err.field, {
                        type: 'manual',
                        message: err.message
                    });
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onMetadataSubmit = async (data: ProductMetadata) => {
        try {
            if (selectedProduct) {
                data.product_id = selectedProduct.product_id!;
                await api.post('/product_metadata', data);
                toast.success('Metadata added successfully');
                fetchMetadata(selectedProduct.product_id!);
                metadataForm.reset();
            }
        } catch (error) {
            toast.error('Failed to save metadata');
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        try {
            await api.delete(`/products?product_id=eq.${productId}`);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleDeleteMetadata = async (metaId: number) => {
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-4">
                        <div>
                            <Input 
                                {...register('sku')} 
                                placeholder="SKU" 
                                className={errors.sku ? 'border-danger' : ''}
                            />
                            {errors.sku && (
                                <p className="text-sm text-danger mt-1">{errors.sku.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('name')} 
                                placeholder="Name" 
                                className={errors.name ? 'border-danger' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-danger mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <Textarea 
                                {...register('description')} 
                                placeholder="Description" 
                                className={errors.description ? 'border-danger' : ''}
                            />
                            {errors.description && (
                                <p className="text-sm text-danger mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('category')} 
                                placeholder="Category" 
                                className={errors.category ? 'border-danger' : ''}
                            />
                            {errors.category && (
                                <p className="text-sm text-danger mt-1">{errors.category.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('unit_weight', { valueAsNumber: true })} 
                                type="number" 
                                step="0.01" 
                                placeholder="Unit Weight" 
                                className={errors.unit_weight ? 'border-danger' : ''}
                            />
                            {errors.unit_weight && (
                                <p className="text-sm text-danger mt-1">{errors.unit_weight.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Input 
                                    {...register('dimensions.width', { valueAsNumber: true })} 
                                    type="number" 
                                    placeholder="Width" 
                                    className={errors.dimensions?.width ? 'border-danger' : ''}
                                />
                                {errors.dimensions?.width && (
                                    <p className="text-sm text-danger mt-1">{errors.dimensions.width.message}</p>
                                )}
                            </div>
                            <div>
                                <Input 
                                    {...register('dimensions.height', { valueAsNumber: true })} 
                                    type="number" 
                                    placeholder="Height" 
                                    className={errors.dimensions?.height ? 'border-danger' : ''}
                                />
                                {errors.dimensions?.height && (
                                    <p className="text-sm text-danger mt-1">{errors.dimensions.height.message}</p>
                                )}
                            </div>
                            <div>
                                <Input 
                                    {...register('dimensions.length', { valueAsNumber: true })} 
                                    type="number" 
                                    placeholder="Length" 
                                    className={errors.dimensions?.length ? 'border-danger' : ''}
                                />
                                {errors.dimensions?.length && (
                                    <p className="text-sm text-danger mt-1">{errors.dimensions.length.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Input 
                                {...register('season')} 
                                placeholder="Season" 
                                className={errors.season ? 'border-danger' : ''}
                            />
                            {errors.season && (
                                <p className="text-sm text-danger mt-1">{errors.season.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('gender')} 
                                placeholder="Gender" 
                                className={errors.gender ? 'border-danger' : ''}
                            />
                            {errors.gender && (
                                <p className="text-sm text-danger mt-1">{errors.gender.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('collection')} 
                                placeholder="Collection" 
                                className={errors.collection ? 'border-danger' : ''}
                            />
                            {errors.collection && (
                                <p className="text-sm text-danger mt-1">{errors.collection.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('material')} 
                                placeholder="Material" 
                                className={errors.material ? 'border-danger' : ''}
                            />
                            {errors.material && (
                                <p className="text-sm text-danger mt-1">{errors.material.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('style')} 
                                placeholder="Style" 
                                className={errors.style ? 'border-danger' : ''}
                            />
                            {errors.style && (
                                <p className="text-sm text-danger mt-1">{errors.style.message}</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                        </Button>
                    </form>
                </div>

                {/* Product List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6">Products</h2>
                    <div className="space-y-4">
                        {products.map((product) => (
                            <div key={product.product_id} className="flex justify-between items-center border p-4 rounded">
                                <div>
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        setEditingProduct(product);
                                        reset(product);
                                    }}>
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(product.product_id!)}>
                                        Delete
                                    </Button>
                                    <Button size="sm" variant="default" onClick={() => {
                                        setSelectedProduct(product);
                                        fetchMetadata(product.product_id!);
                                    }}>
                                        Metadata
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => router.push(`/product/${product.product_id}/images`)}
                                    >
                                        Manage Images
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metadata Section */}
                {selectedProduct && (
                    <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-6">
                            Metadata for {selectedProduct.name}
                        </h2>
                        <form onSubmit={metadataForm.handleSubmit(onMetadataSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Input {...metadataForm.register('meta_key')} placeholder="Meta Key" />
                            <Input {...metadataForm.register('meta_value')} placeholder="Meta Value" />
                            <Button type="submit" className="md:col-span-2">Add Metadata</Button>
                        </form>

                        <div className="space-y-4">
                            {metadata.map((meta) => (
                                <div 
                                    key={`metadata-${meta.meta_id}`} 
                                    className="flex justify-between items-center border p-4 rounded"
                                >
                                    <div>
                                        <p className="font-semibold">{meta.meta_key}</p>
                                        <p className="text-sm text-gray-600">{meta.meta_value}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="danger" 
                                        onClick={() => handleDeleteMetadata(meta.meta_id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


