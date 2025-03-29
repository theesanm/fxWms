'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/postgrest';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
                // Try to check if SKU exists first
                const existingProduct = await api.get(`/products?sku=eq.${data.sku}`);
                
                if (existingProduct.data && existingProduct.data.length > 0) {
                    setError('sku', {
                        type: 'manual',
                        message: 'This SKU already exists'
                    });
                    toast.error('Duplicate SKU', {
                        description: 'A product with this SKU already exists'
                    });
                    setIsSubmitting(false);
                    return;
                }

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
            
            // Handle specific PostgREST error codes
            if (error.response?.status === 409 || 
                (error.response?.data?.code === '23505' || // PostgreSQL unique violation code
                 errorMessage.includes('unique constraint'))) {
                setError('sku', {
                    type: 'manual',
                    message: 'This SKU already exists'
                });
                toast.error('Duplicate SKU', {
                    description: 'A product with this SKU already exists'
                });
            } else {
                toast.error('Failed to save product', {
                    description: errorMessage
                });
                
                // Handle other API errors
                if (error.response?.data?.errors) {
                    error.response.data.errors.forEach((err: any) => {
                        setError(err.field, {
                            type: 'manual',
                            message: err.message
                        });
                    });
                }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-4">
                        <div>
                            <Input 
                                {...register('sku')} 
                                placeholder="SKU" 
                                className={cn(
                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                    errors.sku ? 'border-danger' : ''
                                )}
                            />
                            {errors.sku && (
                                <p className="text-sm text-danger mt-1">{errors.sku.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('name')} 
                                placeholder="Name" 
                                className={cn(
                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                    errors.name ? 'border-danger' : ''
                                )}
                            />
                            {errors.name && (
                                <p className="text-sm text-danger mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <Textarea 
                                {...register('description')} 
                                placeholder="Description"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                            {errors.description && (
                                <p className="text-sm text-danger mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('category')} 
                                placeholder="Category" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
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
                                className={cn(
                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                    errors.unit_weight ? 'border-danger' : ''
                                )}
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
                                    className={cn(
                                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                        errors.dimensions?.width ? 'border-danger' : ''
                                    )}
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
                                    className={cn(
                                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                        errors.dimensions?.height ? 'border-danger' : ''
                                    )}
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
                                    className={cn(
                                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                        errors.dimensions?.length ? 'border-danger' : ''
                                    )}
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
                                className={cn(
                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                    errors.season ? 'border-danger' : ''
                                )}
                            />
                            {errors.season && (
                                <p className="text-sm text-danger mt-1">{errors.season.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('gender')} 
                                placeholder="Gender" 
                                className={cn(
                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                    errors.gender ? 'border-danger' : ''
                                )}
                            />
                            {errors.gender && (
                                <p className="text-sm text-danger mt-1">{errors.gender.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('collection')} 
                                placeholder="Collection" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                            {errors.collection && (
                                <p className="text-sm text-danger mt-1">{errors.collection.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('material')} 
                                placeholder="Material" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                            {errors.material && (
                                <p className="text-sm text-danger mt-1">{errors.material.message}</p>
                            )}
                        </div>

                        <div>
                            <Input 
                                {...register('style')} 
                                placeholder="Style" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Products</h2>
                    <div className="space-y-4">
                        {products.map((product) => (
                            <div key={product.product_id} className="flex justify-between items-center border dark:border-gray-700 p-4 rounded">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => {
                                            setEditingProduct(product);
                                            reset(product);
                                        }}
                                        className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="danger"
                                        onClick={() => handleDeleteProduct(product.product_id!)}
                                        className="dark:bg-red-900 dark:hover:bg-red-800"
                                    >
                                        Delete
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="default" 
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            fetchMetadata(product.product_id!);
                                        }}
                                        className="dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Metadata for {selectedProduct.name}
                        </h2>
                        <form onSubmit={metadataForm.handleSubmit(onMetadataSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Input 
                                {...metadataForm.register('meta_key')} 
                                placeholder="Meta Key" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                            <Input 
                                {...metadataForm.register('meta_value')} 
                                placeholder="Meta Value" 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                            />
                            <Button type="submit" className="md:col-span-2">Add Metadata</Button>
                        </form>

                        <div className="space-y-4">
                            {metadata.map((meta) => (
                                <div 
                                    key={`metadata-${meta.meta_id}`} 
                                    className="flex justify-between items-center border dark:border-gray-700 p-4 rounded"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{meta.meta_key}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{meta.meta_value}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="danger" 
                                        onClick={() => handleDeleteMetadata(meta.meta_id)}
                                        className="dark:bg-red-900 dark:hover:bg-red-800"
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





