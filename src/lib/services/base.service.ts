import postgrest from '@/lib/postgrest';
import { AxiosResponse } from 'axios';

export class BaseService {
  protected static async get<T>(endpoint: string): Promise<AxiosResponse<T>> {
    return postgrest.get<T>(endpoint);
  }

  protected static async post<T>(endpoint: string, data: any): Promise<AxiosResponse<T>> {
    try {
      const response = await postgrest.post<T>(endpoint, data);
      return response;
    } catch (error: any) {
      // Don't log 409 conflicts as they're expected business logic
      if (error.status !== 409) {
        console.error(`Error in POST request to ${endpoint}:`, error);
      }
      throw error;
    }
  }

  protected static async patch<T>(endpoint: string, data: any): Promise<AxiosResponse<T>> {
    return postgrest.patch<T>(endpoint, data);
  }

  protected static async delete(endpoint: string): Promise<AxiosResponse<void>> {
    return postgrest.delete(endpoint);
  }

  protected static buildFilter(field: string, operator: string, value: any): string {
    return `${field}=${operator}.${value}`;
  }
}

