'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';

interface ProductImage {
    product_id: number;
    image_url: string;
    is_primary: boolean;
    created_at: string;
}

export default function ProductImagesPage() {
    const params = useParams();
    const router = useRouter();
    const [images, setImages] = useState<ProductImage[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [productName, setProductName] = useState('');

    useEffect(() => {
        fetchProductDetails();
        fetchProductImages();
    }, []);

    const fetchProductDetails = async () => {
        try {
            const response = await api.get(`/products?product_id=eq.${params.id}`);
            if (response.data?.[0]) {
                setProductName(response.data[0].name);
            }
        } catch (error) {
            toast.error('Failed to fetch product details');
        }
    };

    const fetchProductImages = async () => {
        try {
            const response = await api.get(`/product_images?product_id=eq.${params.id}`);
            setImages(response.data || []);
        } catch (error) {
            toast.error('Failed to fetch product images');
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

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

            // Check if this is the first image
            const shouldBePrimary = images.length === 0;

            if (shouldBePrimary) {
                // If this is the first image, set it as primary
                await api.post('/product_images', {
                    product_id: Number(params.id),
                    image_url: filePath,
                    is_primary: true,
                });
            } else {
                // If not the first image, set it as non-primary
                await api.post('/product_images', {
                    product_id: Number(params.id),
                    image_url: filePath,
                    is_primary: false,
                });
            }

            toast.success('Image uploaded successfully');
            fetchProductImages();
            setSelectedFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPrimary = async (imageUrl: string) => {
        try {
            // First, set all images for this product to non-primary
            await api.patch(`/product_images?product_id=eq.${params.id}`, {
                is_primary: false
            }, {
                headers: {
                    'Prefer': 'return=minimal'
                }
            });

            // Then set the selected image as primary
            await api.patch(`/product_images?product_id=eq.${params.id}&image_url=eq.${imageUrl}`, {
                is_primary: true
            }, {
                headers: {
                    'Prefer': 'return=minimal'
                }
            });

            toast.success('Primary image updated');
            fetchProductImages();
        } catch (error) {
            console.error('Set primary error:', error);
            toast.error('Failed to update primary image');
        }
    };

    const handleDelete = async (imageUrl: string) => {
        try {
            await api.delete(`/product_images?image_url=eq.${imageUrl}`);
            toast.success('Image deleted successfully');
            fetchProductImages();
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Images</h1>
                    <p className="text-gray-600">Managing images for {productName}</p>
                </div>
                <Button onClick={() => router.back()}>Back to Product</Button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary file:text-white
                            hover:file:bg-primary/90"
                    />
                    <Button 
                        onClick={handleUpload} 
                        disabled={!selectedFile || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.sort((a, b) => (a.is_primary ? -1 : 1)).map((image) => (
                    <div key={image.image_url} className="bg-white rounded-lg shadow p-4">
                        <div className="relative aspect-square mb-4">
                            <Image
                                src={image.image_url}
                                alt={`Product image${image.is_primary ? ' (Primary)' : ''}`}
                                fill
                                className="object-cover rounded-md"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            {image.is_primary && (
                                <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-sm">
                                    Primary
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <Button
                                variant={image.is_primary ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSetPrimary(image.image_url)}
                                disabled={image.is_primary}
                            >
                                {image.is_primary ? 'Primary Image' : 'Set as Primary'}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(image.image_url)}
                                disabled={image.is_primary}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


