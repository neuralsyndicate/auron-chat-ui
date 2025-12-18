// ============================================================
// ENCRYPTION UTILITIES - Frontend E2E Encryption
// ============================================================

// Encryption salt - must match BFF's ENCRYPTION_SALT
const ENCRYPTION_SALT = 'combryth-user-encryption-v1';

/**
 * Derive a user-specific encryption key using PBKDF2
 * This matches the BFF's derive_user_encryption_key() function
 * @param {string} userId - Logto user ID
 * @returns {Promise<CryptoKey>} AES-GCM encryption key
 */
async function deriveUserEncryptionKey(userId) {
    const encoder = new TextEncoder();

    // Import user ID as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive AES-256-GCM key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(ENCRYPTION_SALT),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,  // extractable for export if needed
        ['encrypt', 'decrypt']
    );
}

/**
 * Export a CryptoKey to base64 string (for storage/comparison)
 * @param {CryptoKey} key
 * @returns {Promise<string>} Base64-encoded key
 */
async function exportKeyToBase64(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    const bytes = new Uint8Array(exported);
    return btoa(String.fromCharCode(...bytes));
}

/**
 * Encrypt data using AES-256-GCM
 * @param {object} data - Data to encrypt (will be JSON stringified)
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<ArrayBuffer>} IV (12 bytes) + ciphertext
 */
async function encryptData(data, key) {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
    );

    // Prepend IV to ciphertext
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.length);

    return result.buffer;
}

/**
 * Decrypt data using AES-256-GCM
 * @param {ArrayBuffer} encryptedData - IV (12 bytes) + ciphertext
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<object>} Decrypted and parsed JSON data
 */
async function decryptData(encryptedData, key) {
    const data = new Uint8Array(encryptedData);

    // Extract IV and ciphertext
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    // Parse JSON
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
}

/**
 * Hash user ID for storage paths (SHA-256)
 * @param {string} userId - Logto user ID
 * @returns {Promise<string>} Hex-encoded hash
 */
async function hashUserId(userId) {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a conversation title from user message
 * @param {string} userMessage - First user message
 * @returns {string} Generated title (max 50 chars)
 */
function generateConversationTitle(userMessage) {
    if (!userMessage || typeof userMessage !== 'string') {
        return `Chat ${new Date().toLocaleDateString()}`;
    }

    // Clean and extract first ~6 words
    const cleaned = userMessage.trim().replace(/\s+/g, ' ');
    const words = cleaned.split(' ').slice(0, 6);
    let title = words.join(' ');

    // Truncate to 50 chars
    if (title.length > 50) {
        title = title.slice(0, 47) + '...';
    }

    // Fallback for very short messages
    if (title.length < 3) {
        return `Chat ${new Date().toLocaleDateString()}`;
    }

    return title;
}
