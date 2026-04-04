import axios from 'axios';

/**
 * Fulfillment Hub Portal - API Config
 * Connects to the secure gateway /v1
 */
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3070/v1',
    withCredentials: true,
});

let accessToken = localStorage.getItem('fulfillment_token') || '';
let csrfToken = '';

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('fulfillment_token', token);
    } else {
        localStorage.removeItem('fulfillment_token');
    }
};

export const setCsrfToken = (token) => {
    csrfToken = token;
};

axiosInstance.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
            config.headers['x-csrf-token'] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Fulfillment staff use the same refresh mechanism
                const res = await axiosInstance.post('/auth/refresh-token?staff=true', {}, { withCredentials: true });
                if (res.data.success) {
                    setAccessToken(res.data.token);
                    originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
                    return axiosInstance(originalRequest);
                }
            } catch (err) {
                localStorage.removeItem('fulfillment_token');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
