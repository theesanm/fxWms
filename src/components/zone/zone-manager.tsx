'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Warehouse {
  warehouse_id: number;
  name: string;
}

const zoneSchema = z.object({
  warehouse_id: z.number().min(1, 'Warehouse ID is required'),
  zone_name: z.string().min(1, 'Zone name is required'),
  description: z.string().min(1, 'Description is required'),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface Zone extends ZoneFormData {
  zone_id?: number;
}

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
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
  });

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('warehouses');
      setWarehouses(response.data);
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get('zones');
      setZones(response.data);
    } catch (error) {
      toast.error('Failed to fetch zones');
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchZones();
  }, []);

  const onSubmit = async (data: ZoneFormData) => {
    setIsSubmitting(true);
    try {
      if (editingZone) {
        await api.patch(`zones?zone_id=eq.${editingZone.zone_id}`, {
          ...data
        });
      } else {
        await api.post('zones', data);
      }

      toast.success(`Zone ${editingZone ? 'updated' : 'created'} successfully`);
      fetchZones();
      reset();
      setEditingZone(null);
    } catch (error) {
      toast.error('Failed to save zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setValue('warehouse_id', zone.warehouse_id);
    setValue('zone_name', zone.zone_name);
    setValue('description', zone.description);
  };

  const handleDelete = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      await api.delete(`zones?zone_id=eq.${zoneId}`);
      toast.success('Zone deleted successfully');
      fetchZones();
    } catch (error) {
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warehouse
          </label>
          <select
            {...register('warehouse_id', { 
              valueAsNumber: true,
              required: 'Please select a warehouse' 
            })}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          {errors.warehouse_id && (
            <p className="text-red-500 text-sm mt-1">{errors.warehouse_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zone Name
          </label>
          <Input
            {...register('zone_name')}
            placeholder="Enter zone name"
          />
          {errors.zone_name && (
            <p className="text-red-500 text-sm mt-1">{errors.zone_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            {...register('description')}
            placeholder="Enter zone description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
        </Button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Zones</h2>
        <div className="grid gap-4">
          {zones.map((zone) => (
            <div
              key={zone.zone_id}
              className="border p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{zone.zone_name}</h3>
                <p className="text-sm text-gray-600">Warehouse: {getWarehouseName(zone.warehouse_id)}</p>
                <p className="text-sm text-gray-600">{zone.description}</p>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => handleEdit(zone)}
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => zone.zone_id && handleDelete(zone.zone_id)}
                  variant="destructive"
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



