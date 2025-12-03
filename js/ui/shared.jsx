// ===== SHARED UI COMPONENTS =====
// LoadingScreen, ThinkingPanel, UserAvatarDropdown, Blueprint panels

/* React Hooks (UMD) */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  useLayoutEffect,
  useContext
} = React;

// Stage configurations with unique particle behaviors
const UI_STAGE_CONFIG = {
    'complexity': {
        label: 'Deep Structure',
        color: 'rgba(0, 217, 255, 0.6)',
        particleCount: 30,
        connectionDistance: 100,
        speed: 0.6
    },
    'emotion': {
        label: 'Resonant Flow',
        color: 'rgba(138, 43, 226, 0.6)',
        particleCount: 20,
        connectionDistance: 110,
        speed: 0.4,
        flow: true
    },
    'domain': {
        label: 'Spatial Context',
        color: 'rgba(0, 217, 255, 0.6)',
        particleCount: 25,
        connectionDistance: 90,
        speed: 0.5,
        converge: true
    },
    'trigger': {
        label: 'Pattern Trace',
        color: 'rgba(0, 150, 255, 0.6)',
        particleCount: 28,
        connectionDistance: 105,
        speed: 0.45,
        geometric: true
    },
    'blueprint': {
        label: 'Framework Retrieval',
        color: 'rgba(147, 51, 234, 0.6)',
        particleCount: 22,
        connectionDistance: 95,
        speed: 0.55,
        pulse: true
    },
    'web_search': {
        label: 'Knowledge Archive',
        color: 'rgba(0, 217, 255, 0.6)',
        particleCount: 25,
        connectionDistance: 120,
        speed: 1.0,
        stream: true
    },
    'auron': {
        label: 'Neural Synthesis',
        color: 'rgba(0, 217, 255, 0.8)',
        particleCount: 30,
        connectionDistance: 100,
        speed: 0.6,
        neural: true
    }
};

