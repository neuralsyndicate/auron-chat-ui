// API Configuration
const API_CONFIG = {
    // Backend API (via Cloudflare Tunnel)
    DIALOGUE_API_BASE: 'https://api.neuralsyndicate.com',

    // BunnyCDN Pull Zone
    BUNNY_CDN_BASE: 'https://neural-neural-test-test.b-cdn.net',

    // Session management
    INACTIVITY_TIMEOUT: 5 * 60 * 1000,  // 5 minutes
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}
