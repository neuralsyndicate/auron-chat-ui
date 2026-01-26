// Centralized authenticated fetch with automatic 401 retry
// Safety net for token expiration during requests

let isRefreshing = false;
let refreshPromise = null;

// Force token refresh from Logto SDK
async function forceTokenRefresh() {
    if (isRefreshing) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            // Clear stale cached token
            localStorage.removeItem('auron_access_token');

            // Get fresh token from Logto SDK (triggers refresh if needed)
            const token = await window.LogtoAuth.getAccessToken(DIALOGUE_API_BASE);

            if (token) {
                localStorage.setItem('auron_access_token', token);
                console.log('Token refreshed successfully');
                return token;
            }

            return null;
        } catch (err) {
            console.error('Token refresh failed:', err);
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// Authenticated fetch with automatic 401 retry
async function authFetch(url, options = {}) {
    const token = await getAuthToken();

    if (!token) {
        console.warn('No auth token available');
        throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    // Handle 401 - attempt token refresh and retry
    if (response.status === 401) {
        console.log('401 received, attempting token refresh...');

        const freshToken = await forceTokenRefresh();

        if (!freshToken) {
            console.warn('Token refresh failed, session truly expired');
            // Session is truly expired - sign out gracefully
            try {
                await window.LogtoAuth.signOut();
            } catch (e) {
                // Fallback: clear storage and redirect
                localStorage.removeItem('auron_user');
                localStorage.removeItem('auron_access_token');
                window.location.href = 'login.html';
            }
            return response;
        }

        // Retry original request with fresh token
        console.log('Retrying request with fresh token...');
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${freshToken}`
            }
        });
    }

    // Handle 503 - auth service temporarily unavailable, retry after delay
    if (response.status === 503) {
        console.log('503 - auth service unavailable, retrying in 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryToken = await getAuthToken();
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${retryToken}`
            }
        });
    }

    return response;
}

// Export to global scope
window.authFetch = authFetch;
window.forceTokenRefresh = forceTokenRefresh;