// Loading Screen Component
function LoadingScreen() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Orbital Rings */}
                <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px'
                }}>
                    {/* Outer Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid rgba(0, 217, 255, 0.3)',
                        borderRadius: '50%',
                        animation: 'spin 3s linear infinite'
                    }} />

                    {/* Middle Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: '20px',
                        border: '2px solid rgba(0, 217, 255, 0.5)',
                        borderRadius: '50%',
                        borderTopColor: 'transparent',
                        borderLeftColor: 'transparent',
                        animation: 'spin 2s linear infinite reverse'
                    }} />

                    {/* Inner Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: '40px',
                        border: '2px solid rgba(0, 217, 255, 0.7)',
                        borderRadius: '50%',
                        borderRightColor: 'transparent',
                        borderBottomColor: 'transparent',
                        animation: 'spin 1.5s linear infinite'
                    }} />

                    {/* Center Brain Icon */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem',
                        animation: 'pulse 2s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 30px rgba(0, 217, 255, 0.8))'
                    }}>
                        🧠
                    </div>
                </div>

                {/* AURON Text */}
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#00D9FF',
                    textShadow: '0 0 30px rgba(0, 217, 255, 0.8), 0 0 60px rgba(0, 191, 255, 0.6)',
                    letterSpacing: '0.2em',
                    margin: 0
                }}>
                    AURON
                </h2>

                {/* Processing Text */}
                <p style={{
                    fontSize: '1.2rem',
                    color: '#00BFFF',
                    textShadow: '0 0 20px rgba(0, 217, 255, 0.6)',
                    fontWeight: '600',
                    margin: 0
                }}>
                    Processing{dots}
                </p>

                {/* Particle Dots */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem'
                }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#00D9FF',
                            boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)',
                            animation: `bounce 1.5s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// UserAvatarDropdown - Top-right user menu with avatar initial
function UserAvatarDropdown({ username }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    // Get first letter of username (uppercase)
    const initial = username.charAt(0).toUpperCase();

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(0, 217, 255, 0.1)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    color: '#00D9FF',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 20px rgba(0, 217, 255, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }
                }}
            >
                {initial}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: '200px',
                    background: 'rgba(10, 10, 31, 0.75)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0, 217, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    animation: 'slideDown 0.2s ease'
                }}>
                    {/* Username Header */}
                    <div style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid rgba(0, 217, 255, 0.08)',
                        marginBottom: '0.5rem'
                    }}>
                        <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: 0
                        }}>
                            {username}
                        </p>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            margin: '0.25rem 0 0 0'
                        }}>
                            Neural Music User
                        </p>
                    </div>

                    {/* Menu Items */}
                    {['👤 Profile', '⚙️ Settings', '📚 Reflections'].map((item, idx) => (
                        <button
                            key={idx}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 217, 255, 0.08)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            {item}
                        </button>
                    ))}

                    <div style={{
                        height: '1px',
                        background: 'rgba(0, 217, 255, 0.08)',
                        margin: '0.5rem 0'
                    }}></div>

                    <button
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'rgba(255, 100, 100, 0.7)',
                            fontSize: '0.875rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 100, 100, 0.1)';
                            e.currentTarget.style.color = 'rgba(255, 100, 100, 0.9)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255, 100, 100, 0.7)';
                        }}
                    >
                        🚪 Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}

// Fetch random inspirational quote from backend
async function fetchRandomQuote() {
    try {
        const response = await fetch(`${BFF_API_BASE}/get-quote`);
        const data = await response.json();

        if (data.status === 'success') {
            return {
                quote: data.quote,
                author: data.author,
                discipline: data.discipline
            };
        }

        // Fallback quote
        return {
            quote: "Creating your unique sonic identity...",
            author: "Auron",
            discipline: "AI Guide"
        };
    } catch (error) {
        console.error('Failed to fetch quote:', error);
        // Fallback quote
        return {
            quote: "Exploring the depths of your creative potential...",
            author: "Neural Music Blueprint",
            discipline: "Creative Framework"
        };
    }
}

// Add animation keyframes for ThinkingPanel
(function() {
    if (document.getElementById('thinking-panel-animations')) return;

    const thinkingPanelStyles = document.createElement('style');
    thinkingPanelStyles.id = 'thinking-panel-animations';
    thinkingPanelStyles.textContent = `
        @keyframes quoteFloat {
            0% { opacity: 0; transform: translateY(30px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.005); }
        }
        @keyframes shimmerThinking {
            0% { transform: rotate(0deg) scale(1.5); opacity: 0.2; }
            50% { opacity: 0.3; }
            100% { transform: rotate(360deg) scale(1.5); opacity: 0.2; }
        }
        @keyframes shimmerGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes floatingLight1 {
            0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.18; }
            50% { transform: translate(12%, -8%) scale(1.08); opacity: 0.26; }
        }
        @keyframes floatingLight2 {
            0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.22; }
            50% { transform: translate(-10%, 15%) scale(1.1); opacity: 0.28; }
        }
        @keyframes floatingLight3 {
            0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.20; }
            50% { transform: translate(8%, 10%) scale(1.06); opacity: 0.26; }
        }
        @keyframes floatingLight4 {
            0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.20; }
            50% { transform: translate(10%, -12%) scale(1.07); opacity: 0.28; }
        }
        @keyframes floatingLight5 {
            0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.19; }
            50% { transform: translate(-8%, 10%) scale(1.09); opacity: 0.27; }
        }
        @keyframes fadeInDelayed {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.96); }
            100% { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(thinkingPanelStyles);
})();

