// ============================================================
// SESSION MESSENGER - Lightweight Browser Client
// ============================================================

/**
 * SessionClient - Lightweight browser client for Session messaging
 *
 * The heavy Session.js work happens on the proxy server.
 * This client handles:
 * - Keypair generation/storage (using Web Crypto)
 * - API calls to our proxy
 * - Message encryption/decryption (client-side for true E2E)
 *
 * Note: For MVP, we use a simplified approach where the proxy
 * handles Session network communication. Full E2E with client-side
 * crypto can be added later.
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
     * Generate a random mnemonic (13 words for Session compatibility)
     * Using Web Crypto for randomness
     */
    generateMnemonic() {
        // Session uses 13-word mnemonics from a specific wordlist
        // For simplicity, we generate a hex seed and use it as identifier
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex;
    }

    /**
     * Derive Session ID from mnemonic (simplified)
     * Real Session uses ed25519 keypair derivation
     */
    deriveSessionId(mnemonic) {
        // Session IDs start with '05' and are 66 chars (33 bytes hex)
        // For MVP, we create a deterministic ID from the mnemonic
        const encoder = new TextEncoder();
        const data = encoder.encode(mnemonic + 'session-id-salt');

        // Use SubtleCrypto to hash
        return crypto.subtle.digest('SHA-256', data).then(hash => {
            const hashArray = new Uint8Array(hash);
            const hex = Array.from(hashArray.slice(0, 32))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return '05' + hex + '00'; // 66 chars total
        });
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

            this.sessionId = await this.deriveSessionId(this.mnemonic);
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

        try {
            const response = await fetch(SESSION_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'send',
                    from: this.sessionId,
                    to: to,
                    text: text,
                    mnemonic: this.mnemonic // Proxy needs this to sign
                })
            });

            if (!response.ok) {
                throw new Error(`Send failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Send message failed:', error);
            throw error;
        }
    }

    /**
     * Poll for messages via proxy
     */
    async pollMessages() {
        if (!this.isInitialized) return [];

        try {
            const response = await fetch(SESSION_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'poll',
                    sessionId: this.sessionId,
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
            console.error('Poll failed:', error);
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
