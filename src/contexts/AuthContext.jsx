import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAccessToken } from '../services/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hub, setHub] = useState(null);

    useEffect(() => {
        const fetchMe = async () => {
            const token = localStorage.getItem('fulfillment_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await axiosInstance.get('/auth/me');
                if (data.success) {
                    setUser(data.user);
                    
                    // Fetch associated hub details
                    if (data.user.fulfillmentHubId) {
                       const hubRes = await axiosInstance.get(`/delivery/hubs/${data.user.fulfillmentHubId}`);
                       setHub(hubRes.data.hub || null);
                    }
                }
            } catch (err) {
                console.error("Auth check failed", err);
                localStorage.removeItem('fulfillment_token');
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const login = async (identifier, password) => {
        try {
            const { data } = await axiosInstance.post('/auth/login', { identifier, password });
            if (data.success && !data.twoFactorRequired) {
                setAccessToken(data.accessToken);
                setUser(data.user);
                
                if (data.user.fulfillmentHubId) {
                   const hubRes = await axiosInstance.get(`/delivery/hubs/${data.user.fulfillmentHubId}`);
                   setHub(hubRes.data.hub || null);
                }
                return { success: true };
            }
            return data;
        } catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    };

    const logout = () => {
        setAccessToken(null);
        setUser(null);
        setHub(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, hub, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
