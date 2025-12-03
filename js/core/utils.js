// Helper function to get auth token
async function getAuthToken() {
    // First try localStorage (cached access token)
    let token = localStorage.getItem('auron_access_token');

    if (token) {
        return token;
    }

    // Get fresh access token from Logto with API resource
    try {
        token = await window.LogtoAuth.getAccessToken(DIALOGUE_API_BASE);
        if (token) {
            localStorage.setItem('auron_access_token', token);
            return token;
        }
    } catch (err) {
        console.warn('Could not get access token from Logto:', err);
    }

    return null;
}

// AES-256-GCM Decryption for conversations
async function decryptConversation(encryptedData, encryptionKeyB64) {
    try {
        // Decode base64 encryption key
        const keyBytes = Uint8Array.from(atob(encryptionKeyB64), c => c.charCodeAt(0));

        // Extract IV (first 12 bytes) and ciphertext
        const dataView = new Uint8Array(encryptedData);
        const iv = dataView.slice(0, 12);
        const ciphertext = dataView.slice(12);

        console.log('IV length:', iv.length);
        console.log('Ciphertext length:', ciphertext.length);
        console.log('Key length:', keyBytes.length);

        // Import encryption key
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // Decrypt using AES-256-GCM
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );

        // Parse decrypted JSON
        const jsonString = new TextDecoder().decode(decrypted);
        return JSON.parse(jsonString);

    } catch (err) {
        console.error('Decryption failed:', err);
        throw new Error(`Failed to decrypt conversation: ${err.message}`);
    }
}
