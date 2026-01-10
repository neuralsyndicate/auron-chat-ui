// ===== SHARED UI COMPONENTS - Neural Music v0.5 =====
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
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.4s ease'
        }}>
            <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Orbital Rings - Softer glow */}
                <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px'
                }}>
                    {/* Outer Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '50%',
                        animation: 'spin 4s linear infinite'
                    }} />

                    {/* Middle Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '50%',
                        borderTopColor: 'transparent',
                        borderLeftColor: 'transparent',
                        animation: 'spin 3s linear infinite reverse'
                    }} />

                    {/* Inner Ring */}
                    <div style={{
                        position: 'absolute',
                        inset: '40px',
                        border: '1px solid rgba(96, 165, 250, 0.4)',
                        borderRadius: '50%',
                        borderRightColor: 'transparent',
                        borderBottomColor: 'transparent',
                        animation: 'spin 2s linear infinite'
                    }} />

                    {/* Center Brain Icon */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem',
                        animation: 'pulse 3s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.3))'
                    }}>
                        🧠
                    </div>
                </div>

                {/* AURON Text */}
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    color: '#60A5FA',
                    textShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                    letterSpacing: '0.2em',
                    margin: 0
                }}>
                    AURON
                </h2>

                {/* Processing Text */}
                <p style={{
                    fontSize: '1.2rem',
                    color: '#3B82F6',
                    textShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
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
                            background: '#60A5FA',
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
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
function UserAvatarDropdown({ username, onOpenMemory, onNavigate }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    // Menu items with click handlers
    const menuItems = [
        { label: '👤 Profile', action: () => onNavigate?.('profile') },
        { label: '🧠 Memory', action: () => onOpenMemory?.() },
        { label: '⚙️ Settings', action: null },
        { label: '📚 Reflections', action: () => onNavigate?.('reflections') }
    ];

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
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isOpen ? '0 0 30px rgba(59, 130, 246, 0.15)' : 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
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
                    background: 'rgba(15, 20, 30, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(59, 130, 246, 0.08)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 0 60px rgba(59, 130, 246, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    animation: 'slideDown 0.3s ease'
                }}>
                    {/* Username Header */}
                    <div style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.06)',
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
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (item.action) {
                                    item.action();
                                    setIsOpen(false);
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: item.action ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                                cursor: item.action ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                                if (item.action) {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = item.action ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)';
                            }}
                        >
                            {item.label}
                        </button>
                    ))}

                    <div style={{
                        height: '1px',
                        background: 'rgba(59, 130, 246, 0.06)',
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
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 100, 100, 0.08)';
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

// BioGlowPlaceholder - Inline loading indicator for conversation stream
function BioGlowPlaceholder({ isVisible }) {
    if (!isVisible) return null;

    return (
        <div className="bio-glow-placeholder" style={{ animation: 'streamFadeIn 0.5s ease' }}>
            <div className="bio-glow-placeholder__text">
                <span className="bio-glow-placeholder__dots">
                    <span className="bio-glow-placeholder__dot"></span>
                    <span className="bio-glow-placeholder__dot"></span>
                    <span className="bio-glow-placeholder__dot"></span>
                </span>
            </div>
        </div>
    );
}

// SSE Chat Helper - Handles streaming chat connection
async function connectSSEChat({
    message,
    sessionId,
    token,
    conversationHistory,  // Array of {role, content} for context
    onProgress,
    onBlueprintRetrieved,
    onBlueprintSkipped,
    onAuronGenerating,
    onAuronThinking,      // NEW: GLM-4.6 reasoning tokens
    onAuronToken,
    onAuronComplete,
    onComplete,
    onError
}) {
    try {
        console.log('🔄 Initiating SSE stream for message:', message.substring(0, 50) + '...');
        if (conversationHistory?.length > 0) {
            console.log('📜 Sending conversation history:', conversationHistory.length, 'messages');
        }

        const initResponse = await fetch(`${DIALOGUE_API_BASE}/chat/stream`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversation_history: conversationHistory || [],
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
            'blueprint_analyzing',  // Added: blueprint search stage
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

        // NEW: Handle GLM-4.6 thinking/reasoning tokens
        eventSource.addEventListener('auron_thinking', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (onAuronThinking) onAuronThinking(data.token);
            } catch (err) {
                console.error('Error parsing auron_thinking event:', err);
            }
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
                // Include sseSessionId in result for frontend conversation saving
                const resultWithSession = {
                    ...data.result,
                    metadata: {
                        ...(data.result?.metadata || {}),
                        session_id: sseSessionId
                    }
                };
                if (onComplete) onComplete(resultWithSession);
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
                    background: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(16px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.5s ease'
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '600px',
                        maxWidth: '90vw',
                        maxHeight: '85vh',
                        background: 'rgba(15, 20, 30, 0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        borderRadius: '16px',
                        boxShadow: `0 0 100px rgba(59, 130, 246, 0.08), 0 32px 64px rgba(0, 0, 0, 0.5)`,
                        overflow: 'hidden',
                        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
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
                        background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.2) 0%, rgba(15, 20, 30, 0.8) 100%)'
                    }}>
                        <img
                            src="brain.webp"
                            alt="Neural Music Blueprint"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center center',
                                opacity: 0.85
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '100px',
                            background: 'linear-gradient(to top, rgba(15, 20, 30, 0.9), transparent)'
                        }}></div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            color: 'rgba(255, 255, 255, 0.7)',
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
                                A creative system designed to help artists uncover and express their <strong style={{ color: 'rgba(96, 165, 250, 0.95)' }}>unique sonic identity</strong> using neuroscience, psychology, music, sound and creativity.
                            </p>
                            <button style={{
                                padding: '0.75rem 1.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                color: 'rgba(96, 165, 250, 0.95)',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                letterSpacing: '0.03em'
                            }}>
                                Unlock Your Creative Journey
                            </button>
                        </div>

                        <div style={{
                            height: '1px',
                            background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.2), transparent)',
                            margin: '2rem 0'
                        }}></div>

                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: 'rgba(96, 165, 250, 0.9)',
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
                                            background: 'rgba(59, 130, 246, 0.03)',
                                            borderLeft: '3px solid rgba(59, 130, 246, 0.2)',
                                            border: '1px solid rgba(59, 130, 246, 0.08)',
                                            borderRadius: '8px'
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
                                            color: 'rgba(96, 165, 250, 0.7)',
                                            background: 'rgba(59, 130, 246, 0.08)',
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
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.06) 100%)',
                borderBottomLeftRadius: '12px',
                borderTopRightRadius: '20px',
                boxShadow: isHovering
                    ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 30px rgba(59, 130, 246, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.4s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', opacity: isHovering ? 1 : 0.85 }}>📘</span>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: 'rgba(96, 165, 250, 0.95)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        textShadow: isHovering ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none',
                        transition: 'all 0.4s ease'
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
                    background: isHovering ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.03)',
                    border: `1px solid ${isHovering ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    boxShadow: isHovering ? '0 0 30px rgba(59, 130, 246, 0.08)' : 'none'
                }}
            >
                <span style={{ fontSize: '1rem', opacity: 0.75 }}>📘</span>
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
                    color: 'rgba(96, 165, 250, 0.7)',
                    transition: 'transform 0.4s ease'
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
            background: 'rgba(59, 130, 246, 0.03)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.75rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>📘</span>
                <h5 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'rgba(96, 165, 250, 0.9)',
                    margin: 0
                }}>
                    {source.page_title}
                </h5>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: similarityPercent >= 90 ? 'rgba(96, 165, 250, 0.9)'
                        : similarityPercent >= 80 ? 'rgba(59, 130, 246, 0.8)'
                        : 'rgba(255, 255, 255, 0.6)',
                    padding: '0.25rem 0.5rem',
                    background: similarityPercent >= 90 ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(255, 255, 255, 0.04)',
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