// ThinkingPanel - Philosophical Quotes Screen (Beautiful & Minimal)
function ThinkingPanel({ stage, progress, completedStages, isFading }) {
    const [quote, setQuote] = React.useState(null);

    // Fetch quote when panel first appears
    React.useEffect(() => {
        if (!quote) {
            fetchRandomQuote().then(setQuote);
        }
    }, []);

    return (
        <>
            {/* Dark professional backdrop */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.94)',
                backdropFilter: isFading ? 'blur(0px)' : 'blur(20px)',
                WebkitBackdropFilter: isFading ? 'blur(0px)' : 'blur(20px)',
                zIndex: 2000,
                opacity: isFading ? 0 : 1,
                transition: 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 1.2s ease'
            }} />

            {/* Animated shimmer gradient */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '180%',
                height: '180%',
                transform: isFading ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
                background: 'radial-gradient(circle at center, rgba(0, 13, 255, 0.22) 0%, rgba(0, 15, 255, 0.16) 20%, rgba(0, 13, 255, 0.1) 40%, transparent 60%)',
                filter: isFading ? 'blur(80px)' : 'blur(60px)',
                WebkitFilter: isFading ? 'blur(80px)' : 'blur(60px)',
                zIndex: 2000,
                opacity: isFading ? 0 : 1,
                animation: isFading ? 'none' : 'shimmerThinking 15s linear infinite',
                pointerEvents: 'none',
                transition: 'opacity 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
            }} />

            {/* Floating blue tints */}
            {[
                { top: '20%', left: '15%', size: 400, anim: 'floatingLight1', duration: '18s', delay: '0.7s' },
                { bottom: '15%', right: '20%', size: 500, anim: 'floatingLight2', duration: '14s', delay: '0.8s' },
                { top: '40%', right: '10%', size: 350, anim: 'floatingLight3', duration: '22s', delay: '0.9s' },
                { bottom: '25%', left: '20%', size: 420, anim: 'floatingLight4', duration: '20s', delay: '1.0s' },
                { top: '50%', left: '40%', size: 380, anim: 'floatingLight5', duration: '16s', delay: '1.1s' }
            ].map((tint, idx) => (
                <div key={idx} style={{
                    position: 'fixed',
                    top: tint.top,
                    bottom: tint.bottom,
                    left: tint.left,
                    right: tint.right,
                    width: `${tint.size}px`,
                    height: `${tint.size}px`,
                    background: `radial-gradient(circle, rgba(0, ${13 + idx * 2}, 255, ${0.22 + idx * 0.01}) 0%, transparent 70%)`,
                    filter: isFading ? 'blur(100px)' : 'blur(80px)',
                    zIndex: 2000,
                    opacity: isFading ? 0 : 1,
                    animation: isFading ? 'none' : `${tint.anim} ${tint.duration} ease-in-out infinite`,
                    pointerEvents: 'none',
                    transition: `opacity 2.5s cubic-bezier(0.16, 1, 0.3, 1) ${tint.delay}`
                }} />
            ))}

            {/* Full screen immersive layout */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2001,
                opacity: isFading ? 0 : 1,
                transform: isFading ? 'scale(0.98)' : 'scale(1)',
                transition: 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                gap: '4rem'
            }}>
                {/* Quote display */}
                {quote && (
                    <div style={{
                        maxWidth: '900px',
                        width: '100%',
                        textAlign: 'center',
                        padding: '0 2rem',
                        animation: isFading ? 'none' : 'fadeInScale 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both'
                    }}>
                        <div style={{
                            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
                            fontSize: '2rem',
                            fontWeight: '300',
                            lineHeight: '1.6',
                            color: 'rgba(255, 255, 255, 0.96)',
                            letterSpacing: '-0.02em',
                            marginBottom: '2.5rem',
                            fontStyle: 'italic',
                            textShadow: '0 2px 20px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 217, 255, 0.12)',
                            animation: isFading ? 'none' : 'fadeInDelayed 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both, breathe 8s ease-in-out infinite'
                        }}>
                            "{quote.quote}"
                        </div>
                        <div style={{
                            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            color: 'rgba(0, 217, 255, 0.96)',
                            letterSpacing: '0.05em',
                            textShadow: '0 0 24px rgba(0, 217, 255, 0.8), 0 0 12px rgba(0, 217, 255, 0.6)',
                            animation: isFading ? 'none' : 'fadeInDelayed 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s both'
                        }}>
                            — {quote.author}{quote.discipline && `, ${quote.discipline}`}
                        </div>
                    </div>
                )}

                {/* Progress section */}
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '0 2rem',
                    animation: isFading ? 'none' : 'fadeInDelayed 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both'
                }}>
                    {/* Progress bar */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #000DFF 0%, #00D9FF 60%, #00D9FF 100%)',
                            borderRadius: '2px',
                            transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
                            boxShadow: '0 0 28px rgba(0, 217, 255, 0.95), 0 0 56px rgba(0, 217, 255, 0.7), 0 0 10px rgba(255, 255, 255, 0.6) inset',
                            filter: 'brightness(1.1)'
                        }} />
                    </div>

                    {/* Progress percentage */}
                    <div style={{
                        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'rgba(0, 217, 255, 0.92)',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.08em',
                        textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 10px rgba(0, 217, 255, 0.6)',
                        transition: 'all 0.3s ease'
                    }}>
                        {Math.round(progress)}%
                    </div>
                </div>
            </div>
        </>
    );
}

