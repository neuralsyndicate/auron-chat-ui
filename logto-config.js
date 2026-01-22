// Logto Configuration for Auron
// Browser SDK - works with CDN-based setup

const LOGTO_CONFIG = {
    endpoint: 'https://auth.neuralsyndicate.com/',
    appId: 'a5m87e4osv2y7vv8asbwu',
    // API Resource for secure access tokens (OAuth2 best practice)
    resources: ['https://api.neuralsyndicate.com'],  // Auron Backend API
    scopes: ['read:conversations', 'write:conversations', 'read:profile']
};

const REDIRECT_URI = 'https://neural-neural-test-test.b-cdn.net/callback.html';
const POST_SIGNOUT_URI = 'https://neural-neural-test-test.b-cdn.net';

// Logto Client Instance (will be initialized when SDK loads)
let logtoClient = null;

// Initialize Logto Client
async function initLogto() {
    if (logtoClient) return logtoClient;

    // Wait for LogtoClient to be available from CDN (may take a moment with ES modules)
    if (typeof window.LogtoClient === 'undefined') {
        // Wait up to 5 seconds for LogtoClient to load
        for (let i = 0; i < 50; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (typeof window.LogtoClient !== 'undefined') {
                break;
            }
        }

        if (typeof window.LogtoClient === 'undefined') {
            throw new Error('Logto SDK not loaded. Make sure to include it via <script> tag.');
        }
    }

    logtoClient = new window.LogtoClient({
        endpoint: LOGTO_CONFIG.endpoint,
        appId: LOGTO_CONFIG.appId,
        resources: LOGTO_CONFIG.resources,
        scopes: LOGTO_CONFIG.scopes
    });
    return logtoClient;
}

// Check if user is authenticated
async function isAuthenticated() {
    try {
        const client = await initLogto();
        return await client.isAuthenticated();
    } catch (err) {
        console.error('Auth check failed:', err);
        return false;
    }
}

// Sign In
async function signIn() {
    try {
        const client = await initLogto();
        await client.signIn(REDIRECT_URI);
    } catch (err) {
        console.error('Sign in failed:', err);
        throw err;
    }
}

// Sign Up (Register) - forces registration screen
async function signUp() {
    try {
        const client = await initLogto();
        // Use firstScreen parameter to show register screen directly
        await client.signIn({
            redirectUri: REDIRECT_URI,
            firstScreen: 'register'  // Shows sign-up page directly
        });
    } catch (err) {
        console.error('Sign up failed:', err);
        throw err;
    }
}

// Sign Out
async function signOut() {
    // Clear local storage FIRST, before Logto redirect
    // This ensures clean state even if the OAuth logout flow fails
    localStorage.removeItem('auron_user');
    localStorage.removeItem('auron_auth_token');
    localStorage.removeItem('auron_access_token');
    localStorage.removeItem('auron_id_token');

    // Clear all Logto-related storage (handles old sessions, PKCE state, etc.)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('logto') || key.includes('oidc')) {
            localStorage.removeItem(key);
        }
    });

    try {
        const client = await initLogto();
        // Let Logto handle the redirect - it will clear server-side session
        await client.signOut(POST_SIGNOUT_URI);
        // Note: If signOut() succeeds, it redirects and code below never runs
    } catch (err) {
        console.error('Sign out from Logto failed:', err);
        // Only redirect manually if Logto SDK fails
        // (local storage already cleared above)
        window.location.href = POST_SIGNOUT_URI;
    }
}

// Handle Sign-In Callback (call this on callback page)
async function handleSignInCallback() {
    try {
        const client = await initLogto();
        await client.handleSignInCallback(window.location.href);
        console.log('✓ Sign-in callback handled successfully');
    } catch (err) {
        console.error('Callback handling failed:', err);
        throw err;
    }
}

// Get Access Token (for API calls)
async function getAccessToken(resource) {
    try {
        const client = await initLogto();
        const token = await client.getAccessToken(resource);
        return token;
    } catch (err) {
        console.error('Failed to get access token:', err);

        // Fallback: try to get ID token instead
        try {
            const client = await initLogto();  // Re-initialize client for fallback
            const idToken = await client.getIdToken();
            return idToken;
        } catch (idErr) {
            console.error('Failed to get ID token:', idErr);
            throw err;
        }
    }
}

// Get User Info
async function getUserInfo() {
    try {
        const client = await initLogto();
        const isAuth = await client.isAuthenticated();

        if (!isAuth) {
            return null;
        }

        // Get ID token claims (contains user info)
        const claims = await client.getIdTokenClaims();

        return {
            id: claims.sub,
            username: claims.username || claims.email?.split('@')[0] || 'User',
            email: claims.email || '',
            name: claims.name || claims.username || 'User',
            picture: claims.picture || '',
            // Store raw claims for debugging
            _claims: claims
        };
    } catch (err) {
        console.error('Failed to get user info:', err);
        return null;
    }
}

// Check authentication on page load and redirect if needed
async function requireAuth() {
    const isAuth = await isAuthenticated();

    if (!isAuth) {
        console.log('Not authenticated - redirecting to login...');
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    window.LogtoAuth = {
        initLogto,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        handleSignInCallback,
        getAccessToken,
        getUserInfo,
        requireAuth,
    };
}
