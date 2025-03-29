import axios, { AxiosError } from 'axios';

const postgrest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_POSTGREST_URL || 'http://localhost:3000',
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
    if (error.response?.status !== 409) {
      console.error('PostgREST Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        stack: error.stack
      });
    }

    const enhancedError = new Error(error.message);
    Object.assign(enhancedError, {
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      config: error.config
    });

    return Promise.reject(enhancedError);
  }
);

export default postgrest;





