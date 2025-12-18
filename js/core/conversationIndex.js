// ============================================================
// CONVERSATION INDEX MANAGER - Frontend E2E Encrypted Index
// ============================================================
// Manages an encrypted conversation index stored in BunnyCDN
// Path: conversations/{user_hash}/index.enc

class ConversationIndexManager {
    constructor() {
        this.userId = null;
        this.userHash = null;
        this.encryptionKey = null;
        this.index = null;
        this.indexPath = null;
        this.initialized = false;
    }

    /**
     * Initialize the index manager with user credentials
     * @param {string} userId - Logto user ID
     */
    async init(userId) {
        if (this.initialized && this.userId === userId) {
            return;
        }

        this.userId = userId;
        this.userHash = await hashUserId(userId);
        this.encryptionKey = await deriveUserEncryptionKey(userId);
        this.indexPath = `conversations/${this.userHash}/index.enc`;
        this.index = null;
        this.initialized = true;

        console.log(`ConversationIndexManager initialized for user hash: ${this.userHash.slice(0, 8)}...`);
    }

    /**
     * Load the conversation index from BunnyCDN
     * Creates empty index if none exists
     */
    async load() {
        if (!this.initialized) {
            throw new Error('ConversationIndexManager not initialized. Call init() first.');
        }

        try {
            const token = await getAuthToken();
            const response = await fetch(`${BFF_API_BASE}/cdn-proxy?path=${encodeURIComponent(this.indexPath)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Index load response:', response.status);

            if (response.status === 404) {
                // No index exists yet - create empty one
                this.index = { version: 1, conversations: {} };
                console.log('No existing index, created new empty index');
            } else if (response.ok) {
                const encryptedData = await response.arrayBuffer();
                // Check if we got actual data (min size for AES-GCM: 12 byte IV + 16 byte tag = 28 bytes)
                if (encryptedData.byteLength < 28) {
                    console.log('Index file too small, creating new empty index');
                    this.index = { version: 1, conversations: {} };
                } else {
                    this.index = await decryptData(encryptedData, this.encryptionKey);
                    console.log(`Loaded conversation index: ${Object.keys(this.index.conversations || {}).length} conversations`);
                }
            } else {
                throw new Error(`Failed to load index: ${response.status}`);
            }
        } catch (err) {
            console.warn('Could not load conversation index:', err);
            // Create empty index on error
            this.index = { version: 1, conversations: {} };
        }

        return this.index;
    }

    /**
     * Save the conversation index to BunnyCDN
     */
    async save() {
        if (!this.initialized || !this.index) {
            throw new Error('ConversationIndexManager not initialized or no index loaded');
        }

        try {
            const token = await getAuthToken();
            const encryptedData = await encryptData(this.index, this.encryptionKey);

            const response = await fetch(`${BFF_API_BASE}/cdn-proxy`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                    'X-CDN-Path': this.indexPath
                },
                body: encryptedData
            });

            if (!response.ok) {
                throw new Error(`Failed to save index: ${response.status}`);
            }

            console.log('Conversation index saved');
        } catch (err) {
            console.error('Failed to save conversation index:', err);
            throw err;
        }
    }

    /**
     * Add a new conversation to the index
     * @param {object} conv - Conversation metadata
     * @param {string} conv.id - Conversation ID
     * @param {string} conv.title - Conversation title
     * @param {number} conv.message_count - Number of messages
     * @param {string} conv.bunny_key - BunnyCDN storage path
     */
    async addConversation(conv) {
        if (!this.index) {
            await this.load();
        }

        const now = new Date().toISOString();
        this.index.conversations[conv.id] = {
            id: conv.id,
            title: conv.title || generateConversationTitle(''),
            created_at: conv.created_at || now,
            updated_at: now,
            message_count: conv.message_count || 0,
            bunny_key: conv.bunny_key
        };

        await this.save();
        console.log(`Added conversation to index: ${conv.id}`);
        return this.index.conversations[conv.id];
    }

    /**
     * Update an existing conversation in the index
     * @param {string} id - Conversation ID
     * @param {object} updates - Fields to update
     */
    async updateConversation(id, updates) {
        if (!this.index) {
            await this.load();
        }

        if (!this.index.conversations[id]) {
            console.warn(`Conversation ${id} not found in index`);
            return null;
        }

        Object.assign(this.index.conversations[id], updates, {
            updated_at: new Date().toISOString()
        });

        await this.save();
        console.log(`Updated conversation in index: ${id}`);
        return this.index.conversations[id];
    }

    /**
     * Get a conversation from the index
     * @param {string} id - Conversation ID
     * @returns {object|null} Conversation metadata or null
     */
    getConversation(id) {
        if (!this.index) {
            return null;
        }
        return this.index.conversations[id] || null;
    }

    /**
     * List conversations sorted by most recent
     * @param {number} limit - Maximum number to return
     * @returns {Array} Array of conversation metadata
     */
    list(limit = 20) {
        if (!this.index || !this.index.conversations) {
            return [];
        }

        return Object.values(this.index.conversations)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, limit);
    }

    /**
     * Delete a conversation from the index
     * @param {string} id - Conversation ID
     */
    async deleteConversation(id) {
        if (!this.index) {
            await this.load();
        }

        if (this.index.conversations[id]) {
            delete this.index.conversations[id];
            await this.save();
            console.log(`Deleted conversation from index: ${id}`);
        }
    }

    /**
     * Check if a conversation exists in the index
     * @param {string} id - Conversation ID
     * @returns {boolean}
     */
    hasConversation(id) {
        return this.index && !!this.index.conversations[id];
    }
}

// Global singleton instance
const conversationIndex = new ConversationIndexManager();
