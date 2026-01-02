import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getMe = () => api.get('/auth/me');

// Clients
export const getClients = (search = '', responsibleId = '') => {
    const params = {};
    if (search) params.name = search;
    if (responsibleId) params.responsibleId = responsibleId;
    return api.get('/clients', { params });
};
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Bids
export const getBids = () => api.get('/bids');
export const getBid = (id) => api.get(`/bids/${id}`);
export const createBid = (data) => api.post('/bids', data);
export const updateBid = (id, data) => api.put(`/bids/${id}`, data);
export const deleteBid = (id) => api.delete(`/bids/${id}`);

// Users
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Roles
export const getRoles = () => api.get('/roles');
export const getRole = (id) => api.get(`/roles/${id}`);
export const createRole = (data) => api.post('/roles', data);
export const updateRole = (id, data) => api.put(`/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/${id}`);

// Client Objects
export const getClientObjects = (clientId = '') => {
    const params = {};
    if (clientId) params.clientId = clientId;
    return api.get('/client-objects', { params });
};
export const getClientObject = (id) => api.get(`/client-objects/${id}`);
export const createClientObject = (data) => api.post('/client-objects', data);
export const updateClientObject = (id, data) => api.put(`/client-objects/${id}`, data);
export const deleteClientObject = (id) => api.delete(`/client-objects/${id}`);

export default api;