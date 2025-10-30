// Authentication Utilities
// Depends on: logto-config.js, js/config.js

const AuthUtils = {
    /**
     * Get auth token (from cache or Logto)
     * @returns {Promise<string|null>} Access token
     */
    async getAuthToken() {
        // First try localStorage (cached access token)
        let token = localStorage.getItem('auron_access_token');
        if (token) {
            return token;
        }

        // Get fresh access token from Logto with API resource
        try {
            token = await window.LogtoAuth.getAccessToken(window.API_CONFIG.DIALOGUE_API_BASE);
            if (token) {
                localStorage.setItem('auron_access_token', token);
                return token;
            }
        } catch (err) {
            console.warn('Could not get access token from Logto:', err);
        }

        return null;
    },

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        try {
            const client = await window.initLogto();
            return await client.isAuthenticated();
        } catch (err) {
            console.error('Auth check failed:', err);
            return false;
        }
    },

    /**
     * Get current user info
     * @returns {Promise<object|null>}
     */
    async getUser() {
        try {
            const client = await window.initLogto();
            const isAuthed = await client.isAuthenticated();
            if (!isAuthed) return null;

            const user = await client.getIdTokenClaims();
            return {
                id: user.sub,
                name: user.name || user.username || 'User',
                email: user.email,
                picture: user.picture
            };
        } catch (err) {
            console.error('Failed to get user:', err);
            return null;
        }
    },

    /**
     * Sign in (redirect to Logto)
     */
    async signIn() {
        try {
            const client = await window.initLogto();
            await client.signIn(window.location.origin + '/callback.html');
        } catch (err) {
            console.error('Sign in failed:', err);
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        try {
            // Clear cached tokens
            localStorage.removeItem('auron_access_token');
            localStorage.removeItem('auron_id_token');

            // Sign out from Logto
            const client = await window.initLogto();
            await client.signOut(window.location.origin);
        } catch (err) {
            console.error('Sign out failed:', err);
            // Force redirect anyway
            window.location.href = '/';
        }
    },

    /**
     * Require authentication (redirect if not authenticated)
     * @returns {Promise<object>} User object
     */
    async requireAuth() {
        const isAuthed = await this.isAuthenticated();
        if (!isAuthed) {
            await this.signIn();
            return null;
        }

        const user = await this.getUser();
        if (!user) {
            await this.signIn();
            return null;
        }

        return user;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AuthUtils = AuthUtils;
}
