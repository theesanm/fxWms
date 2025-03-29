
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/postgrest';
import Image from 'next/image';
import { Textarea } from "@/components/ui/textarea";

// UI Components
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipTrigger,
    TooltipProvider,
    TooltipContent
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types and Services
interface Product {
    product_id?: number;
    sku: string;
    name: string;
    description: string;
    category: string;
    unit_weight: number;
    dimensions?: {
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
    meta_id?: number;
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

const ProductService = {
    create: async (productData: any): Promise<Product> => {
        const response = await api.post('/products', productData);
        return response.data;
    },
    search: async (term: string): Promise<Product[]> => {
        const response = await api.get(`/products?name=ilike.*${term}*`);
        return response.data;
    },
    delete: async (productId: number): Promise<void> => {
        await api.delete(`/products?product_id=eq.${productId}`);
    }
};

const productSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    unit_weight: z.coerce
        .number()
        .min(0.01, 'Weight must be greater than 0')
        .nonnegative('Weight cannot be negative'),
    dimensions: z.object({
        width: z.coerce
            .number()
            .min(0, 'Width cannot be negative')
            .nonnegative('Width cannot be negative'),
        height: z.coerce
            .number()
            .min(0, 'Height cannot be negative')
            .nonnegative('Height cannot be negative'),
        length: z.coerce
            .number()
            .min(0, 'Length cannot be negative')
            .nonnegative('Length cannot be negative'),
    }),
    season: z.string().min(1, 'Season is required'),
    gender: z.string().min(1, 'Gender is required'),
    collection: z.string().min(1, 'Collection is required'),
    material: z.string().min(1, 'Material is required'),
    style: z.string().min(1, 'Style is required'),
    meta_key: z.string().optional(),
    meta_value: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type TabId = 'basic' | 'details' | 'dimensions' | 'metadata' | 'images';

interface Tab {
    id: TabId;
    label: string;
}

export default function ProductPage() {
    const [activeTab, setActiveTab] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [metadata, setMetadata] = useState<ProductMetadata[]>([]);
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editingMetadata, setEditingMetadata] = useState<ProductMetadata | null>(null);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
        setValue,
        watch,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            dimensions: {
                width: 0,
                height: 0,
                length: 0
            },
            unit_weight: 0,
            meta_key: '',
            meta_value: ''
        },
        mode: 'onChange'
    });

    // Separate form control for metadata
    const metadataForm = useForm({
        defaultValues: {
            meta_key: '',
            meta_value: ''
        }
    });

    const getTabsWithErrors = (): Record<TabId, { hasError: boolean; messages: (string | undefined)[] }> => {
        const formErrors = errors;
        return {
            basic: {
                hasError: Boolean(formErrors.sku || formErrors.name || formErrors.description),
                messages: [
                    formErrors.sku?.message,
                    formErrors.name?.message,
                    formErrors.description?.message
                ].filter(Boolean)
            },
            details: {
                hasError: Boolean(formErrors.category || formErrors.season || formErrors.gender || 
                                formErrors.collection || formErrors.material || formErrors.style),
                messages: [
                    formErrors.category?.message,
                    formErrors.season?.message,
                    formErrors.gender?.message,
                    formErrors.collection?.message,
                    formErrors.material?.message,
                    formErrors.style?.message
                ].filter(Boolean)
            },
            dimensions: {
                hasError: Boolean(formErrors.dimensions?.width || formErrors.dimensions?.height || 
                                formErrors.dimensions?.length || formErrors.unit_weight),
                messages: [
                    formErrors.dimensions?.width?.message,
                    formErrors.dimensions?.height?.message,
                    formErrors.dimensions?.length?.message,
                    formErrors.unit_weight?.message
                ].filter(Boolean)
            },
            metadata: {
                hasError: false,
                messages: []
            },
            images: {
                hasError: false,
                messages: []
            }
        };
    };

    const handleSelectChange = (value: string, field: keyof ProductFormData) => {
        setValue(field, value);
    };

    // Search products
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setIsSearching(true);
        try {
            const results = await ProductService.search(searchTerm);
            setSearchResults(results);
            if (results.length === 0) {
                toast.info('No products found');
            }
        } catch (error) {
            toast.error('Failed to search products');
        } finally {
            setIsSearching(false);
        }
    };

    // Select product for editing
    const handleSelectProduct = async (product: Product) => {
        if (!product) return;

        // Ensure dimensions object exists with default values
        const dimensions = {
            width: product.dimensions?.width || 0,
            height: product.dimensions?.height || 0,
            length: product.dimensions?.length || 0
        };

        // Create a normalized product object
        const normalizedProduct = {
            ...product,
            dimensions
        };

        setSelectedProduct(normalizedProduct);
        
        // Reset form with all product data
        reset({
            sku: normalizedProduct.sku,
            name: normalizedProduct.name,
            description: normalizedProduct.description,
            category: normalizedProduct.category,
            unit_weight: normalizedProduct.unit_weight,
            dimensions: normalizedProduct.dimensions,
            season: normalizedProduct.season,
            gender: normalizedProduct.gender,
            collection: normalizedProduct.collection,
            material: normalizedProduct.material,
            style: normalizedProduct.style
        });

        // Only fetch metadata and images if we have a product ID
        if (normalizedProduct.product_id) {
            try {
                const metadataResponse = await api.get('/product_metadata', {
                    params: {
                        product_id: `eq.${normalizedProduct.product_id}`
                    }
                });
                setMetadata(metadataResponse.data || []);
            } catch (error) {
                toast.error('Failed to fetch product metadata');
            }

            try {
                const imagesResponse = await api.get('/product_images', {
                    params: {
                        product_id: `eq.${normalizedProduct.product_id}`
                    }
                });
                setProductImages(imagesResponse.data || []);
            } catch (error) {
                toast.error('Failed to fetch product images');
            }
        }

        setActiveTab('metadata');
    };

    // Clear form and selected product
    const handleAddNew = () => {
        setSelectedProduct(null);
        reset();
        setActiveTab('basic');
    };

    // Delete product
    const handleDelete = async (productId: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await ProductService.delete(productId);
            toast.success('Product deleted successfully');
            setSearchResults(prev => prev.filter(p => p.product_id !== productId));
            if (selectedProduct?.product_id === productId) {
                handleAddNew();
            }
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const tabsForNewProduct = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'details', label: 'Details' },
        { id: 'dimensions', label: 'Dimensions' }
    ];

    const tabsForExistingProduct: Tab[] = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'details', label: 'Details' },
        { id: 'dimensions', label: 'Dimensions' },
        { id: 'metadata', label: 'Metadata' },
        { id: 'images', label: 'Images' }
    ];

    // Add this useEffect to monitor selectedProduct changes
    useEffect(() => {
        if (selectedProduct?.product_id) {
            // Ensure metadata and images are fetched when product is selected
            const fetchData = async () => {
                try {
                    const metadataResponse = await api.get('/product_metadata', {
                        params: {
                            product_id: `eq.${selectedProduct.product_id}`
                        }
                    });
                    setMetadata(metadataResponse.data || []);
                } catch (error) {
                    console.error('Failed to fetch metadata:', error);
                }
            };
            fetchData();
        }
    }, [selectedProduct?.product_id]);

    // Form submission (Create/Update)
    const onSubmit = async (data: ProductFormData) => {
        if (activeTab === 'metadata' || activeTab === 'images') {
            return;
        }

        setIsSubmitting(true);
        try {
            if (!selectedProduct) {
                const { meta_key, meta_value, ...productData } = data;
                const normalizedProductData = {
                    ...productData,
                    dimensions: {
                        width: Number(productData.dimensions?.width || 0),
                        height: Number(productData.dimensions?.height || 0),
                        length: Number(productData.dimensions?.length || 0)
                    }
                };

                console.log('Submitting product data:', normalizedProductData);

                try {
                    const response = await ProductService.create(normalizedProductData);
                    const createdProduct = Array.isArray(response) ? response[0] : response;

                    if (!createdProduct || typeof createdProduct.product_id !== 'number') {
                        console.error('Invalid product response:', response);
                        throw new Error('Invalid product response structure');
                    }

                    // Set the selected product
                    setSelectedProduct(createdProduct);
                    
                    if (searchResults.length > 0) {
                        setSearchResults(prev => [...prev, createdProduct]);
                    }
                    
                    toast.success('Product created successfully');
                    setActiveTab('metadata'); // Automatically move to metadata tab

                    // Fetch metadata and images
                    if (createdProduct.product_id) {
                        try {
                            const [metadataResponse, imagesResponse] = await Promise.all([
                                api.get('/product_metadata', {
                                    params: {
                                        product_id: `eq.${createdProduct.product_id}`
                                    }
                                }),
                                api.get('/product_images', {
                                    params: {
                                        product_id: `eq.${createdProduct.product_id}`
                                    }
                                })
                            ]);

                            setMetadata(metadataResponse.data || []);
                            setProductImages(imagesResponse.data || []);
                        } catch (fetchError) {
                            console.error('Failed to fetch product metadata/images:', fetchError);
                        }
                    }
                } catch (error: any) {
                    if (error.status === 409 || error.message?.includes('duplicate')) {
                        toast.error('A product with this SKU already exists', {
                            description: 'Please use a different SKU'
                        });
                        setError('sku', {
                            type: 'manual',
                            message: 'This SKU is already in use'
                        });
                    } else {
                        throw error;
                    }
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.detail || 
                               error.message || 
                               'Failed to save product';
            toast.error('Error saving product', {
                description: errorMessage
            });
            console.error('Product save error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this to control when the form can be submitted
    const handleFormSubmit = (e: React.FormEvent) => {
        if (activeTab === 'metadata' || activeTab === 'images') {
            e.preventDefault();
            return;
        }
        handleSubmit(onSubmit)(e);
    };

    const handleAddMetadata = async () => {
        const meta_key = metadataForm.watch('meta_key');
        const meta_value = metadataForm.watch('meta_value');
        
        if (!meta_key || !meta_value) {
            toast.error('Both key and value are required');
            return;
        }

        // Verify product state
        if (!selectedProduct?.product_id) {
            // Try to fetch the product again if state is inconsistent
            try {
                const productResponse = await api.get('/products', {
                    params: {
                        product_id: `eq.${selectedProduct?.product_id}`
                    }
                });
                
                if (productResponse.data?.[0]) {
                    setSelectedProduct(productResponse.data[0]);
                } else {
                    toast.error('Product not found. Please refresh the page.');
                    return;
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                toast.error('Failed to verify product state');
                return;
            }
        }

        try {
            if (!selectedProduct?.product_id) {
                toast.error('Product ID is required');
                return;
            }
            const productId = selectedProduct.product_id;
            
            // Add new metadata
            const newMetadata = {
                product_id: productId,
                meta_key,
                meta_value
            };

            const response = await api.post('/product_metadata', newMetadata, {
                headers: {
                    'Prefer': 'return=representation'
                }
            });

            const addedMetadata = Array.isArray(response.data) ? response.data[0] : response.data;
            
            // Update local state
            setMetadata(prev => [...prev, addedMetadata]);
            metadataForm.reset();
            
            toast.success('Metadata added successfully');
        } catch (error: any) {
            console.error('Error adding metadata:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.detail || 
                               error.message || 
                               'Failed to add metadata';
            toast.error(`Error: ${errorMessage}`);
        }
    };

    const handleDeleteMetadata = async (metaId: number) => {
        if (!metaId) {
            toast.error('Invalid metadata ID');
            return;
        }

        try {
            // Delete the metadata
            await api.delete('/product_metadata', {
                headers: {
                    'Prefer': 'return=minimal'
                },
                params: {
                    meta_id: `eq.${metaId}`
                }
            });

            // Update local state
            setMetadata(prevMetadata => prevMetadata.filter(item => item.meta_id !== metaId));
            
            // Reset metadata form
            metadataForm.reset();

            toast.success('Metadata deleted successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.detail || 
                               'Failed to delete metadata';
            toast.error(errorMessage);
            console.error('Delete metadata error:', error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedProduct?.product_id) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Failed to upload file');

            const { filePath } = await uploadResponse.json();

            await api.post('/product_images', {
                product_id: selectedProduct.product_id,
                image_url: filePath,
                is_primary: productImages.length === 0
            });

            const newImage = {
                product_id: selectedProduct.product_id,
                image_url: filePath,
                is_primary: productImages.length === 0,
                created_at: new Date().toISOString()
            };

            setProductImages([...productImages, newImage]);
            setSelectedFile(null);
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPrimary = async (imageUrl: string) => {
        try {
            await api.patch(`/product_images?product_id=eq.${selectedProduct?.product_id}`, {
                is_primary: false
            });

            await api.patch(`/product_images?image_url=eq.${imageUrl}`, {
                is_primary: true
            });

            const updatedImages = productImages.map(img => ({
                ...img,
                is_primary: img.image_url === imageUrl
            }));

            setProductImages(updatedImages);
            toast.success('Primary image updated');
        } catch (error) {
            toast.error('Failed to update primary image');
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        try {
            await api.delete(`/product_images?image_url=eq.${imageUrl}`);
            setProductImages(productImages.filter(img => img.image_url !== imageUrl));
            toast.success('Image deleted successfully');
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    const handleEditMetadata = async () => {
        if (!editingMetadata) return;
        
        const meta_key = metadataForm.watch('meta_key');
        const meta_value = metadataForm.watch('meta_value');
        
        if (!meta_key || !meta_value) {
            toast.error('Both key and value are required');
            return;
        }

        try {
            // Update the metadata
            await api.patch('/product_metadata', {
                meta_key,
                meta_value
            }, {
                headers: {
                    'Prefer': 'return=minimal'
                },
                params: {
                    meta_id: `eq.${editingMetadata.meta_id}`
                }
            });

            // Update local state
            setMetadata(prevMetadata => 
                prevMetadata.map(item => 
                    item.meta_id === editingMetadata.meta_id 
                        ? { ...item, meta_key, meta_value }
                        : item
                )
            );
            
            // Reset form and editing state
            metadataForm.reset();
            setEditingMetadata(null);
            
            toast.success('Metadata updated successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.detail || 
                               'Failed to update metadata';
            toast.error(errorMessage);
            console.error('Update metadata error:', error);
        }
    };

    const startEditingMetadata = (metadata: ProductMetadata) => {
        setEditingMetadata(metadata);
        metadataForm.setValue('meta_key', metadata.meta_key);
        metadataForm.setValue('meta_value', metadata.meta_value);
    };

    // Add a debug effect to monitor selectedProduct changes
    useEffect(() => {
        if (selectedProduct) {
            console.log('Selected product updated:', {
                product_id: selectedProduct.product_id,
                name: selectedProduct.name,
                // other relevant fields
            });
        }
    }, [selectedProduct]);

    // Add debugging useEffect
    useEffect(() => {
        console.log('Selected product state changed:', selectedProduct);
    }, [selectedProduct]);

    // Add effect to monitor product creation
    useEffect(() => {
        if (selectedProduct?.product_id && isCreatingProduct) {
            console.log('Product created and selected:', selectedProduct);
            setIsCreatingProduct(false);
        }
    }, [selectedProduct, isCreatingProduct]);

    // Add this effect to monitor selectedProduct changes
    useEffect(() => {
        console.log('Selected product updated:', selectedProduct);
    }, [selectedProduct]);

    // Modify the tab change handler to verify product state
    const handleTabChange = (newTab: string) => {
        if ((newTab === 'metadata' || newTab === 'images') && !selectedProduct?.product_id) {
            toast.error('Please create or select a product first');
            return;
        }
        setActiveTab(newTab);
    };

    // Add this effect to ensure metadata tab is properly handled
    useEffect(() => {
        if (selectedProduct?.product_id && activeTab === 'metadata') {
            const fetchMetadata = async () => {
                try {
                    const metadataResponse = await api.get('/product_metadata', {
                        params: {
                            product_id: `eq.${selectedProduct.product_id}`
                        }
                    });
                    setMetadata(metadataResponse.data || []);
                } catch (error) {
                    console.error('Failed to fetch metadata:', error);
                    toast.error('Failed to fetch metadata');
                }
            };
            fetchMetadata();
        }
    }, [selectedProduct?.product_id, activeTab]);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Section */}
            <div className="mb-8">
                <div className="flex gap-4 mb-4">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="max-w-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                    />
                    <Button 
                        onClick={handleSearch}
                        disabled={isSearching}
                    >
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        <span className="ml-2">Search</span>
                    </Button>
                    <Button
                        onClick={handleAddNew}
                        variant="outline"
                        className="dark:border-gray-600 dark:text-gray-200"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="ml-2">New Product</span>
                    </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-2">
                        {searchResults.map((product) => (
                            <div 
                                key={product.product_id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div>
                                    <h3 className="font-medium">{product.name}</h3>
                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSelectProduct(product)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDelete(product.product_id!)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">
                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                
                <form onSubmit={handleFormSubmit}>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full" 
                                 style={{ gridTemplateColumns: `repeat(${selectedProduct ? 5 : 3}, 1fr)` }}>
                            <TooltipProvider>
                                {(selectedProduct ? tabsForExistingProduct : tabsForNewProduct).map((tab) => (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <TabsTrigger 
                                                value={tab.id}
                                                className={cn(
                                                    getTabsWithErrors()[tab.id as TabId]?.hasError && "border-red-500"
                                                )}
                                            >
                                                {tab.label}
                                                {getTabsWithErrors()[tab.id as TabId]?.hasError && 
                                                    <span className="ml-2 text-red-500">*</span>
                                                }
                                            </TabsTrigger>
                                        </TooltipTrigger>
                                        {getTabsWithErrors()[tab.id as TabId]?.hasError && (
                                            <TooltipContent className="bg-red-50 border-red-200 text-red-800 p-2">
                                                <p className="font-semibold">Missing Information:</p>
                                                <ul className="list-disc list-inside">
                                                    {getTabsWithErrors()[tab.id as TabId]?.messages.map((msg, idx) => (
                                                        <li key={idx}>{msg}</li>
                                                    ))}
                                                </ul>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </TabsList>

                        <TabsContent value="basic">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                        SKU *
                                    </label>
                                    <Input
                                        {...register('sku')}
                                        placeholder="Enter SKU"
                                        className={cn(
                                            "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                            errors.sku && "border-red-500"
                                        )}
                                    />
                                    {errors.sku && (
                                        <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                        Product Name *
                                    </label>
                                    <Input
                                        {...register('name')}
                                        placeholder="Enter product name"
                                        className={cn(
                                            "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                            errors.name && "border-red-500"
                                        )}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                        Description *
                                    </label>
                                    <Textarea
                                        {...register('description')}
                                        placeholder="Enter product description"
                                        className={cn(
                                            "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                            errors.description && "border-red-500"
                                        )}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="details">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Category *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'category')}
                                            value={watch('category')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.category && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="shirts">Shirts</SelectItem>
                                                <SelectItem value="pants">Pants</SelectItem>
                                                <SelectItem value="accessories">Accessories</SelectItem>
                                                {/* Add more categories as needed */}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && (
                                            <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Season *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'season')}
                                            value={watch('season')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.season && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select season" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="spring">Spring</SelectItem>
                                                <SelectItem value="summer">Summer</SelectItem>
                                                <SelectItem value="fall">Fall</SelectItem>
                                                <SelectItem value="winter">Winter</SelectItem>
                                                <SelectItem value="all">All Seasons</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.season && (
                                            <p className="text-sm text-red-500 mt-1">{errors.season.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Gender *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'gender')}
                                            value={watch('gender')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.gender && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="men">Men</SelectItem>
                                                <SelectItem value="women">Women</SelectItem>
                                                <SelectItem value="unisex">Unisex</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && (
                                            <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Collection *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'collection')}
                                            value={watch('collection')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.collection && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select collection" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="casual">Casual</SelectItem>
                                                <SelectItem value="formal">Formal</SelectItem>
                                                <SelectItem value="sport">Sport</SelectItem>
                                                {/* Add more collections as needed */}
                                            </SelectContent>
                                        </Select>
                                        {errors.collection && (
                                            <p className="text-sm text-red-500 mt-1">{errors.collection.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Material *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'material')}
                                            value={watch('material')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.material && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cotton">Cotton</SelectItem>
                                                <SelectItem value="polyester">Polyester</SelectItem>
                                                <SelectItem value="wool">Wool</SelectItem>
                                                <SelectItem value="leather">Leather</SelectItem>
                                                {/* Add more materials as needed */}
                                            </SelectContent>
                                        </Select>
                                        {errors.material && (
                                            <p className="text-sm text-red-500 mt-1">{errors.material.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Style *
                                        </label>
                                        <Select 
                                            onValueChange={(value) => handleSelectChange(value, 'style')}
                                            value={watch('style')}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                                                    errors.style && "border-red-500"
                                                )}
                                            >
                                                <SelectValue placeholder="Select style" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="classic">Classic</SelectItem>
                                                <SelectItem value="modern">Modern</SelectItem>
                                                <SelectItem value="vintage">Vintage</SelectItem>
                                                {/* Add more styles as needed */}
                                            </SelectContent>
                                        </Select>
                                        {errors.style && (
                                            <p className="text-sm text-red-500 mt-1">{errors.style.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Unit Weight (kg) *
                                        </label>
                                        <Input
                                            {...register('unit_weight')}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Enter weight in kg"
                                            className={cn(
                                                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                                errors.unit_weight && "border-red-500"
                                            )}
                                        />
                                        {errors.unit_weight && (
                                            <p className="text-sm text-red-500 mt-1">{errors.unit_weight.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="dimensions">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Width (cm)
                                        </label>
                                        <Input
                                            {...register('dimensions.width')}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="Width"
                                            className={cn(
                                                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                                errors.dimensions?.width && "border-red-500"
                                            )}
                                        />
                                        {errors.dimensions?.width && (
                                            <p className="text-sm text-red-500 mt-1">{errors.dimensions.width.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Height (cm)
                                        </label>
                                        <Input
                                            {...register('dimensions.height')}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="Height"
                                            className={cn(
                                                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                                errors.dimensions?.height && "border-red-500"
                                            )}
                                        />
                                        {errors.dimensions?.height && (
                                            <p className="text-sm text-red-500 mt-1">{errors.dimensions.height.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                            Length (cm)
                                        </label>
                                        <Input
                                            {...register('dimensions.length')}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="Length"
                                            className={cn(
                                                "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                                                errors.dimensions?.length && "border-red-500"
                                            )}
                                        />
                                        {errors.dimensions?.length && (
                                            <p className="text-sm text-red-500 mt-1">{errors.dimensions.length.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Only show Metadata and Images tabs when editing an existing product */}
                        {selectedProduct && (
                            <>
                                <TabsContent value="metadata">
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                                    Meta Key
                                                </label>
                                                <Input
                                                    {...metadataForm.register('meta_key')}
                                                    placeholder="Enter meta key"
                                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                                                    Meta Value
                                                </label>
                                                <Input
                                                    {...metadataForm.register('meta_value')}
                                                    placeholder="Enter meta value"
                                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button 
                                                    type="button"
                                                    onClick={editingMetadata ? handleEditMetadata : handleAddMetadata}
                                                    className="mb-1"
                                                >
                                                    {editingMetadata ? 'Update' : 'Add'} Metadata
                                                </Button>
                                                {editingMetadata && (
                                                    <Button 
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingMetadata(null);
                                                            metadataForm.reset();
                                                        }}
                                                        className="ml-2 mb-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Metadata List */}
                                        <div className="mt-4">
                                            {metadata.map((item) => (
                                                <div key={item.meta_id} className="flex justify-between items-center p-2 border dark:border-gray-600 rounded mb-2">
                                                    <div>
                                                        <span className="font-medium dark:text-gray-200">{item.meta_key}: </span>
                                                        <span className="dark:text-gray-300">{item.meta_value}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => startEditingMetadata(item)}
                                                            className="dark:border-gray-600"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => item.meta_id && handleDeleteMetadata(item.meta_id)}
                                                            className="dark:bg-red-900 dark:hover:bg-red-800"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="images">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                            />
                                            <Button 
                                                onClick={handleUpload}
                                                disabled={!selectedFile || isUploading}
                                                className="dark:bg-gray-700"
                                            >
                                                {isUploading ? 'Uploading...' : 'Upload'}
                                            </Button>
                                        </div>

                                        {/* Images Grid */}
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            {productImages.map((image, index) => (
                                                <div key={index} className="relative border dark:border-gray-600 rounded p-2">
                                                    <Image
                                                        src={image.image_url}
                                                        alt="Product image"
                                                        width={200}
                                                        height={200}
                                                        className="object-cover rounded"
                                                    />
                                                    <div className="flex justify-between mt-2">
                                                        <Button
                                                            size="sm"
                                                            variant={image.is_primary ? "default" : "outline"}
                                                            onClick={() => handleSetPrimary(image.image_url)}
                                                            disabled={image.is_primary}
                                                            className="dark:bg-gray-700"
                                                        >
                                                            {image.is_primary ? 'Primary' : 'Set Primary'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => handleDeleteImage(image.image_url)}
                                                            className="dark:bg-red-900 dark:hover:bg-red-800"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </>
                        )}

                        {/* Show form buttons only for product-related tabs */}
                        {activeTab !== 'metadata' && activeTab !== 'images' && (
                            <div className="flex justify-between items-center pt-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    * Required fields must be completed before saving
                                </div>
                                <div className="flex space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => reset()}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            selectedProduct ? 'Update Product' : 'Create Product'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Tabs>
                </form>
            </div>
        </div>
    );
}




































































