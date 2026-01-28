// ============================================================
// SESSION MESSENGER - Browser Client
// ============================================================

/**
 * SessionClient - Browser client for Session messaging
 *
 * - Mnemonic generated server-side (proper 13-word Session mnemonic)
 * - Stored encrypted in localStorage via WebCrypto
 * - All Session operations via proxy
 */

class SessionClient {
    constructor() {
        this.isInitialized = false;
        this.sessionId = null;
        this.userId = null;
        this.mnemonic = null;
        this.pollInterval = null;
        this.userInfo = null; // Logto user object for envelope metadata
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
                // Use existing mnemonic - get Session ID from proxy
                this.mnemonic = existingMnemonic;

                const response = await fetch(SESSION_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'init',
                        mnemonic: this.mnemonic
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || `Init failed: ${response.status}`);
                }

                const data = await response.json();
                this.sessionId = data.sessionId;

            } else {
                // Generate new mnemonic on server
                const response = await fetch(SESSION_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'generate' })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || `Generate failed: ${response.status}`);
                }

                const data = await response.json();
                this.mnemonic = data.mnemonic;
                this.sessionId = data.sessionId;

                // Store encrypted mnemonic
                await window.SessionStorage.storeMnemonic(userId, this.mnemonic);
            }

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
     * Set user info for envelope metadata
     * @param {object} user - Logto user object with username, name, etc.
     */
    setUserInfo(user) {
        this.userInfo = user;
    }

    /**
     * Get user info
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * Send message via proxy (wraps in envelope automatically)
     * @param {string} to - Recipient's Session ID
     * @param {string} text - Message text (if already an envelope, sends as-is)
     * @param {boolean} isRawEnvelope - If true, text is already an envelope, don't wrap
     */
    async sendMessage(to, text, isRawEnvelope = false) {
        if (!this.isInitialized) throw new Error('Not initialized');

        // Wrap in envelope unless already wrapped or explicitly raw
        let messageText = text;
        if (!isRawEnvelope && !text.trimStart().startsWith('{"v":')) {
            const username = this.userInfo?.username || '';
            const displayName = this.userInfo?.name || this.userInfo?.username || '';
            messageText = window.MessageEnvelope.createMessage(username, displayName, text);
        }

        const response = await fetch(SESSION_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'send',
                mnemonic: this.mnemonic,
                to: to,
                text: messageText
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `Send failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Send a raw envelope (for contact requests, acks, etc.)
     */
    async sendEnvelope(to, envelope) {
        return this.sendMessage(to, envelope, true);
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

        // Initial poll after short delay
        setTimeout(poll, 1000);

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
