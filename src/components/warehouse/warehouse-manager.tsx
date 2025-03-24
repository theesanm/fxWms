'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface Warehouse extends WarehouseFormData {
  warehouse_id?: number;
  created_at?: string;
}

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const onSubmit = async (data: WarehouseFormData) => {
    setIsSubmitting(true);
    try {
      if (editingWarehouse) {
        await api.patch(`/warehouses?warehouse_id=eq.${editingWarehouse.warehouse_id}`, data);
        toast.success('Warehouse updated successfully');
      } else {
        await api.post('/warehouses', data);
        toast.success('Warehouse created successfully');
      }
      reset();
      setEditingWarehouse(null);
      fetchWarehouses();
    } catch (error) {
      toast.error('Failed to save warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    reset(warehouse);
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    try {
      await api.delete(`/warehouses?warehouse_id=eq.${warehouse.warehouse_id}`);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error) {
      toast.error('Failed to delete warehouse');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register('name')}
            placeholder="Warehouse Name"
            className="mb-1"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Input
            {...register('address')}
            placeholder="Address"
            className="mb-1"
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address.message}</p>
          )}
        </div>

        <div>
          <Input
            {...register('phone')}
            placeholder="Phone"
            className="mb-1"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
          </Button>
          {editingWarehouse && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingWarehouse(null);
                reset();
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Warehouses</h2>
        <div className="space-y-4">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.warehouse_id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{warehouse.name}</h3>
                  <p className="text-sm text-gray-600">{warehouse.address}</p>
                  <p className="text-sm text-gray-600">{warehouse.phone}</p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(warehouse)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(warehouse)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}