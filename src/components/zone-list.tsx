import apiClient from '@/lib/postgrest';

const ZoneList = () => {
  const fetchZones = async () => {
    try {
      const response = await apiClient.get('/zones');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      throw error;
    }
  };
  
  // ... rest of component code
};