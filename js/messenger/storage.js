// ============================================================
// SESSION MESSENGER - Encrypted Mnemonic Storage
// ============================================================

/**
 * Storage with client-side encryption using WebCrypto
 * Mnemonic is encrypted with a key derived from userId
 */

const STORAGE_VERSION = 'v2';

/**
 * Derive encryption key from userId using PBKDF2
 */
function deriveKey(userId) {
    const encoder = new TextEncoder();
    const salt = encoder.encode('nm-session-storage-salt-v1');

    return crypto.subtle.importKey(
        'raw',
        encoder.encode(userId),
        'PBKDF2',
        false,
        ['deriveKey']
    ).then(function(keyMaterial) {
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
    });
}

/**
 * Encrypt data with AES-GCM
 */
function encryptData(cryptoKey, plaintext) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    return crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        encoder.encode(plaintext)
    ).then(function(ciphertext) {
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);
        return btoa(String.fromCharCode.apply(null, combined));
    });
}

/**
 * Decrypt data with AES-GCM
 */
function decryptData(cryptoKey, encryptedBase64) {
    var combined = Uint8Array.from(atob(encryptedBase64), function(c) { return c.charCodeAt(0); });
    var iv = combined.slice(0, 12);
    var ciphertext = combined.slice(12);

    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        ciphertext
    ).then(function(plaintext) {
        return new TextDecoder().decode(plaintext);
    });
}

function getStorageKey(userId, suffix) {
    if (!userId) throw new Error('User ID required for Session storage');
    return 'nm_session_' + STORAGE_VERSION + '_' + userId + '_' + suffix;
}

/**
 * Store mnemonic (encrypted)
 */
function storeSessionMnemonic(userId, mnemonic) {
    return deriveKey(userId).then(function(key) {
        return encryptData(key, mnemonic);
    }).then(function(encrypted) {
        localStorage.setItem(getStorageKey(userId, 'mnemonic'), encrypted);
    });
}

/**
 * Get mnemonic (decrypted)
 */
function getSessionMnemonic(userId) {
    var encrypted = localStorage.getItem(getStorageKey(userId, 'mnemonic'));
    if (!encrypted) return Promise.resolve(null);

    return deriveKey(userId).then(function(key) {
        return decryptData(key, encrypted);
    }).catch(function(e) {
        console.error('Failed to decrypt mnemonic:', e);
        return null;
    });
}

/**
 * Clear all Session data for user
 */
function clearSessionData(userId) {
    var keys = Object.keys(localStorage).filter(function(k) {
        return k.startsWith('nm_session_') && k.includes(userId);
    });
    keys.forEach(function(k) { localStorage.removeItem(k); });
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
function storeConversations(userId, conversations) {
    return deriveKey(userId).then(function(key) {
        return encryptData(key, JSON.stringify(conversations));
    }).then(function(encrypted) {
        localStorage.setItem(getStorageKey(userId, 'conversations'), encrypted);
    });
}

/**
 * Get conversations list (decrypted)
 */
function getConversations(userId) {
    var encrypted = localStorage.getItem(getStorageKey(userId, 'conversations'));
    if (!encrypted) return Promise.resolve([]);

    return deriveKey(userId).then(function(key) {
        return decryptData(key, encrypted);
    }).then(function(decrypted) {
        return JSON.parse(decrypted);
    }).catch(function(e) {
        console.error('Failed to decrypt conversations:', e);
        return [];
    });
}

/**
 * Store messages for a conversation (encrypted)
 */
function storeMessages(userId, recipientSessionId, messages) {
    return deriveKey(userId).then(function(key) {
        return encryptData(key, JSON.stringify(messages));
    }).then(function(encrypted) {
        localStorage.setItem(getStorageKey(userId, 'messages_' + recipientSessionId), encrypted);
    });
}

/**
 * Get messages for a conversation (decrypted)
 */
function getMessages(userId, recipientSessionId) {
    var encrypted = localStorage.getItem(getStorageKey(userId, 'messages_' + recipientSessionId));
    if (!encrypted) return Promise.resolve([]);

    return deriveKey(userId).then(function(key) {
        return decryptData(key, encrypted);
    }).then(function(decrypted) {
        return JSON.parse(decrypted);
    }).catch(function(e) {
        console.error('Failed to decrypt messages:', e);
        return [];
    });
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
