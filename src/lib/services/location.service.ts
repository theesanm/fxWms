import { Location } from '@/types/location';
import { BaseService } from './base.service';
import { AxiosError } from 'axios';

export class LocationService extends BaseService {
    private static readonly endpoint = '/locations';

    static async getLocations() {
        try {
            const response = await this.get<Location[]>(this.endpoint);
            return response.data;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw error;
        }
    }

    static async updateLocation(locationId: number, data: Partial<Location>) {
        try {
            const filter = this.buildFilter('location_id', 'eq', locationId);
            const response = await this.patch<Location>(
                `${this.endpoint}?${filter}`,
                data
            );
            return response.data;
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    }

    static async createLocation(data: Omit<Location, 'location_id'>) {
        try {
            const response = await this.post<Location>(this.endpoint, data);
            return response.data;
        } catch (error: any) {
            // Handle duplicate key violations silently as they're expected
            if (error.status === 409 || 
                error.data?.code === '23505' || 
                error.data?.message?.includes('duplicate key value')) {
                const duplicateError = new Error('A location with this code already exists in the selected zone');
                duplicateError.name = 'DuplicateError';
                // Don't log this error as it's an expected business case
                throw duplicateError;
            }

            // Only log unexpected errors
            console.error('Unexpected error creating location:', {
                message: error.message,
                status: error.status,
                data: error.data
            });
            throw new Error('Failed to create location');
        }
    }

    static async deleteLocation(locationId: number) {
        const filter = this.buildFilter('location_id', 'eq', locationId);
        return this.delete(`${this.endpoint}?${filter}`);
    }
}