// SSE Chat Helper - Handles streaming chat connection
async function connectSSEChat({
    message,
    sessionId,
    token,
    onProgress,
    onBlueprintRetrieved,
    onBlueprintSkipped,
    onAuronGenerating,
    onAuronToken,
    onAuronComplete,
    onComplete,
    onError
}) {
    try {
        console.log('🔄 Initiating SSE stream for message:', message.substring(0, 50) + '...');

        const initResponse = await fetch(`${DIALOGUE_API_BASE}/chat/stream`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                metadata: { session_id: sessionId || null }
            })
        });

        if (!initResponse.ok) {
            throw new Error(`Failed to initiate stream: ${initResponse.status}`);
        }

        const { session_id: sseSessionId, status } = await initResponse.json();
        console.log(`✅ SSE session created: ${sseSessionId}, status: ${status}`);

        const eventSourceUrl = `${DIALOGUE_API_BASE}/chat/stream/${sseSessionId}?token=${encodeURIComponent(token)}`;
        console.log('🔌 Connecting to EventSource:', eventSourceUrl);

        const eventSource = new EventSource(eventSourceUrl);
        let isComplete = false;

        // Handle all progress events
        const progressEvents = [
            'complexity_analyzing', 'complexity_complete',
            'emotion_analyzing', 'emotion_complete',
            'domain_analyzing', 'domain_complete',
            'trigger_analyzing', 'trigger_complete',
            'web_search_analyzing', 'web_search_complete'
        ];

        progressEvents.forEach(eventType => {
            eventSource.addEventListener(eventType, (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (onProgress) {
                        onProgress({
                            type: eventType,
                            data: data,
                            progress: SSE_STAGE_PROGRESS[eventType] || 0
                        });
                    }
                } catch (err) {
                    console.error(`Error parsing ${eventType} event:`, err);
                }
            });
        });

        // Handle Blueprint agent events
        eventSource.addEventListener('blueprint_retrieved', (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log('📘 SSE Event: blueprint_retrieved', data);
                if (onProgress) {
                    onProgress({
                        type: 'blueprint_retrieved',
                        data: data,
                        progress: SSE_STAGE_PROGRESS['blueprint_retrieved'] || 0
                    });
                }
                if (onBlueprintRetrieved) {
                    onBlueprintRetrieved(data);
                }
            } catch (err) {
                console.error('Error parsing blueprint_retrieved event:', err);
            }
        });

        eventSource.addEventListener('blueprint_skipped', (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log('📘 SSE Event: blueprint_skipped', data);
                if (onProgress) {
                    onProgress({
                        type: 'blueprint_skipped',
                        data: data,
                        progress: SSE_STAGE_PROGRESS['blueprint_skipped'] || 0
                    });
                }
                if (onBlueprintSkipped) {
                    onBlueprintSkipped(data);
                }
            } catch (err) {
                console.error('Error parsing blueprint_skipped event:', err);
            }
        });

        // Handle Auron token streaming events
        eventSource.addEventListener('auron_generating', (e) => {
            if (onAuronGenerating) onAuronGenerating();
        });

        eventSource.addEventListener('auron_token', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (onAuronToken) onAuronToken(data.token);
            } catch (err) {
                console.error('Error parsing auron_token event:', err);
            }
        });

        eventSource.addEventListener('auron_complete', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (onAuronComplete) onAuronComplete(data);
            } catch (err) {
                console.error('Error parsing auron_complete event:', err);
            }
        });

        // Handle complete event
        eventSource.addEventListener('complete', (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log('✅ SSE Complete:', data);
                isComplete = true;
                eventSource.close();
                if (onComplete) onComplete(data.result);
            } catch (err) {
                console.error('Error parsing complete event:', err);
                eventSource.close();
                if (onError) onError(new Error('Failed to parse final result'));
            }
        });

        // Handle error events
        eventSource.addEventListener('error_event', (e) => {
            try {
                const data = JSON.parse(e.data);
                console.error('❌ SSE Error Event:', data);
                eventSource.close();
                if (onError) onError(new Error(data.error || 'Unknown error'));
            } catch (err) {
                console.error('Error parsing error event:', err);
            }
        });

        eventSource.onerror = (error) => {
            if (!isComplete) {
                console.error('❌ EventSource connection error:', error);
                eventSource.close();
                if (onError) onError(new Error('SSE connection failed'));
            }
        };

        eventSource.addEventListener('ping', (e) => {
            console.log('💓 SSE Keepalive ping received');
        });

        // Connection timeout (60 seconds)
        const timeout = setTimeout(() => {
            if (!isComplete) {
                console.error('⏱️ SSE connection timeout');
                eventSource.close();
                if (onError) onError(new Error('Connection timeout'));
            }
        }, 60000);

        return () => {
            clearTimeout(timeout);
            if (!isComplete) eventSource.close();
        };

    } catch (error) {
        console.error('❌ Failed to connect SSE:', error);
        if (onError) onError(error);
        return () => {};
    }
}

