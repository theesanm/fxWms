import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001',  // Next.js application server
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Clean up the data before sending
    if (config.data) {
      // Remove undefined and null values
      const cleanData = Object.fromEntries(
        Object.entries(config.data)
          .filter(([_, value]) => value !== undefined && value !== null)
      );
      config.data = cleanData;
    }

    // Log the request
    console.log('Next.js API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
