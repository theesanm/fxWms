import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',  // PostgREST server
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
    }
});

// Add request interceptor to clean up data and validate requests
api.interceptors.request.use(request => {
    // Clean up undefined and null values from request params
    if (request.params) {
        Object.keys(request.params).forEach(key => {
            if (request.params[key] === undefined || request.params[key] === null) {
                delete request.params[key];
            }
        });
    }

    // Clean up undefined and null values from URL queries
    if (request.url) {
        const url = new URL(request.url, request.baseURL);
        url.searchParams.forEach((value, key) => {
            if (value === 'undefined' || value === 'null') {
                url.searchParams.delete(key);
            }
        });
        request.url = url.pathname + url.search;
    }

    // Log the cleaned request
    console.log('PostgREST API Request:', {
        url: request.url,
        method: request.method,
        data: request.data,
        params: request.params,
        headers: request.headers
    });

    return request;
}, error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('API Error Response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        return Promise.reject(error);
    }
);

export default api;


