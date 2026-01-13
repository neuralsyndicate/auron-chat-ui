// Session Keep-Alive Manager
// Proactively refreshes tokens to prevent session expiration

let isInitialized = false;
let visibilityHandler = null;

function initSessionManager() {
    if (isInitialized) {
        console.log('Session manager already initialized');
        return;
    }

    // Refresh token when user returns to tab after being away
    visibilityHandler = async () => {
        if (document.visibilityState === 'visible') {
            console.log('Tab focused, proactively refreshing token...');
            try {
                // Clear cached token and get fresh from Logto SDK
                localStorage.removeItem('auron_access_token');
                await getAuthToken();
            } catch (err) {
                console.warn('Token refresh on tab focus failed:', err);
            }
        }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    isInitialized = true;
    console.log('Session manager initialized - will refresh token on tab focus');
}

function stopSessionManager() {
    if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
    }
    isInitialized = false;
    console.log('Session manager stopped');
}

// Export to global scope
window.initSessionManager = initSessionManager;
window.stopSessionManager = stopSessionManager;
