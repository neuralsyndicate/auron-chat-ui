// API Client Functions
// Depends on: js/config.js, js/auth.js

const API = {
    /**
     * Send a chat message
     * @param {string} message - User message
     * @param {string|null} sessionId - Current session ID (or null for new session)
     * @returns {Promise<object>} Response with message and session_id
     */
    async sendMessage(message, sessionId = null) {
        const token = await window.AuthUtils.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated - please log in again');
        }

        const response = await fetch(`${window.API_CONFIG.DIALOGUE_API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
                metadata: { session_id: sessionId }
            })
        });

        if (!response.ok) {
            throw new Error(`Chat request failed: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Save current session to backend (triggers pattern extraction)
     * @param {string} sessionId - Session ID to save
     * @returns {Promise<object>} Save result with patterns_extracted count
     */
    async saveSession(sessionId) {
        const token = await window.AuthUtils.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${window.API_CONFIG.DIALOGUE_API_BASE}/save-session`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save session: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Get list of user's conversations
     * @returns {Promise<Array>} List of conversations
     */
    async getConversations() {
        const token = await window.AuthUtils.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${window.API_CONFIG.DIALOGUE_API_BASE}/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch conversations: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Get signed URL for a conversation file from BunnyCDN
     * @param {string} bunnyKey - BunnyCDN storage key (e.g., /conversations/user_id/session_id.json)
     * @returns {Promise<string>} Signed URL with token
     */
    async getConversationUrl(bunnyKey) {
        const token = await window.AuthUtils.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${window.API_CONFIG.DIALOGUE_API_BASE}/get-conversation-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bunny_key: bunnyKey
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to get conversation URL: ${response.status}`);
        }

        const data = await response.json();
        return data.signed_url;
    },

    /**
     * Fetch conversation details from BunnyCDN using signed URL
     * @param {string} signedUrl - Signed URL from getConversationUrl()
     * @returns {Promise<object>} Conversation data
     */
    async fetchConversation(signedUrl) {
        const response = await fetch(signedUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch conversation: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Get user profile
     * @returns {Promise<object>} User profile data
     */
    async getProfile() {
        const token = await window.AuthUtils.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${window.API_CONFIG.DIALOGUE_API_BASE}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        return await response.json();
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.API = API;
}
