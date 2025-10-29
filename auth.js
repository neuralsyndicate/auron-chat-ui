/**
 * Auron Authentication Module
 * Handles registration, login, and JWT token management
 */

// Authentication API (your server)
// Fixed to actual backend server (not CDN)
const AUTH_API_BASE = 'http://86.38.182.54:8002';

// AI Service API (Dialogue/Chat backend - M4 Pro via Tailscale)
const AI_API_BASE = 'http://100.123.105.115:8000';

class AuthService {
    constructor() {
        this.tokenKey = 'auron_auth_token';
        this.userKey = 'auron_user';
    }

    /**
     * Register a new user account
     */
    async register(username, password) {
        try {
            const response = await fetch(`${AUTH_API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            const data = await response.json();

            // Store JWT token and user info
            this.setToken(data.access_token);
            this.setUser(data.user);

            console.log('✓ User registered:', data.user.username);
            return data;

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login with existing account
     */
    async login(username, password) {
        try {
            const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Store JWT token and user info
            this.setToken(data.access_token);
            this.setUser(data.user);

            console.log('✓ User logged in:', data.user.username);
            return data;

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout - clear local data
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        console.log('✓ User logged out');
    }

    /**
     * Get current auth token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Set auth token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
     * Get current user info
     */
    getUser() {
        const userJson = localStorage.getItem(this.userKey);
        return userJson ? JSON.parse(userJson) : null;
    }

    /**
     * Set user info
     */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }


    /**
     * Send chat message (authenticated)
     */
    async sendMessage(message, conversationHistory = []) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${AI_API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    conversation_history: conversationHistory
                })
            });

            // Handle token expiration
            if (response.status === 401) {
                console.warn('Token expired, logging out...');
                this.logout();
                window.location.href = 'login.html';
                throw new Error('Authentication expired');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Chat request failed');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }

}

// Export global instance
const authService = new AuthService();
