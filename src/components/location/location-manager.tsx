'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LocationService } from '@/lib/services/location.service';
import { ZoneService } from '@/lib/services/zone.service';

const locationSchema = z.object({
  zone_id: z.string().min(1, 'Zone is required'),
  location_code: z.string().min(1, 'Location code is required'),
  capacity: z.string().min(1, 'Capacity is required'),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface Location {
  location_id: number;
  zone_id: number;
  location_code: string;
  capacity: number;
}

interface Zone {
  zone_id: number;
  zone_name: string;
  warehouse_id: number;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  const fetchData = async () => {
    try {
      const [locationsData, zonesData] = await Promise.all([
        LocationService.getLocations(),
        ZoneService.getZones()
      ]);
      setLocations(locationsData);
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      const locationData = {
        ...data,
        zone_id: parseInt(data.zone_id),
        capacity: parseInt(data.capacity),
      };

      if (editingLocation) {
        await LocationService.updateLocation(editingLocation.location_id, locationData);
        toast.success('Location updated successfully');
      } else {
        await LocationService.createLocation(locationData);
        toast.success('Location created successfully');
      }

      fetchData();
      reset();
      setEditingLocation(null);
    } catch (error: any) {
      if (error.name === 'DuplicateError') {
        toast.error('Duplicate Location', {
          description: 'This location code is already used in the selected zone'
        });
        // Highlight both zone and location code fields
        setError('zone_id', {
          type: 'manual',
          message: 'This combination of zone and location code already exists'
        });
        setError('location_code', {
          type: 'manual',
          message: 'This combination of zone and location code already exists'
        });
      } else {
        toast.error('Failed to save location', {
          description: error.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setValue('zone_id', location.zone_id.toString());
    setValue('location_code', location.location_code);
    setValue('capacity', location.capacity.toString());
  };

  const handleDelete = async (locationId: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await LocationService.deleteLocation(locationId);
      toast.success('Location deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const getZoneName = (zoneId: number) => {
    const zone = zones.find(z => z.zone_id === zoneId);
    return zone ? zone.zone_name : 'Unknown Zone';
  };

  const filteredLocations = locations.filter(location =>
    location.location_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getZoneName(location.zone_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {editingLocation ? 'Edit Location' : 'Create New Location'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Zone
            </label>
            <Select
              onValueChange={(value) => setValue('zone_id', value)}
              value={watch('zone_id')}
            >
              <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600">
                <SelectValue 
                  placeholder="Select Zone" 
                  className="dark:text-gray-200"
                />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                {zones.map((zone) => (
                  <SelectItem 
                    key={zone.zone_id} 
                    value={zone.zone_id.toString()}
                    className="dark:text-gray-200 dark:focus:bg-gray-700"
                  >
                    {zone.zone_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zone_id && (
              <p className="text-sm text-red-500">{errors.zone_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location Code
            </label>
            <Input
              placeholder="Enter location code"
              {...register('location_code')}
              className="bg-white dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.location_code && (
              <p className="text-sm text-red-500">{errors.location_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Capacity
            </label>
            <Input
              type="number"
              placeholder="Enter capacity"
              {...register('capacity')}
              className="bg-white dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark"
          >
            {isSubmitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
          </Button>
          {editingLocation && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setEditingLocation(null);
              }}
              className="dark:border-gray-600"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Locations</h2>
          <div className="w-64">
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Location Code</th>
                <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Zone</th>
                <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Capacity</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => (
                <tr 
                  key={location.location_id}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {location.location_code}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {getZoneName(location.zone_id)}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {location.capacity}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="space-x-2">
                      <Button
                        onClick={() => handleEdit(location)}
                        variant="outline"
                        size="sm"
                        className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(location.location_id!)}
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
    </div>
  );
}









