// ============================================================
// MESSAGE ENVELOPE PROTOCOL v1
// Embeds sender metadata in message text for Session Protocol
// ============================================================

/**
 * Message Types:
 * - msg: Regular chat message
 * - req: Contact request (first message to unknown recipient)
 * - ack: Contact request accepted
 */

var MessageEnvelope = {
    PROTOCOL_VERSION: 1,
    TYPES: {
        MESSAGE: 'msg',
        REQUEST: 'req',
        ACKNOWLEDGE: 'ack'
    },

    /**
     * Create an envelope-wrapped message
     * @param {string} type - Message type (msg, req, ack)
     * @param {string} username - Sender's Logto username
     * @param {string} displayName - Sender's display name
     * @param {string} payload - Message content
     * @returns {string} JSON envelope string
     */
    create: function(type, username, displayName, payload) {
        var envelope = {
            v: this.PROTOCOL_VERSION,
            t: type,
            u: username || '',
            n: displayName || '',
            p: payload || ''
        };
        return JSON.stringify(envelope);
    },

    /**
     * Create a regular message envelope
     */
    createMessage: function(username, displayName, text) {
        return this.create(this.TYPES.MESSAGE, username, displayName, text);
    },

    /**
     * Create a contact request envelope
     */
    createRequest: function(username, displayName, introMessage) {
        return this.create(this.TYPES.REQUEST, username, displayName, introMessage || 'I\'d like to connect with you.');
    },

    /**
     * Create an acknowledgment envelope (contact accepted)
     */
    createAcknowledge: function(username, displayName) {
        return this.create(this.TYPES.ACKNOWLEDGE, username, displayName, 'Contact request accepted');
    },

    /**
     * Parse an incoming message
     * @param {string} text - Raw message text
     * @returns {object} Parsed envelope or legacy wrapper
     */
    parse: function(text) {
        // Check if it's an envelope (starts with {"v":)
        if (text && typeof text === 'string' && text.trimStart().startsWith('{"v":')) {
            try {
                var envelope = JSON.parse(text);
                // Validate required fields
                if (typeof envelope.v === 'number' && typeof envelope.t === 'string') {
                    return {
                        isEnvelope: true,
                        version: envelope.v,
                        type: envelope.t,
                        username: envelope.u || '',
                        displayName: envelope.n || '',
                        payload: envelope.p || '',
                        raw: text
                    };
                }
            } catch (e) {
                // Parse failed, treat as legacy
            }
        }

        // Legacy plain text message
        return {
            isEnvelope: false,
            version: 0,
            type: this.TYPES.MESSAGE,
            username: '',
            displayName: '',
            payload: text || '',
            raw: text
        };
    },

    /**
     * Check if parsed message is a contact request
     */
    isRequest: function(parsed) {
        return parsed.type === this.TYPES.REQUEST;
    },

    /**
     * Check if parsed message is an acknowledgment
     */
    isAcknowledge: function(parsed) {
        return parsed.type === this.TYPES.ACKNOWLEDGE;
    },

    /**
     * Check if parsed message is a regular message
     */
    isMessage: function(parsed) {
        return parsed.type === this.TYPES.MESSAGE;
    },

    /**
     * Get display text for the message
     */
    getDisplayText: function(parsed) {
        return parsed.payload;
    },

    /**
     * Get display name with fallback
     */
    getDisplayName: function(parsed, sessionIdFallback) {
        if (parsed.displayName) {
            return parsed.displayName;
        }
        if (parsed.username) {
            return '@' + parsed.username;
        }
        if (sessionIdFallback) {
            return sessionIdFallback.slice(0, 8) + '...';
        }
        return 'Unknown';
    }
};

// Export for browser
window.MessageEnvelope = MessageEnvelope;

console.log('MessageEnvelope v1 loaded');