// Blueprint Modal - Centered modal with hero image
function BlueprintFloatingPanel({ sources, isOpen, onClose }) {
    if (!sources || sources.length === 0 || !isOpen) return null;

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.92)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.4s ease'
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '600px',
                        maxWidth: '90vw',
                        maxHeight: '85vh',
                        background: 'rgba(10, 10, 31, 0.65)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        border: '2px solid rgba(0, 217, 255, 0.4)',
                        borderRadius: '0',
                        boxShadow: `0 0 0 1px rgba(0, 217, 255, 0.1) inset, 0 24px 60px 0 rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 217, 255, 0.6), 0 0 80px rgba(0, 217, 255, 0.4), 0 0 120px rgba(0, 191, 255, 0.3)`,
                        overflow: 'hidden',
                        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Hero Image */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '350px',
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, rgba(0, 50, 100, 0.3) 0%, rgba(10, 10, 31, 0.8) 100%)'
                    }}>
                        <img
                            src="brain.webp"
                            alt="Neural Music Blueprint"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center center',
                                opacity: 0.9
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '100px',
                            background: 'linear-gradient(to top, rgba(10, 10, 31, 0.9), transparent)'
                        }}></div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '2rem',
                            fontWeight: '200',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1',
                            padding: '0',
                            zIndex: 10
                        }}
                    >
                        <span style={{ display: 'block', transform: 'translateY(-1px)' }}>×</span>
                    </button>

                    {/* Scrollable Content */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '2rem'
                    }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{
                                fontSize: '0.9375rem',
                                color: 'rgba(255, 255, 255, 0.75)',
                                margin: '0 0 1.25rem 0',
                                lineHeight: '1.6',
                                fontStyle: 'italic'
                            }}>
                                Auron explored the Neural Music Blueprint to craft this guidance specifically for your creative journey.
                            </p>
                            <p style={{
                                fontSize: '1rem',
                                color: 'rgba(255, 255, 255, 0.9)',
                                margin: '0 0 1.5rem 0',
                                lineHeight: '1.7'
                            }}>
                                A creative system designed to help artists uncover and express their <strong style={{ color: 'rgba(0, 217, 255, 0.95)' }}>unique sonic identity</strong> using neuroscience, psychology, music, sound and creativity.
                            </p>
                            <button style={{
                                padding: '0.75rem 1.5rem',
                                background: 'rgba(0, 217, 255, 0.1)',
                                border: '1px solid rgba(0, 217, 255, 0.4)',
                                borderRadius: '0',
                                color: 'rgba(0, 217, 255, 0.95)',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Unlock Your Creative Journey
                            </button>
                        </div>

                        <div style={{
                            height: '2px',
                            background: 'linear-gradient(to right, transparent, rgba(0, 217, 255, 0.4), transparent)',
                            margin: '2rem 0'
                        }}></div>

                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: 'rgba(0, 217, 255, 0.9)',
                                margin: '0 0 1.25rem 0',
                                letterSpacing: '0.02em'
                            }}>
                                Blueprint Sources
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {sources.map((source, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem 1.25rem',
                                            background: 'rgba(0, 217, 255, 0.04)',
                                            borderLeft: '3px solid rgba(0, 217, 255, 0.3)',
                                            border: '1px solid rgba(0, 217, 255, 0.15)'
                                        }}
                                    >
                                        <div style={{
                                            minWidth: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: 'rgba(0, 217, 255, 0.7)',
                                            background: 'rgba(0, 217, 255, 0.1)',
                                            borderRadius: '50%'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <p style={{
                                            fontSize: '0.9375rem',
                                            fontWeight: '500',
                                            color: 'rgba(255, 255, 255, 0.95)',
                                            margin: 0,
                                            flex: 1
                                        }}>
                                            {source.page_title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Blueprint Corner Ribbon
function BlueprintCornerRibbon({ sources, onOpenPanel }) {
    const [isHovering, setIsHovering] = React.useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div
            onClick={() => { if (onOpenPanel) onOpenPanel(); }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
                position: 'absolute',
                top: '0',
                right: '0',
                cursor: 'pointer',
                zIndex: 10
            }}
        >
            <div style={{
                position: 'relative',
                padding: '0.5rem 1.25rem',
                paddingRight: '1.5rem',
                background: isHovering
                    ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.25) 0%, rgba(0, 150, 255, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 217, 255, 0.15) 0%, rgba(0, 150, 255, 0.1) 100%)',
                borderBottomLeftRadius: '12px',
                borderTopRightRadius: '20px',
                boxShadow: isHovering
                    ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 217, 255, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', opacity: isHovering ? 1 : 0.9 }}>📘</span>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: 'rgba(0, 217, 255, 0.95)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        textShadow: isHovering ? '0 0 8px rgba(0, 217, 255, 0.4)' : 'none',
                        transition: 'all 0.3s ease'
                    }}>
                        Neural Music: Blueprint
                    </span>
                </div>
            </div>
        </div>
    );
}

