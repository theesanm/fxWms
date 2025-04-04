'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { InventoryTransactionService } from '@/lib/services/inventory-transaction.service';
import { InventoryTransaction, InventoryTransactionFormData } from '@/types/inventory-transaction';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryService } from '@/lib/services/inventory.service';
import { TransactionTypeService } from '@/lib/services/transaction-type.service';
import { Inventory } from '@/types/inventory';
import { TransactionType } from '@/types/transaction-type';

const schema = z.object({
    inventory_id: z.string().min(1, 'Inventory ID is required'),
    transaction_type: z.string().min(1, 'Transaction type is required'),
    quantity_change: z.string()
        .min(1, 'Quantity change is required')
        .refine((val) => !isNaN(parseInt(val)), {
            message: 'Quantity must be a number'
        }),
    reference_id: z.string().min(1, 'Reference ID is required'),
    notes: z.string().optional(),
});

export default function InventoryTransactionManager() {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [editing, setEditing] = useState<InventoryTransaction | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
    const [openInventory, setOpenInventory] = useState(false);
    const [openTransactionType, setOpenTransactionType] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<InventoryTransactionFormData>({
        resolver: zodResolver(schema)
    });

    const selectedInventoryId = watch('inventory_id');
    const selectedTransactionType = watch('transaction_type');

    useEffect(() => {
        loadTransactions();
        loadInventories();
        loadTransactionTypes();
    }, []);

    const loadInventories = async () => {
        try {
            const data = await InventoryService.getInventory();
            setInventories(data);
        } catch (error) {
            toast.error('Failed to load inventories');
        }
    };

    const loadTransactionTypes = async () => {
        try {
            const data = await TransactionTypeService.getTransactionTypes();
            setTransactionTypes(data);
        } catch (error) {
            toast.error('Failed to load transaction types');
        }
    };

    const loadTransactions = async () => {
        try {
            const data = await InventoryTransactionService.getInventoryTransactions();
            setTransactions(data);
        } catch (error) {
            toast.error('Failed to load transactions');
        }
    };

    const onSubmit = async (data: InventoryTransactionFormData) => {
        setIsSubmitting(true);
        try {
            const formattedData = {
                inventory_id: parseInt(data.inventory_id),
                transaction_type: data.transaction_type, // This will now be the transaction type name
                quantity_change: parseInt(data.quantity_change),
                reference_id: data.reference_id,
                notes: data.notes || ''
            };

            if (editing) {
                await InventoryTransactionService.updateInventoryTransaction(
                    editing.transaction_id,
                    formattedData
                );
                toast.success('Transaction updated successfully');
            } else {
                await InventoryTransactionService.createInventoryTransaction(formattedData);
                toast.success('Transaction created successfully');
            }
            loadTransactions();
            setEditing(null);
            reset();
        } catch (error) {
            toast.error(editing ? 'Failed to update transaction' : 'Failed to create transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (transaction: InventoryTransaction) => {
        setEditing(transaction);
        setValue('inventory_id', transaction.inventory_id.toString());
        setValue('transaction_type', transaction.transaction_type);
        setValue('quantity_change', transaction.quantity_change.toString());
        setValue('reference_id', transaction.reference_id);
        setValue('notes', transaction.notes || '');
    };

    const handleDelete = async (id: number) => {
        try {
            await InventoryTransactionService.deleteInventoryTransaction(id);
            toast.success('Transaction deleted successfully');
            loadTransactions();
        } catch (error) {
            toast.error('Failed to delete transaction');
        }
    };

    useEffect(() => {
        if (!editing) {
            reset({
                inventory_id: '',
                transaction_type: '',
                quantity_change: '',
                reference_id: '',
                notes: ''
            });
        }
    }, [editing, reset]);

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Inventory
                    </label>
                    <Popover open={openInventory} onOpenChange={setOpenInventory}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openInventory}
                                className="w-full justify-between"
                            >
                                {selectedInventoryId
                                    ? inventories.find((inventory) => inventory.inventory_id?.toString() === selectedInventoryId)
                                        ?.product_id || "Select inventory..."
                                    : "Select inventory..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search inventory..." />
                                <CommandEmpty>No inventory found.</CommandEmpty>
                                <CommandGroup>
                                    {inventories.map((inventory) => (
                                        <CommandItem
                                            key={inventory.inventory_id}
                                            onSelect={() => {
                                                setValue('inventory_id', inventory.inventory_id?.toString() || '');
                                                setOpenInventory(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedInventoryId === inventory.inventory_id?.toString()
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {inventory.product_id} - Qty: {inventory.quantity_on_hand}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {errors.inventory_id && (
                        <span className="text-red-500 text-sm">{errors.inventory_id.message}</span>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Transaction Type
                    </label>
                    <Popover open={openTransactionType} onOpenChange={setOpenTransactionType}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openTransactionType}
                                className="w-full justify-between"
                            >
                                {selectedTransactionType || "Select transaction type..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search transaction type..." />
                                <CommandEmpty>No transaction type found.</CommandEmpty>
                                <CommandGroup>
                                    {transactionTypes.map((type) => (
                                        <CommandItem
                                            key={type.transactiontype_id}
                                            onSelect={() => {
                                                setValue('transaction_type', type.name);
                                                setOpenTransactionType(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedTransactionType === type.name
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {type.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {errors.transaction_type && (
                        <span className="text-red-500 text-sm">{errors.transaction_type.message}</span>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Quantity Change
                    </label>
                    <Input
                        {...register('quantity_change')}
                        className="dark:bg-gray-700"
                        placeholder="Enter quantity change"
                        type="number"
                    />
                    {errors.quantity_change && (
                        <span className="text-red-500 text-sm">{errors.quantity_change.message}</span>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Reference ID
                    </label>
                    <Input
                        {...register('reference_id')}
                        className="dark:bg-gray-700"
                        placeholder="Enter reference ID"
                    />
                    {errors.reference_id && (
                        <span className="text-red-500 text-sm">{errors.reference_id.message}</span>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Notes
                    </label>
                    <Input
                        {...register('notes')}
                        className="dark:bg-gray-700"
                        placeholder="Enter notes"
                    />
                    {errors.notes && (
                        <span className="text-red-500 text-sm">{errors.notes.message}</span>
                    )}
                </div>

                <div className="flex space-x-2">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto"
                    >
                        {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                    </Button>
                    {editing && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditing(null);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse table-auto">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Inventory ID</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Quantity</th>
                            <th className="px-4 py-2 text-left">Reference</th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.transaction_id}
                                className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <td className="px-4 py-2">{transaction.transaction_id}</td>
                                <td className="px-4 py-2">{transaction.inventory_id}</td>
                                <td className="px-4 py-2">{transaction.transaction_type}</td>
                                <td className="px-4 py-2">{transaction.quantity_change}</td>
                                <td className="px-4 py-2">{transaction.reference_id}</td>
                                <td className="px-4 py-2">
                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center space-x-2">
                                        <Button
                                            onClick={() => handleEdit(transaction)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(transaction.transaction_id)}
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





