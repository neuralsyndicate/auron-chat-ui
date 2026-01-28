// ============================================================
// CONTACT MANAGER - Central logic for contact state
// Handles contact requests, blocking, and message routing
// ============================================================

var ContactManager = {
    /**
     * Process an incoming message and determine how to handle it
     * @param {string} userId - Current user's ID
     * @param {object} rawMessage - Raw message from Session {from, text, timestamp}
     * @param {object} user - Logto user object for sender info
     * @returns {Promise<object>} Processing result
     */
    processIncomingMessage: async function(userId, rawMessage, user) {
        var fromSessionId = rawMessage.from;
        var parsed = window.MessageEnvelope.parse(rawMessage.text);

        // Check if sender is blocked - silent drop
        var blocked = await window.SessionStorage.getBlockedIds(userId);
        if (blocked.includes(fromSessionId)) {
            return {
                action: 'blocked',
                message: null
            };
        }

        // Check if sender is a known contact
        var contacts = await window.SessionStorage.getContacts(userId);
        var contact = contacts.find(function(c) { return c.sessionId === fromSessionId; });

        // Handle acknowledgment (they accepted our request)
        if (window.MessageEnvelope.isAcknowledge(parsed)) {
            if (!contact) {
                // Add them as contact if not already
                var newContact = {
                    sessionId: fromSessionId,
                    username: parsed.username,
                    displayName: parsed.displayName,
                    addedAt: Date.now()
                };
                contacts.push(newContact);
                await window.SessionStorage.storeContacts(userId, contacts);

                // Remove from pending if exists
                var pending = await window.SessionStorage.getPendingRequests(userId);
                var filteredPending = pending.filter(function(r) { return r.sessionId !== fromSessionId; });
                if (filteredPending.length !== pending.length) {
                    await window.SessionStorage.storePendingRequests(userId, filteredPending);
                }
            }
            return {
                action: 'acknowledged',
                contact: contact || { sessionId: fromSessionId, username: parsed.username, displayName: parsed.displayName },
                message: null
            };
        }

        // Known contact - deliver message directly
        if (contact) {
            // Update contact info if envelope has newer data
            if (parsed.isEnvelope && (parsed.username || parsed.displayName)) {
                var updated = false;
                if (parsed.username && parsed.username !== contact.username) {
                    contact.username = parsed.username;
                    updated = true;
                }
                if (parsed.displayName && parsed.displayName !== contact.displayName) {
                    contact.displayName = parsed.displayName;
                    updated = true;
                }
                if (updated) {
                    await window.SessionStorage.storeContacts(userId, contacts);
                }
            }

            return {
                action: 'deliver',
                contact: contact,
                message: {
                    id: Date.now(),
                    from: fromSessionId,
                    text: parsed.payload,
                    timestamp: rawMessage.timestamp,
                    incoming: true,
                    senderUsername: parsed.username,
                    senderDisplayName: parsed.displayName
                }
            };
        }

        // Unknown sender - check pending requests
        var pendingRequests = await window.SessionStorage.getPendingRequests(userId);
        var existingRequest = pendingRequests.find(function(r) { return r.sessionId === fromSessionId; });

        if (existingRequest) {
            // Already have a pending request from them - hold message
            // Update their info if we got new envelope data
            if (parsed.isEnvelope) {
                if (parsed.username) existingRequest.username = parsed.username;
                if (parsed.displayName) existingRequest.displayName = parsed.displayName;
                // Append message to their request
                if (!existingRequest.heldMessages) existingRequest.heldMessages = [];
                existingRequest.heldMessages.push({
                    text: parsed.payload,
                    timestamp: rawMessage.timestamp
                });
                await window.SessionStorage.storePendingRequests(userId, pendingRequests);
            }
            return {
                action: 'held',
                pendingRequest: existingRequest,
                message: null
            };
        }

        // New unknown sender - create pending request
        var newRequest = {
            sessionId: fromSessionId,
            username: parsed.username,
            displayName: parsed.displayName,
            message: parsed.payload,
            receivedAt: Date.now(),
            heldMessages: []
        };

        pendingRequests.push(newRequest);
        await window.SessionStorage.storePendingRequests(userId, pendingRequests);

        return {
            action: 'new_request',
            pendingRequest: newRequest,
            message: null
        };
    },

    /**
     * Accept a contact request
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID of requester
     * @param {object} user - Current user's Logto object (for sending ack)
     * @param {object} client - SessionClient instance
     * @returns {Promise<object>} The new contact
     */
    acceptRequest: async function(userId, sessionId, user, client) {
        var pendingRequests = await window.SessionStorage.getPendingRequests(userId);
        var request = pendingRequests.find(function(r) { return r.sessionId === sessionId; });

        if (!request) {
            throw new Error('Request not found');
        }

        // Create contact from request
        var newContact = {
            sessionId: sessionId,
            username: request.username,
            displayName: request.displayName,
            addedAt: Date.now()
        };

        // Add to contacts
        var contacts = await window.SessionStorage.getContacts(userId);
        contacts.push(newContact);
        await window.SessionStorage.storeContacts(userId, contacts);

        // Remove from pending
        var filteredPending = pendingRequests.filter(function(r) { return r.sessionId !== sessionId; });
        await window.SessionStorage.storePendingRequests(userId, filteredPending);

        // Send acknowledgment back
        var ackEnvelope = window.MessageEnvelope.createAcknowledge(
            user?.username || '',
            user?.name || user?.username || ''
        );
        try {
            await client.sendMessage(sessionId, ackEnvelope);
        } catch (err) {
            console.warn('Failed to send ack:', err);
            // Still accept locally even if ack fails
        }

        return {
            contact: newContact,
            heldMessages: request.heldMessages || [],
            initialMessage: request.message
        };
    },

    /**
     * Ignore a contact request (remove without blocking)
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to ignore
     */
    ignoreRequest: async function(userId, sessionId) {
        var pendingRequests = await window.SessionStorage.getPendingRequests(userId);
        var filtered = pendingRequests.filter(function(r) { return r.sessionId !== sessionId; });
        await window.SessionStorage.storePendingRequests(userId, filtered);
    },

    /**
     * Block a user (from request or contact)
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to block
     */
    blockUser: async function(userId, sessionId) {
        // Add to blocked list
        var blocked = await window.SessionStorage.getBlockedIds(userId);
        if (!blocked.includes(sessionId)) {
            blocked.push(sessionId);
            await window.SessionStorage.storeBlockedIds(userId, blocked);
        }

        // Remove from pending requests
        var pendingRequests = await window.SessionStorage.getPendingRequests(userId);
        var filteredPending = pendingRequests.filter(function(r) { return r.sessionId !== sessionId; });
        if (filteredPending.length !== pendingRequests.length) {
            await window.SessionStorage.storePendingRequests(userId, filteredPending);
        }

        // Remove from contacts
        var contacts = await window.SessionStorage.getContacts(userId);
        var filteredContacts = contacts.filter(function(c) { return c.sessionId !== sessionId; });
        if (filteredContacts.length !== contacts.length) {
            await window.SessionStorage.storeContacts(userId, filteredContacts);
        }
    },

    /**
     * Unblock a user
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to unblock
     */
    unblockUser: async function(userId, sessionId) {
        var blocked = await window.SessionStorage.getBlockedIds(userId);
        var filtered = blocked.filter(function(id) { return id !== sessionId; });
        await window.SessionStorage.storeBlockedIds(userId, filtered);
    },

    /**
     * Send a contact request to a new user
     * @param {string} userId - Current user's ID
     * @param {string} targetSessionId - Target's Session ID
     * @param {object} user - Current user's Logto object
     * @param {object} client - SessionClient instance
     * @param {string} introMessage - Optional intro message
     */
    sendRequest: async function(userId, targetSessionId, user, client, introMessage) {
        var envelope = window.MessageEnvelope.createRequest(
            user?.username || '',
            user?.name || user?.username || '',
            introMessage || 'I\'d like to connect with you.'
        );

        await client.sendMessage(targetSessionId, envelope);

        // Create a local conversation in pending state
        return {
            sessionId: targetSessionId,
            username: '',
            displayName: '',
            status: 'pending_outgoing',
            sentAt: Date.now()
        };
    },

    /**
     * Get contact by session ID
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to find
     */
    getContact: async function(userId, sessionId) {
        var contacts = await window.SessionStorage.getContacts(userId);
        return contacts.find(function(c) { return c.sessionId === sessionId; }) || null;
    },

    /**
     * Check if a session ID is a known contact
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to check
     */
    isContact: async function(userId, sessionId) {
        var contact = await this.getContact(userId, sessionId);
        return contact !== null;
    },

    /**
     * Check if a session ID is blocked
     * @param {string} userId - Current user's ID
     * @param {string} sessionId - Session ID to check
     */
    isBlocked: async function(userId, sessionId) {
        var blocked = await window.SessionStorage.getBlockedIds(userId);
        return blocked.includes(sessionId);
    }
};

// Export for browser
window.ContactManager = ContactManager;

console.log('ContactManager v1 loaded');
