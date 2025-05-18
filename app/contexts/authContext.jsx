import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import * as SecureStorage from "expo-secure-store";

import getEnvVars from '../../config/environment';

const { API_URL } = getEnvVars();
const TOKEN_KEY = 'MY_JWT';
export const BASE_API_URL = `${API_URL}/api/login`;

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const decodeJWT = (token) => {
    try {
      // JWT has 3 parts: header.payload.signature
      const base64Payload = token.split('.')[1];
      // Replace chars that are not valid for base64 URL encoding
      const fixedBase64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      // Decode and parse
      const payload = JSON.parse(atob(fixedBase64));
      return payload;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };
  
const isTokenExpired = (token) => {
    try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) return true;
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        console.error("Error checking token expiration:", error);
        return true;
    }
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({ token: null, authenticated: null, userData: null, userRole: null });

    // Inside AuthProvider
    useEffect(() => {
        console.log("Current auth state:", authState);
    }, [authState]);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await SecureStorage.getItemAsync(TOKEN_KEY);

                console.log("Token:-", token);
                if (token) {
                    // Check token expiration
                    if (isTokenExpired(token)) {
                        console.log("Expired token detected at startup, logging out");
                        logout();
                        return;
                    }
                    
                    const decodedToken = decodeJWT(token);
                    const userRole = decodedToken?.role || null;
                    
                    setAuthState({ 
                        token: `Bearer ${token}`, 
                        authenticated: true, 
                        userRole: userRole, 
                        userData: decodedToken 
                    });
                    
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Set up interceptor to check for expired token responses
                    setupAxiosInterceptors();
                }
            } catch (error) {
                console.error("Error loading token:", error);
            }
        };

        loadToken();
    }, []);  // Add dependency array to ensure effect runs once
    
    // Setup axios interceptor for expired token detection
    const setupAxiosInterceptors = () => {
        // Add response interceptor
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                // If we get a 401 (Unauthorized) or specific token expired message
                if (
                    error.response && 
                    (error.response.status === 401 || 
                     error.response.status === 403 || 
                     (error.response.data && error.response.data.message === 'Token expired'))
                ) {
                    console.log('Server indicated expired token, logging out...');
                    await logout();
                }
                return Promise.reject(error);
            }
        );
    };

    const register = async (email, password) => {
        try {
            const response = await axios.post(`${BASE_API_URL}/users/signup`, {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${BASE_API_URL}`, {
                username,
                password,
            });

            if (response.data.token) {
                // Decode token to extract user data and role
                const decodedToken = decodeJWT(response.data.token);
                const userRole = decodedToken?.role || null;
                const bearerToken = `Bearer ${response.data.token}`;

                setAuthState({ 
                    token: bearerToken, 
                    authenticated: true,
                    userRole: userRole,
                    userData: decodedToken
                });
  
                // Save token securely
                await SecureStorage.setItemAsync(TOKEN_KEY, response.data.token);

                // Set token for axios
                axios.defaults.headers.common['Authorization'] = bearerToken;
                
                // Setup interceptors for this session
                setupAxiosInterceptors();
            }

            return response.data;  // Return response data
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            throw new Error('Invalid credentials');
        }
    };

    const logout = async () => {
        console.log("Logging out...");
        setAuthState({ token: null, authenticated: false, userRole: null, userData: null });
        await SecureStorage.deleteItemAsync(TOKEN_KEY);
        delete axios.defaults.headers.common['Authorization'];
    };
    
    const hasRole = (requiredRole) => {
        return authState.userRole === requiredRole;
    };
    
    // Function to get auth headers
    const getAuthHeader = () => {
        if (authState.token) {
            const token = authState.token.replace('Bearer ', '');
            if (isTokenExpired(token)) {
                console.log("Token expired when getting auth header");
                logout();
                throw new Error('Your session has expired. Please login again.');
            }
            return { Authorization: authState.token };
        }
        return {};
    };
    
    // Setup a periodic token expiration check
    useEffect(() => {
        if (authState.authenticated && authState.token) {
            // Check token expiration periodically 
            const intervalId = setInterval(() => {
                const token = authState.token.replace('Bearer ', '');
                if (isTokenExpired(token)) {
                    console.log("Token expired during periodic check");
                    logout();
                }
            }, 60000); // Check every minute
            
            return () => clearInterval(intervalId);
        }
    }, [authState.authenticated, authState.token]);

    const value = {
        authState,
        onRegistered: register,
        onLogin: login,
        onLogout: logout,
        getAuthHeader,
        hasRole, // Add this function to check roles
        userRole: authState.userRole, // Expose role directly
        userData: authState.userData // Expose all user data from token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};