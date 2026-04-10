import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAccessToken, setCsrfToken } from '../services/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hub, setHubState] = useState(null);

    // Dynamic hub setter that persists to storage
    const setHub = (hubData) => {
        if (hubData) {
            localStorage.setItem('active_fulfillment_hub', JSON.stringify(hubData));
        } else {
            localStorage.removeItem('active_fulfillment_hub');
        }
        setHubState(hubData);
    };

    useEffect(() => {
        const fetchMe = async () => {
            const token = localStorage.getItem('fulfillment_token');
            const cachedHub = localStorage.getItem('active_fulfillment_hub');

            if (!token) {
                setLoading(false);
                return;
            }

            // 🛡️ Always fetch CSRF token for secure mutations when token exists
            try {
               const { data: csrfData } = await axiosInstance.get('/csrf-token');
               setCsrfToken(csrfData.csrfToken);
            } catch (err) {
               console.error("CSRF Bootstrap Failure:", err);
            }

            // Restore hub from cache immediately for UX
            if (cachedHub) {
                try { setHubState(JSON.parse(cachedHub)); } catch (e) { console.error("Cache corrupted"); }
            }

            try {
                const { data } = await axiosInstance.get('/auth/me');
                if (data.success) {
                    setUser(data.user);
                    
                    // Priority: Assigned Hub > Cached Hub
                    const targetHubId = data.user.fulfillmentHubId || (cachedHub ? JSON.parse(cachedHub).id : null);

                    if (targetHubId) {
                       try {
                          const hubRes = await axiosInstance.get(`/delivery/hubs/${targetHubId}`);
                          setHub(hubRes.data.hub || null);
                       } catch (hubErr) {
                          console.error("Critical: Failed to sync hub identity context", hubErr);
                          if (!data.user.fulfillmentHubId) setHub(null); // Clear cache if fetch fails and no assignment
                       }
                    } 
                }
            } catch (err) {
                console.error("Auth check failed", err);
                localStorage.removeItem('fulfillment_token');
                localStorage.removeItem('active_fulfillment_hub');
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

                // 🛡️ Fetch fresh CSRF token after auth state change
                try {
                    const { data: csrfData } = await axiosInstance.get('/csrf-token');
                    setCsrfToken(csrfData.csrfToken);
                } catch (e) {
                    console.error("Post-login CSRF Refresh Failure", e);
                }
                
                if (data.user.fulfillmentHubId) {
                   try {
                      const hubRes = await axiosInstance.get(`/delivery/hubs/${data.user.fulfillmentHubId}`);
                      setHub(hubRes.data.hub || null);
                   } catch (hubErr) {
                      console.error("Login sync: Hub data fetch failed", hubErr);
                   }
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

    const isAdmin = user?.role?.includes('admin') || user?.role?.includes('super_admin');
    const isManager = user?.role?.includes('fulfillment_manager') || isAdmin;
    const isHQ = user?.role?.includes('hq_staff') || isAdmin;
    const isStaff = user?.role?.includes('fulfillment_staff');

    return (
        <AuthContext.Provider value={{ 
            user, hub, loading, login, logout, setHub,
            isAdmin, isManager, isHQ, isStaff
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
