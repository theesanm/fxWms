'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { InventoryService } from '@/lib/services/inventory.service';
import { Inventory, InventoryFormData } from '@/types/inventory';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductService } from '@/lib/services/product.service';
import { LocationService } from '@/lib/services/location.service';
import { ZoneService } from '@/lib/services/zone.service';

interface Product {
  product_id: number;
  name: string;
  sku: string;
}

interface Location {
  location_id: number;
  location_code: string;
  zone_id: number;
}

interface LocationWithZone extends Location {
  zone_name: string;
}

interface Zone {
  zone_id: number;
  zone_name: string;
}

const inventorySchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  location_id: z.string().min(1, 'Please select a storage location'),
  lot_number: z.string().min(1, 'Please enter a lot number')
    .max(50, 'Lot number cannot exceed 50 characters'),
  expiration_date: z.string()
    .min(1, 'Please select an expiration date')
    .refine((date) => new Date(date) > new Date(), {
      message: 'Expiration date must be in the future'
    }),
  quantity_on_hand: z.string()
    .min(1, 'Please enter the quantity')
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: 'Quantity must be a positive number'
    }),
});

export default function InventoryManager() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<LocationWithZone[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [openProduct, setOpenProduct] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
  });

  useEffect(() => {
    loadInventory();
    loadProducts();
    loadLocations();
    loadZones();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await InventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      toast.error('Failed to load inventory');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await ProductService.getAll();
      setProducts(data.map(product => ({
        product_id: product.product_id ?? 0, // Provide a default value if undefined
        name: product.name,
        sku: product.sku
      })));
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const loadLocations = async () => {
    try {
      const data = await LocationService.getLocations();
      const mappedLocations = data.map(location => ({
        location_id: location.location_id,
        location_code: location.location_code,
        zone_id: location.zone_id,
        zone_name: getZoneName(location.zone_id) || 'Unknown Zone'
      }));
      setLocations(mappedLocations);
    } catch (error) {
      toast.error('Failed to load locations');
    }
  };

  const loadZones = async () => {
    try {
      const data = await ZoneService.getZones();
      setZones(data);
    } catch (error) {
      toast.error('Failed to load zones');
    }
  };

  const onSubmit = async (data: InventoryFormData) => {
    setIsSubmitting(true);
    try {
      const inventoryData = {
        product_id: parseInt(data.product_id),
        location_id: parseInt(data.location_id),
        lot_number: data.lot_number,
        expiration_date: data.expiration_date,
        quantity_on_hand: parseInt(data.quantity_on_hand),
      };

      if (editingInventory) {
        await InventoryService.updateInventory(editingInventory.inventory_id!, inventoryData);
        toast.success('Inventory updated successfully');
      } else {
        await InventoryService.createInventory(inventoryData);
        toast.success('Inventory created successfully', {
          description: `Added ${products.find(p => p.product_id === inventoryData.product_id)?.name} to location ${locations.find(l => l.location_id === inventoryData.location_id)?.location_code}`
        });
      }

      reset();
      setEditingInventory(null);
      loadInventory();
    } catch (error: any) {
      if (error.status === 409 || error.message?.includes('duplicate')) {
        toast.error('Duplicate Inventory Entry', {
          description: 'This product already exists in the selected location with the same lot number'
        });
      } else {
        toast.error(
          editingInventory ? 'Failed to update inventory' : 'Failed to create inventory',
          { description: error.message || 'An unexpected error occurred' }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Inventory) => {
    setEditingInventory(item);
    setValue('product_id', item.product_id.toString());
    setValue('location_id', item.location_id.toString());
    setValue('lot_number', item.lot_number);
    setValue('expiration_date', item.expiration_date);
    setValue('quantity_on_hand', item.quantity_on_hand.toString());
  };

  const handleDelete = async (id: number) => {
    try {
      await InventoryService.deleteInventory(id);
      toast.success('Inventory deleted successfully');
      loadInventory();
    } catch (error) {
      toast.error('Failed to delete inventory');
    }
  };

  const getZoneName = (zoneId: number) => {
    // This assumes you have access to zones data
    // You might need to fetch and store zones data in a state variable
    const zone = zones.find(z => z.zone_id === zoneId);
    return zone?.zone_name;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory Management
        </h1>
        <Button
          onClick={() => {
            reset();
            setEditingInventory(null);
          }}
          variant="outline"
        >
          Clear Form
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Product *
              <span className="text-xs text-gray-500 ml-1">(Search by name or SKU)</span>
            </label>
            <Popover open={openProduct} onOpenChange={setOpenProduct}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProduct}
                  className="w-full justify-between dark:bg-gray-700"
                >
                  {watch('product_id') ? 
                    products.find((product) => product.product_id.toString() === watch('product_id'))?.name :
                    "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search products..." />
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {products.map((product) => (
                      <CommandItem
                        key={product.product_id}
                        onSelect={() => {
                          setValue('product_id', product.product_id.toString());
                          setOpenProduct(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            watch('product_id') === product.product_id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {product.name} ({product.sku})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.product_id && (
              <span className="text-red-500 text-sm">{errors.product_id.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Location *
              <span className="text-xs text-gray-500 ml-1">(Select storage location)</span>
            </label>
            <Popover open={openLocation} onOpenChange={setOpenLocation}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLocation}
                  className="w-full justify-between dark:bg-gray-700"
                >
                  {watch('location_id') ?
                    locations.find((location) => location.location_id.toString() === watch('location_id'))?.location_code :
                    "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search locations..." />
                  <CommandEmpty>No location found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {locations.map((location) => (
                      <CommandItem
                        key={location.location_id}
                        onSelect={() => {
                          setValue('location_id', location.location_id.toString());
                          setOpenLocation(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            watch('location_id') === location.location_id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {location.location_code} ({location.zone_name})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.location_id && (
              <span className="text-red-500 text-sm">{errors.location_id.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Lot Number *
              <span className="text-xs text-gray-500 ml-1">(Batch/Production lot)</span>
            </label>
            <Input
              {...register('lot_number')}
              placeholder="Enter lot number"
              className="dark:bg-gray-700"
            />
            {errors.lot_number && (
              <span className="text-red-500 text-sm">{errors.lot_number.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Expiration Date *
              <span className="text-xs text-gray-500 ml-1">(YYYY-MM-DD)</span>
            </label>
            <Input
              {...register('expiration_date')}
              type="date"
              className="dark:bg-gray-700"
            />
            {errors.expiration_date && (
              <span className="text-red-500 text-sm">{errors.expiration_date.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Quantity *
              <span className="text-xs text-gray-500 ml-1">(Available units)</span>
            </label>
            <Input
              {...register('quantity_on_hand')}
              type="number"
              min="0"
              placeholder="Enter quantity"
              className="dark:bg-gray-700"
            />
            {errors.quantity_on_hand && (
              <span className="text-red-500 text-sm">{errors.quantity_on_hand.message}</span>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-32"
          >
            {isSubmitting ? 'Saving...' : editingInventory ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Current Inventory</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Lot Number</th>
                <th className="px-4 py-2 text-left">Expiration Date</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr 
                  key={item.inventory_id} 
                  className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2">
                    {products.find(p => p.product_id === item.product_id)?.name || 'Unknown Product'}
                  </td>
                  <td className="px-4 py-2">
                    {locations.find(l => l.location_id === item.location_id)?.location_code || 'Unknown Location'}
                  </td>
                  <td className="px-4 py-2">{item.lot_number}</td>
                  <td className="px-4 py-2">{new Date(item.expiration_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">{item.quantity_on_hand}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this inventory item?')) {
                            handleDelete(item.inventory_id!);
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
    </div>
  );
}