// Blueprint Trigger Bar
function BlueprintSourceHoverSection({ sources, onOpenPanel, onClosePanel }) {
    const [isHovering, setIsHovering] = React.useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div
            style={{ marginBottom: '2rem', paddingTop: '1rem', position: 'relative' }}
            onMouseEnter={() => { setIsHovering(true); if (onOpenPanel) onOpenPanel(); }}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: isHovering ? 'rgba(0, 217, 255, 0.1)' : 'rgba(0, 217, 255, 0.05)',
                    border: `1px solid ${isHovering ? 'rgba(0, 217, 255, 0.3)' : 'rgba(0, 217, 255, 0.15)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isHovering ? '0 0 16px rgba(0, 217, 255, 0.2)' : 'none'
                }}
            >
                <span style={{ fontSize: '1rem', opacity: 0.8 }}>📘</span>
                <div style={{ flex: 1 }}>
                    <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)',
                        margin: 0,
                        letterSpacing: '0.01em'
                    }}>
                        This message contains information about the Neural Music Blueprint
                    </p>
                </div>
                <span style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0, 217, 255, 0.7)',
                    transition: 'transform 0.3s ease'
                }}>
                    →
                </span>
            </div>
        </div>
    );
}

// Blueprint Source Card
function BlueprintSourceCard({ source, index }) {
    const similarityPercent = Math.round((source.similarity || 0) * 100);

    return (
        <div style={{
            background: 'rgba(0, 217, 255, 0.04)',
            border: '1px solid rgba(0, 217, 255, 0.12)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.75rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>📘</span>
                <h5 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'rgba(0, 217, 255, 0.9)',
                    margin: 0
                }}>
                    {source.page_title}
                </h5>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: similarityPercent >= 90 ? 'rgba(0, 217, 255, 0.9)'
                        : similarityPercent >= 80 ? 'rgba(0, 150, 255, 0.8)'
                        : 'rgba(255, 255, 255, 0.6)',
                    padding: '0.25rem 0.5rem',
                    background: similarityPercent >= 90 ? 'rgba(0, 217, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    marginLeft: 'auto'
                }}>
                    {similarityPercent}%
                </div>
            </div>
            {source.heading_path && (
                <p style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: '0.25rem 0 0 1.25rem'
                }}>
                    {source.heading_path}
                </p>
            )}
        </div>
    );
}
