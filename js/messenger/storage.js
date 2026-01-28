// ============================================================
// SESSION MESSENGER - Encrypted Mnemonic Storage v3
// ============================================================

var STORAGE_VERSION = 'v2';
var SALT_STRING = 'nm-session-storage-salt-v1';

/**
 * Derive encryption key from userId using PBKDF2
 */
function deriveStorageKey(userId) {
    var encoder = new TextEncoder();
    var salt = encoder.encode(SALT_STRING);
    var userIdBytes = encoder.encode(userId);

    return window.crypto.subtle.importKey(
        'raw',
        userIdBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    ).then(function(keyMaterial) {
        return window.crypto.subtle.deriveKey(
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
 * Encrypt string data
 */
function encryptString(cryptoKey, plaintext) {
    var encoder = new TextEncoder();
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    var data = encoder.encode(plaintext);

    return window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        data
    ).then(function(ciphertext) {
        var cipherArray = new Uint8Array(ciphertext);
        var combined = new Uint8Array(12 + cipherArray.length);
        combined.set(iv, 0);
        combined.set(cipherArray, 12);

        // Convert to base64
        var binary = '';
        for (var i = 0; i < combined.length; i++) {
            binary += String.fromCharCode(combined[i]);
        }
        return btoa(binary);
    });
}

/**
 * Decrypt string data
 */
function decryptString(cryptoKey, encryptedBase64) {
    var binary = atob(encryptedBase64);
    var combined = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
    }

    var iv = combined.slice(0, 12);
    var ciphertext = combined.slice(12);

    return window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        ciphertext
    ).then(function(plaintext) {
        return new TextDecoder().decode(plaintext);
    });
}

function getStorageKey(userId, suffix) {
    return 'nm_session_' + STORAGE_VERSION + '_' + userId + '_' + suffix;
}

// ============================================================
// Public API
// ============================================================

window.SessionStorage = {

    storeMnemonic: function(userId, mnemonic) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, mnemonic);
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'mnemonic'), encrypted);
        });
    },

    getMnemonic: function(userId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'mnemonic'));
        if (!encrypted) {
            return Promise.resolve(null);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).catch(function(err) {
            console.error('Decrypt mnemonic failed:', err);
            return null;
        });
    },

    clearData: function(userId) {
        Object.keys(localStorage).forEach(function(k) {
            if (k.indexOf('nm_session_') === 0 && k.indexOf(userId) !== -1) {
                localStorage.removeItem(k);
            }
        });
    },

    hasAccount: function(userId) {
        return localStorage.getItem(getStorageKey(userId, 'mnemonic')) !== null;
    },

    storeSessionId: function(userId, sessionId) {
        localStorage.setItem(getStorageKey(userId, 'session_id'), sessionId);
    },

    getSessionId: function(userId) {
        return localStorage.getItem(getStorageKey(userId, 'session_id'));
    },

    storeConversations: function(userId, conversations) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, JSON.stringify(conversations));
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'conversations'), encrypted);
        });
    },

    getConversations: function(userId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'conversations'));
        if (!encrypted) {
            return Promise.resolve([]);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).then(function(decrypted) {
            return JSON.parse(decrypted);
        }).catch(function(err) {
            console.error('Decrypt conversations failed:', err);
            return [];
        });
    },

    storeMessages: function(userId, recipientId, messages) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, JSON.stringify(messages));
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'messages_' + recipientId), encrypted);
        });
    },

    getMessages: function(userId, recipientId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'messages_' + recipientId));
        if (!encrypted) {
            return Promise.resolve([]);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).then(function(decrypted) {
            return JSON.parse(decrypted);
        }).catch(function(err) {
            console.error('Decrypt messages failed:', err);
            return [];
        });
    },

    // ============================================================
    // Contact Management Storage
    // ============================================================

    /**
     * Store accepted contacts list
     * Contact structure: { sessionId, username, displayName, addedAt }
     */
    storeContacts: function(userId, contacts) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, JSON.stringify(contacts));
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'contacts'), encrypted);
        });
    },

    /**
     * Get accepted contacts list
     */
    getContacts: function(userId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'contacts'));
        if (!encrypted) {
            return Promise.resolve([]);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).then(function(decrypted) {
            return JSON.parse(decrypted);
        }).catch(function(err) {
            console.error('Decrypt contacts failed:', err);
            return [];
        });
    },

    /**
     * Store pending contact requests
     * Request structure: { sessionId, username, displayName, message, receivedAt, heldMessages }
     */
    storePendingRequests: function(userId, requests) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, JSON.stringify(requests));
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'pending_requests'), encrypted);
        });
    },

    /**
     * Get pending contact requests
     */
    getPendingRequests: function(userId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'pending_requests'));
        if (!encrypted) {
            return Promise.resolve([]);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).then(function(decrypted) {
            return JSON.parse(decrypted);
        }).catch(function(err) {
            console.error('Decrypt pending requests failed:', err);
            return [];
        });
    },

    /**
     * Store blocked session IDs list
     */
    storeBlockedIds: function(userId, blockedIds) {
        return deriveStorageKey(userId).then(function(key) {
            return encryptString(key, JSON.stringify(blockedIds));
        }).then(function(encrypted) {
            localStorage.setItem(getStorageKey(userId, 'blocked'), encrypted);
        });
    },

    /**
     * Get blocked session IDs list
     */
    getBlockedIds: function(userId) {
        var encrypted = localStorage.getItem(getStorageKey(userId, 'blocked'));
        if (!encrypted) {
            return Promise.resolve([]);
        }
        return deriveStorageKey(userId).then(function(key) {
            return decryptString(key, encrypted);
        }).then(function(decrypted) {
            return JSON.parse(decrypted);
        }).catch(function(err) {
            console.error('Decrypt blocked list failed:', err);
            return [];
        });
    }
};

console.log('SessionStorage v4 loaded');
