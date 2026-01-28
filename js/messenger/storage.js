// ============================================================
// SESSION MESSENGER - Mnemonic Storage (User-Scoped)
// ============================================================

/**
 * Storage keys are scoped to the authenticated Logto user ID
 * This ensures each user has their own Session identity
 */

function getStorageKey(userId, suffix) {
    if (!userId) throw new Error('User ID required for Session storage');
    return `nm_session_${userId}_${suffix}`;
}

/**
 * Store mnemonic for authenticated user
 */
function storeSessionMnemonic(userId, mnemonic) {
    const key = getStorageKey(userId, 'mnemonic');
    localStorage.setItem(key, mnemonic);
}

/**
 * Get mnemonic for authenticated user
 */
function getSessionMnemonic(userId) {
    const key = getStorageKey(userId, 'mnemonic');
    return localStorage.getItem(key);
}

/**
 * Clear all Session data for user
 */
function clearSessionData(userId) {
    const mnemonicKey = getStorageKey(userId, 'mnemonic');
    const sessionIdKey = getStorageKey(userId, 'session_id');
    const conversationsKey = getStorageKey(userId, 'conversations');

    localStorage.removeItem(mnemonicKey);
    localStorage.removeItem(sessionIdKey);
    localStorage.removeItem(conversationsKey);
}

/**
 * Check if user has Session account
 */
function hasSessionAccount(userId) {
    const key = getStorageKey(userId, 'mnemonic');
    return localStorage.getItem(key) !== null;
}

/**
 * Store Session ID for quick access
 */
function storeSessionId(userId, sessionId) {
    const key = getStorageKey(userId, 'session_id');
    localStorage.setItem(key, sessionId);
}

/**
 * Get stored Session ID
 */
function getStoredSessionId(userId) {
    const key = getStorageKey(userId, 'session_id');
    return localStorage.getItem(key);
}

/**
 * Store conversations list
 */
function storeConversations(userId, conversations) {
    const key = getStorageKey(userId, 'conversations');
    localStorage.setItem(key, JSON.stringify(conversations));
}

/**
 * Get conversations list
 */
function getConversations(userId) {
    const key = getStorageKey(userId, 'conversations');
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Store messages for a specific conversation
 */
function storeMessages(userId, recipientSessionId, messages) {
    const key = getStorageKey(userId, `messages_${recipientSessionId}`);
    localStorage.setItem(key, JSON.stringify(messages));
}

/**
 * Get messages for a specific conversation
 */
function getMessages(userId, recipientSessionId) {
    const key = getStorageKey(userId, `messages_${recipientSessionId}`);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
}

// Export for global access
window.SessionStorage = {
    storeMnemonic: storeSessionMnemonic,
    getMnemonic: getSessionMnemonic,
    clearData: clearSessionData,
    hasAccount: hasSessionAccount,
    storeSessionId: storeSessionId,
    getSessionId: getStoredSessionId,
    storeConversations: storeConversations,
    getConversations: getConversations,
    storeMessages: storeMessages,
    getMessages: getMessages
};
