// ============================================================
// DASHBOARD - Main Application Root
// ============================================================

function Dashboard() {
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('chat');
    const [conversationCount, setConversationCount] = useState(0);
    const [profileUnlocked, setProfileUnlocked] = useState(false);
    const [loadedSessionId, setLoadedSessionId] = useState(null);

    // Session management for sync button
    const [sessionId, setSessionId] = useState(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        // Check Logto authentication
        async function checkAuth() {
            try {
                const isAuth = await window.LogtoAuth.isAuthenticated();

                if (!isAuth) {
                    console.log('Not authenticated - redirecting to login...');
                    window.location.href = 'login.html';
                    return;
                }

                // Get user info from Logto
                const userInfo = await window.LogtoAuth.getUserInfo();
                if (userInfo) {
                    console.log('User authenticated:', userInfo.username);
                    setUser(userInfo);

                    // Store for backwards compatibility
                    localStorage.setItem('auron_user', JSON.stringify(userInfo));
                } else {
                    throw new Error('Failed to get user info');
                }

            } catch (err) {
                console.error('Auth check failed:', err);
                window.location.href = 'login.html';
            }
        }

        checkAuth();
    }, []);

    useEffect(() => {
        // Update progress when user is loaded
        if (user) {
            updateProgress();
            checkForUnsyncedSessions();
        }
    }, [user]);

    // Check for unsynced sessions on page load (Option B from spec)
    const checkForUnsyncedSessions = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${DIALOGUE_API_BASE}/active-sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const { has_unsynced, sessions } = await response.json();

                if (has_unsynced && sessions && sessions.length > 0) {
                    // Enable sync button with the first unsynced session
                    setSessionId(sessions[0].session_id);
                    console.log(`Found unsynced session: ${sessions[0].session_id}`);
                }
            }
        } catch (err) {
            console.error('Failed to check for unsynced sessions:', err);
        }
    };

    const updateProgress = async () => {
        if (!user) return;

        // Admin override: always unlock for user 'trasted'
        const isAdmin = user.username === 'trasted' || user.id.includes('trasted');

        if (isAdmin) {
            setProfileUnlocked(true);
            setConversationCount(0);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/profile/${user.id}`);
            if (response.ok) {
                const profile = await response.json();
                const count = profile.conversation_count || 0;
                setConversationCount(count);
                setProfileUnlocked(count >= UNLOCK_THRESHOLD);
            }
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const handleLogout = async () => {
        try {
            console.log('Signing out...');
            await window.LogtoAuth.signOut();
            // Logto will redirect to index.html (configured as post-signout URI)
        } catch (err) {
            console.error('Sign out failed:', err);
            // Fallback: clear storage and redirect manually
            localStorage.removeItem('auron_user');
            localStorage.removeItem('auron_auth_token');
            window.location.href = 'index.html';
        }
    };

    // Save session to backend (triggers pattern extraction)
    const saveSession = useCallback(async () => {
        if (!sessionId) return;
        if (syncing) return;  // Prevent duplicate saves

        try {
            setSyncing(true);
            const token = await getAuthToken();
            if (!token) {
                console.warn('No auth token - cannot save session');
                setSyncing(false);
                return;
            }

            console.log(`Saving session: ${sessionId}`);
            const response = await fetch(`${DIALOGUE_API_BASE}/save-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: sessionId })
            });

            if (response.ok) {
                console.log('Session saved successfully');
                updateProgress();  // Refresh conversation count
            } else {
                console.error('Failed to save session:', response.status);
            }

            // Clear session after save
            setSessionId(null);

        } catch (err) {
            console.error('Failed to save session:', err);
        } finally {
            setSyncing(false);
        }
    }, [sessionId, syncing]);

    // Manual sync handler
    const handleManualSync = useCallback(async () => {
        if (!sessionId || syncing) return;
        console.log('Manual sync triggered');
        await saveSession();
    }, [sessionId, syncing, saveSession]);

    if (!user) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Professional Header Navigation (Neural Music style - dark theme) */}
            <header className="fixed top-0 w-full glass border-b border-white/5 z-50">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight" style={{
                            color: '#00D9FF',
                            textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 191, 255, 0.6), 0 0 60px rgba(0, 153, 255, 0.4)'
                        }}>
                            AURON
                        </h1>
                    </div>

                    {/* Navigation + Progress */}
                    <nav className="flex items-center gap-8">
                        <button
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                currentView === 'chat'
                                    ? 'bg-white/5 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => setCurrentView('chat')}>
                            Dialogue
                        </button>

                        <button
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                currentView === 'reflections'
                                    ? 'bg-white/5 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => setCurrentView('reflections')}>
                            Reflections
                        </button>

                        <button
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                !profileUnlocked && 'opacity-50 cursor-not-allowed'
                            } ${
                                currentView === 'profile'
                                    ? 'bg-white/5 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => profileUnlocked && setCurrentView('profile')}>
                            Profile {profileUnlocked ? '' : ''}
                        </button>

                        {/* Progress Indicator */}
                        <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/5">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {conversationCount} / {UNLOCK_THRESHOLD}
                            </span>
                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min((conversationCount / UNLOCK_THRESHOLD) * 100, 100)}%`,
                                        background: 'linear-gradient(90deg, #00D9FF 0%, #00BFFF 100%)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sync Button */}
                        <button
                            onClick={handleManualSync}
                            disabled={!sessionId || syncing}
                            className="px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                background: sessionId && !syncing ? 'rgba(0, 217, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                                color: sessionId && !syncing ? '#00D9FF' : '#666',
                                border: `1px solid ${sessionId && !syncing ? 'rgba(0, 217, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)'}`
                            }}
                            title={!sessionId ? 'No conversation to sync' : syncing ? 'Syncing...' : 'Save conversation to Reflections'}>
                            {syncing ? 'Syncing...' : 'Sync'}
                        </button>

                        {/* User Avatar with Dropdown */}
                        <UserAvatarDropdown username={user.username || 'user'} />

                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-400 hover:text-white transition-colors">
                            Sign Out
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content - Generous whitespace, centered */}
            <main className="flex-1 pt-24 overflow-hidden">
                {currentView === 'chat' ? (
                    <ChatView
                        user={user}
                        onUpdateProgress={updateProgress}
                        loadedSessionId={loadedSessionId}
                        sessionId={sessionId}
                        setSessionId={setSessionId}
                        setSyncing={setSyncing}
                    />
                ) : currentView === 'reflections' ? (
                    <ReflectionsView user={user} setCurrentView={setCurrentView} setLoadedSessionId={setLoadedSessionId} />
                ) : (
                    <ProfileView user={user} isLocked={!profileUnlocked} conversationCount={conversationCount} />
                )}
            </main>

            {/* Reflection Viewer Modal (Full Screen) */}
            {loadedSessionId && (
                <ReflectionViewer
                    conversationId={loadedSessionId}
                    onClose={() => setLoadedSessionId(null)}
                    setSessionId={setSessionId}
                />
            )}
        </div>
    );
}

// ============================================================
// RENDER APPLICATION
// ============================================================
ReactDOM.render(<Dashboard />, document.getElementById('root'));
