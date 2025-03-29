'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Warehouse } from '@/types/warehouse';

interface Zone {
  zone_id?: number;
  warehouse_id: number;
  zone_name: string;
  description: string;
}

const zoneSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  zone_name: z.string().min(1, 'Zone name is required'),
  description: z.string().min(1, 'Description is required'),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

export default function ZoneManager() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
  });

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Zone fetch error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || 'Failed to fetch zones');
      }
      
      const data = await response.json();
      setZones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch zones');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to fetch warehouses');
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchZones();
  }, []);

  const onSubmit = async (data: ZoneFormData) => {
    setIsSubmitting(true);
    try {
      const zoneData = {
        ...data,
        warehouse_id: parseInt(data.warehouse_id, 10),
      };

      const url = editingZone 
        ? `/api/zones?zone_id=${editingZone.zone_id}`
        : '/api/zones';

      const method = editingZone ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zoneData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to ${editingZone ? 'update' : 'create'} zone`);
      }

      const result = await response.json();
      toast.success(editingZone ? 'Zone updated successfully' : 'Zone created successfully');
      fetchZones();
      reset();
      setEditingZone(null);
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWarehouseChange = (value: string) => {
    const selectedWarehouse = warehouses.find(w => w.warehouse_id.toString() === value);
    console.debug('Selected warehouse:', {
      value,
      warehouseName: selectedWarehouse?.name,
      warehouse: selectedWarehouse
    });
    setValue('warehouse_id', value);
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setValue('warehouse_id', zone.warehouse_id.toString());
    setValue('zone_name', zone.zone_name);
    setValue('description', zone.description);
  };

  const handleDelete = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      const response = await fetch(`/api/zones?zone_id=${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success('Zone deleted successfully');
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete zone');
    }
  };

  // Helper function to get warehouse name by ID
  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find(w => w.warehouse_id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warehouse
          </label>
          <Select
            value={watch('warehouse_id')}
            onValueChange={handleWarehouseChange}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Select a warehouse" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {warehouses.map((warehouse) => (
                <SelectItem 
                  key={warehouse.warehouse_id} 
                  value={warehouse.warehouse_id.toString()}
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.warehouse_id && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.warehouse_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zone Name
          </label>
          <Input
            {...register('zone_name')}
            placeholder="Enter zone name"
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {errors.zone_name && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.zone_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <Textarea
            {...register('description')}
            placeholder="Enter zone description"
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {errors.description && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-dark text-white dark:bg-primary-dark dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
        </Button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Zones</h2>
        <div className="grid gap-4">
          {zones.map((zone) => (
            <div
              key={zone.zone_id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{zone.zone_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Warehouse: {getWarehouseName(zone.warehouse_id)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{zone.description}</p>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => handleEdit(zone)}
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(zone.zone_id!)}
                  variant="danger"
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
































