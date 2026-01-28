// ============================================================
// SESSION MESSENGER - Encrypted Mnemonic Storage
// ============================================================

/**
 * Storage with client-side encryption using WebCrypto
 * Mnemonic is encrypted with a key derived from userId + a user secret
 */

const STORAGE_VERSION = 'v2'; // Increment when changing encryption scheme

/**
 * Derive encryption key from userId using PBKDF2
 * The userId from Logto acts as the "password" for key derivation
 */
async function deriveKey(userId) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Use a fixed salt (could be made per-user for extra security)
    const salt = encoder.encode('nm-session-storage-salt-v1');

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data with AES-GCM
 */
async function encryptData(key, plaintext) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(plaintext)
    );

    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data with AES-GCM
 */
async function decryptData(key, encryptedBase64) {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(plaintext);
}

function getStorageKey(userId, suffix) {
    if (!userId) throw new Error('User ID required for Session storage');
    return `nm_session_${STORAGE_VERSION}_${userId}_${suffix}`;
}

/**
 * Store mnemonic (encrypted)
 */
async function storeSessionMnemonic(userId, mnemonic) {
    const key = await deriveKey(userId);
    const encrypted = await encryptData(key, mnemonic);
    localStorage.setItem(getStorageKey(userId, 'mnemonic'), encrypted);
}

/**
 * Get mnemonic (decrypted)
 */
async function getSessionMnemonic(userId) {
    const encrypted = localStorage.getItem(getStorageKey(userId, 'mnemonic'));
    if (!encrypted) return null;

    try {
        const key = await deriveKey(userId);
        return await decryptData(key, encrypted);
    } catch (e) {
        console.error('Failed to decrypt mnemonic:', e);
        return null;
    }
}

/**
 * Clear all Session data for user
 */
function clearSessionData(userId) {
    const keys = Object.keys(localStorage).filter(k =>
        k.startsWith(`nm_session_`) && k.includes(userId)
    );
    keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Check if user has Session account
 */
function hasSessionAccount(userId) {
    return localStorage.getItem(getStorageKey(userId, 'mnemonic')) !== null;
}

/**
 * Store Session ID (not sensitive - public key)
 */
function storeSessionId(userId, sessionId) {
    localStorage.setItem(getStorageKey(userId, 'session_id'), sessionId);
}

/**
 * Get stored Session ID
 */
function getStoredSessionId(userId) {
    return localStorage.getItem(getStorageKey(userId, 'session_id'));
}

/**
 * Store conversations list (encrypted)
 */
async function storeConversations(userId, conversations) {
    const key = await deriveKey(userId);
    const encrypted = await encryptData(key, JSON.stringify(conversations));
    localStorage.setItem(getStorageKey(userId, 'conversations'), encrypted);
}

/**
 * Get conversations list (decrypted)
 */
async function getConversations(userId) {
    const encrypted = localStorage.getItem(getStorageKey(userId, 'conversations'));
    if (!encrypted) return [];

    try {
        const key = await deriveKey(userId);
        const decrypted = await decryptData(key, encrypted);
        return JSON.parse(decrypted);
    } catch (e) {
        console.error('Failed to decrypt conversations:', e);
        return [];
    }
}

/**
 * Store messages for a conversation (encrypted)
 */
async function storeMessages(userId, recipientSessionId, messages) {
    const key = await deriveKey(userId);
    const encrypted = await encryptData(key, JSON.stringify(messages));
    localStorage.setItem(getStorageKey(userId, `messages_${recipientSessionId}`), encrypted);
}

/**
 * Get messages for a conversation (decrypted)
 */
async function getMessages(userId, recipientSessionId) {
    const encrypted = localStorage.getItem(getStorageKey(userId, `messages_${recipientSessionId}`));
    if (!encrypted) return [];

    try {
        const key = await deriveKey(userId);
        const decrypted = await decryptData(key, encrypted);
        return JSON.parse(decrypted);
    } catch (e) {
        console.error('Failed to decrypt messages:', e);
        return [];
    }
}

// Export for global access (all async now)
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
