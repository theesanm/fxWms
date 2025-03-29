import { useState } from 'react';
import api from '@/lib/postgrest';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (endpoint: string, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint, options);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const mutateData = async (method: 'post' | 'patch' | 'delete', endpoint: string, data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api[method](endpoint, data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchData,
    mutateData
  };
}