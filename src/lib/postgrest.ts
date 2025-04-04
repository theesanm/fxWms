import axios, { AxiosError } from 'axios';

// Determine if we're running on the client or server side
const isClient = typeof window !== 'undefined';

// Use the API proxy when on client side, direct connection on server side
const baseURL = isClient
  ? '/api/postgrest' // Use our API proxy route
  : process.env.POSTGREST_URL || 'http://localhost:3000'; // Direct connection on server

console.log(`[PostgREST Client] Using baseURL: ${baseURL}`);

const postgrest = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Add response interceptor
postgrest.interceptors.response.use(
  (response) => {
    if (response.config.method !== 'get') {
      console.log('PostgREST Success:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Only log non-409 errors and ensure error object exists
    if (error?.response?.status !== 409) {
      const errorDetails = {
        url: error?.config?.url || 'unknown',
        method: error?.config?.method || 'unknown',
        message: error?.message || 'No error message',
        status: error?.response?.status || 'unknown',
        statusText: error?.response?.statusText || 'unknown',
        data: error?.response?.data || null,
        code: error?.code || 'unknown'
      };

      console.error('PostgREST Error:', errorDetails);
    }

    // Create enhanced error with safe fallbacks
    const enhancedError = new Error(error?.message || 'Unknown error');
    Object.assign(enhancedError, {
      status: error?.response?.status || 500,
      data: error?.response?.data || null,
      code: error?.code || 'UNKNOWN_ERROR',
      config: error?.config || {}
    });

    return Promise.reject(enhancedError);
  }
);

export default postgrest;






