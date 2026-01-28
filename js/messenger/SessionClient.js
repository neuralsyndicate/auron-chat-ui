// ============================================================
// SESSION MESSENGER - Client Wrapper
// ============================================================

/**
 * SessionClient - Wrapper for Session.js messaging
 *
 * Uses Session Protocol via our proxy at session.combryth-backbone.ch
 * All encryption happens client-side - proxy only sees encrypted blobs
 * Each Logto user gets their own Session identity (scoped storage)
 */
class SessionClient {
    constructor() {
        this.session = null;
        this.poller = null;
        this.onMessageCallback = null;
        this.isInitialized = false;
        this.sessionId = null;
        this.userId = null; // Logto user ID
    }

    /**
     * Initialize Session client for authenticated user
     * @param {string} userId - Logto user ID (required)
     * @param {string} mnemonic - Existing mnemonic to restore, or undefined to create new
     * @returns {Promise<string|undefined>} - Returns mnemonic if new account created
     */
    async initialize(userId, mnemonic) {
        if (!userId) {
            throw new Error('Logto user ID required to initialize Session');
        }

        this.userId = userId;

        try {
            // Dynamic import Session.js modules from ESM CDN
            const sessionModule = await import('https://esm.run/@session.js/client');
            const { Session, Poller, ready } = sessionModule;

            // Wait for Session.js to be ready
            await ready;

            // Import network client for browser proxy communication
            const networkModule = await import('https://esm.run/@session.js/bun-network-remote');
            const { BunNetworkRemoteClient } = networkModule;

            // Configure to use our proxy
            const network = new BunNetworkRemoteClient({
                proxy: SESSION_PROXY_URL
            });

            this.session = new Session({ network });

            if (mnemonic) {
                // Restore existing account
                this.session.setMnemonic(mnemonic, 'Neural Music User');
                this.sessionId = this.session.getSessionID();
                window.SessionStorage.storeSessionId(this.userId, this.sessionId);
                this.isInitialized = true;
                console.log('Session restored for user:', userId);
                return undefined;
            } else {
                // Generate new account
                const keypairModule = await import('https://esm.run/@session.js/keypair');
                const mnemonicModule = await import('https://esm.run/@session.js/mnemonic');

                const { generateSeedHex } = keypairModule;
                const { encode } = mnemonicModule;

                const seedHex = generateSeedHex();
                const newMnemonic = encode(seedHex);

                this.session.setMnemonic(newMnemonic, 'Neural Music User');
                this.sessionId = this.session.getSessionID();

                // Store scoped to this Logto user
                window.SessionStorage.storeMnemonic(this.userId, newMnemonic);
                window.SessionStorage.storeSessionId(this.userId, this.sessionId);

                this.isInitialized = true;
                console.log('New Session account created for user:', userId);
                return newMnemonic;
            }
        } catch (error) {
            console.error('Session initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get user's Session ID (public key)
     */
    getSessionId() {
        if (!this.isInitialized) throw new Error('Session not initialized');
        return this.sessionId;
    }

    /**
     * Get Logto user ID
     */
    getUserId() {
        return this.userId;
    }

    /**
     * Send text message
     */
    async sendMessage(to, text) {
        if (!this.isInitialized) throw new Error('Session not initialized');
        await this.session.sendMessage({ to, text });
    }

    /**
     * Start polling for messages
     */
    async startPolling(onMessage) {
        if (!this.isInitialized) throw new Error('Session not initialized');

        const sessionModule = await import('https://esm.run/@session.js/client');
        const { Poller } = sessionModule;

        this.onMessageCallback = onMessage;
        this.poller = new Poller({ interval: 3000 }); // Poll every 3 seconds
        this.session.addPoller(this.poller);

        this.session.on('message', (msg) => {
            if (this.onMessageCallback) {
                this.onMessageCallback({
                    from: msg.from,
                    text: msg.text,
                    timestamp: msg.timestamp
                });
            }
        });

        console.log('Session polling started');
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.poller) {
            this.poller.stopPolling();
            this.poller = null;
            console.log('Session polling stopped');
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPolling();
        this.session = null;
        this.isInitialized = false;
        this.userId = null;
    }
}

// Per-user client instances (scoped by Logto user ID)
const sessionClientInstances = new Map();

/**
 * Get or create Session client for authenticated user
 * @param {string} userId - Logto user ID
 */
function getSessionClient(userId) {
    if (!userId) {
        throw new Error('User ID required to get Session client');
    }

    if (!sessionClientInstances.has(userId)) {
        sessionClientInstances.set(userId, new SessionClient());
    }
    return sessionClientInstances.get(userId);
}

/**
 * Clear Session client for user (on logout)
 */
function clearSessionClient(userId) {
    if (sessionClientInstances.has(userId)) {
        const client = sessionClientInstances.get(userId);
        client.destroy();
        sessionClientInstances.delete(userId);
    }
}

// Export for global access
window.SessionClient = SessionClient;
window.getSessionClient = getSessionClient;
window.clearSessionClient = clearSessionClient;
