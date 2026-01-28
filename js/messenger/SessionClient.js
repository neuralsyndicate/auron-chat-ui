// ============================================================
// SESSION MESSENGER - Browser Client
// ============================================================

/**
 * SessionClient - Browser client for Session messaging
 *
 * The Session.js operations happen on the proxy server.
 * This client:
 * - Generates/stores mnemonic (using Web Crypto)
 * - Gets real Session ID from proxy
 * - Sends messages via proxy
 * - Polls for messages via proxy
 */

class SessionClient {
    constructor() {
        this.isInitialized = false;
        this.sessionId = null;
        this.userId = null;
        this.mnemonic = null;
        this.pollInterval = null;
    }

    /**
     * Generate a random mnemonic seed (hex)
     */
    generateMnemonic() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Initialize Session client for authenticated user
     */
    async initialize(userId, existingMnemonic) {
        if (!userId) {
            throw new Error('Logto user ID required');
        }

        this.userId = userId;

        try {
            if (existingMnemonic) {
                this.mnemonic = existingMnemonic;
            } else {
                this.mnemonic = this.generateMnemonic();
                window.SessionStorage.storeMnemonic(userId, this.mnemonic);
            }

            // Get real Session ID from proxy
            const response = await fetch(SESSION_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'init',
                    mnemonic: this.mnemonic
                })
            });

            if (!response.ok) {
                throw new Error(`Init failed: ${response.status}`);
            }

            const data = await response.json();
            this.sessionId = data.sessionId;

            window.SessionStorage.storeSessionId(userId, this.sessionId);

            this.isInitialized = true;
            console.log('Session initialized for user:', userId);
            console.log('Session ID:', this.sessionId);

            return existingMnemonic ? undefined : this.mnemonic;
        } catch (error) {
            console.error('Session init failed:', error);
            throw error;
        }
    }

    /**
     * Get Session ID
     */
    getSessionId() {
        if (!this.isInitialized) throw new Error('Not initialized');
        return this.sessionId;
    }

    /**
     * Send message via proxy
     */
    async sendMessage(to, text) {
        if (!this.isInitialized) throw new Error('Not initialized');

        const response = await fetch(SESSION_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'send',
                mnemonic: this.mnemonic,
                to: to,
                text: text
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `Send failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Poll for messages via proxy
     */
    async pollMessages() {
        if (!this.isInitialized) return [];

        try {
            const response = await fetch(SESSION_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'poll',
                    mnemonic: this.mnemonic
                })
            });

            if (!response.ok) {
                console.warn('Poll failed:', response.status);
                return [];
            }

            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('Poll error:', error);
            return [];
        }
    }

    /**
     * Start polling for messages
     */
    startPolling(onMessage, intervalMs = 5000) {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        const poll = async () => {
            const messages = await this.pollMessages();
            messages.forEach(msg => {
                if (onMessage) onMessage(msg);
            });
        };

        // Initial poll
        poll();

        // Set up interval
        this.pollInterval = setInterval(poll, intervalMs);
        console.log('Polling started');
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            console.log('Polling stopped');
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPolling();
        this.isInitialized = false;
        this.sessionId = null;
        this.userId = null;
        this.mnemonic = null;
    }
}

// Per-user instances
const sessionClientInstances = new Map();

function getSessionClient(userId) {
    if (!userId) throw new Error('User ID required');

    if (!sessionClientInstances.has(userId)) {
        sessionClientInstances.set(userId, new SessionClient());
    }
    return sessionClientInstances.get(userId);
}

function clearSessionClient(userId) {
    if (sessionClientInstances.has(userId)) {
        sessionClientInstances.get(userId).destroy();
        sessionClientInstances.delete(userId);
    }
}

// Export
window.SessionClient = SessionClient;
window.getSessionClient = getSessionClient;
window.clearSessionClient = clearSessionClient;
