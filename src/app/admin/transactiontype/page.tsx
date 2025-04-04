'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { TransactionTypeService } from '@/lib/services/transaction-type.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(50, 'Name must be 50 characters or less')
});

export default function TransactionTypePage() {
    const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
    const [editing, setEditing] = useState<TransactionType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<TransactionTypeFormData>({
        resolver: zodResolver(schema)
    });

    useEffect(() => {
        loadTransactionTypes();
    }, []);

    useEffect(() => {
        if (editing) {
            reset({ name: editing.name });
        } else {
            reset({ name: '' });
        }
    }, [editing, reset]);

    async function loadTransactionTypes() {
        try {
            const data = await TransactionTypeService.getTransactionTypes();
            setTransactionTypes(data);
        } catch (error) {
            toast.error('Failed to load transaction types');
        }
    }

    const onSubmit = async (data: TransactionTypeFormData) => {
        setIsSubmitting(true);
        try {
            if (editing) {
                await TransactionTypeService.updateTransactionType(editing.transactiontype_id, data);
                toast.success('Transaction type updated successfully');
            } else {
                await TransactionTypeService.createTransactionType(data);
                toast.success('Transaction type created successfully');
            }
            loadTransactionTypes();
            setEditing(null);
            reset();
        } catch (error: any) {
            toast.error(editing ? 'Failed to update transaction type' : 'Failed to create transaction type');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await TransactionTypeService.deleteTransactionType(id);
            toast.success('Transaction type deleted successfully');
            loadTransactionTypes();
        } catch (error) {
            toast.error('Failed to delete transaction type');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Transaction Types
                </h1>
                <Button
                    onClick={() => {
                        setEditing(null);
                        reset();
                    }}
                    variant="outline"
                >
                    Clear Form
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Name
                    </label>
                    <Input
                        {...register('name')}
                        className="dark:bg-gray-700"
                        placeholder="Enter transaction type name"
                    />
                    {errors.name && (
                        <span className="text-red-500 text-sm">{errors.name.message}</span>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                >
                    {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                </Button>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse table-auto">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Created At</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactionTypes.map((type) => (
                            <tr 
                                key={type.transactiontype_id}
                                className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <td className="px-4 py-2">{type.name}</td>
                                <td className="px-4 py-2">
                                    {new Date(type.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center space-x-2">
                                        <Button
                                            onClick={() => setEditing(type)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this transaction type?')) {
                                                    handleDelete(type.transactiontype_id);
                                                }
                                            }}
                                            variant="danger"
                                            size="sm"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}