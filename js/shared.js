// Shared React Components
// Depends on: React, ReactDOM (loaded via CDN)

const { useState, useEffect, useRef, useCallback } = React;

// ============================================================================
// Navigation Component
// ============================================================================

function Navigation({ currentPage, user, onSignOut }) {
    const pages = [
        { name: 'Chat', path: '/chat.html', icon: '💬' },
        { name: 'Reflections', path: '/reflections.html', icon: '🧠' },
        { name: 'Profile', path: '/profile.html', icon: '👤' }
    ];

    return (
        <nav style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            padding: '1rem 2rem'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Logo */}
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    color: '#00D9FF',
                    textShadow: '0 0 20px rgba(0, 217, 255, 0.6)',
                    letterSpacing: '0.1em'
                }}>
                    AURON
                </div>

                {/* Nav Links */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {pages.map(page => (
                        <a
                            key={page.path}
                            href={page.path}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '0.75rem',
                                color: currentPage === page.path ? '#00D9FF' : '#9CA3AF',
                                background: currentPage === page.path ? 'rgba(0, 217, 255, 0.1)' : 'transparent',
                                border: currentPage === page.path ? '1px solid rgba(0, 217, 255, 0.3)' : '1px solid transparent',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== page.path) {
                                    e.target.style.color = '#fff';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== page.path) {
                                    e.target.style.color = '#9CA3AF';
                                    e.target.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <span>{page.icon}</span>
                            <span>{page.name}</span>
                        </a>
                    ))}

                    {/* Sign Out Button */}
                    {onSignOut && (
                        <button
                            onClick={onSignOut}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '0.75rem',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#EF4444',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                        >
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

// ============================================================================
// Loading Screen Component
// ============================================================================

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

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ============================================================================
// Dialogue Message Component
// ============================================================================

function DialogueMessage({ message, onOpenDialogue }) {
    if (message.role === 'user') {
        // User message (simple)
        return (
            <div className="message flex justify-end">
                <div className="max-w-[70%] rounded-2xl px-6 py-4 bg-gradient-to-r from-primary/30 to-primary-dark/30 border border-primary/50">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">You</p>
                    <p className="text-white leading-relaxed">{message.content}</p>
                </div>
            </div>
        );
    }

    // Auron message (simple history marker for dialogues)
    if (message.isDialogue) {
        return (
            <div className="message flex justify-start">
                <div className="max-w-[75%] rounded-2xl px-6 py-5 bg-gray-900 border border-gray-800 hover:border-primary/30 transition-all">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🧠</span>
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide glow">
                                Auron
                            </p>
                            <p className="text-gray-400 text-xs">Shared a reflection</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenDialogue(message.dialogue)}
                        className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 text-sm w-full"
                        style={{
                            background: 'linear-gradient(135deg, #000DFF 0%, #001AFF 100%)',
                            boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)',
                            marginTop: '0.5rem'
                        }}>
                        Open Reflection →
                    </button>
                </div>
            </div>
        );
    }

    // Regular Auron message (e.g., welcome message)
    return (
        <div className="message flex justify-start">
            <div className="max-w-[75%] rounded-2xl px-6 py-5 bg-gray-900 border border-gray-800">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 glow">
                    Auron
                </p>
                <p className="text-white leading-relaxed" style={{ lineHeight: '1.7' }}>
                    {message.content}
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Dialogue Modal Component
// ============================================================================

function DialogueModal({ dialogue, onClose, onSendResponse }) {
    const [showQuestion, setShowQuestion] = useState(false);
    const [userResponse, setUserResponse] = useState('');
    const textareaRef = useRef(null);

    if (!dialogue) return null;

    const handleContinue = () => {
        setShowQuestion(true);
        // Auto-focus textarea after animation
        setTimeout(() => textareaRef.current?.focus(), 600);
    };

    const handleSubmit = () => {
        if (userResponse.trim()) {
            onSendResponse(userResponse.trim());
            onClose();
        }
    };

    return (
        <div className="dialogue-modal-overlay" onClick={onClose}>
            <div className="dialogue-modal" onClick={(e) => e.stopPropagation()} style={{
                transition: 'all 0.3s ease',
                maxWidth: showQuestion ? '800px' : '700px'
            }}>
                {/* Close Button */}
                <button className="dialogue-modal-close" onClick={onClose}>
                    ✕
                </button>

                {/* Guidance */}
                <div style={{
                    transition: 'all 0.5s ease',
                    marginBottom: showQuestion ? '1.5rem' : '2.5rem',
                    opacity: showQuestion ? 0.7 : 1,
                    transform: showQuestion ? 'scale(0.95)' : 'scale(1)'
                }}>
                    <div style={{ marginBottom: showQuestion ? '1rem' : '2.5rem', textAlign: 'center' }}>
                        <div style={{
                            fontSize: showQuestion ? '2rem' : '3rem',
                            marginBottom: '0.5rem',
                            filter: 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.6))',
                            transition: 'all 0.5s ease'
                        }}>
                            🧠
                        </div>
                        <h3 style={{
                            fontSize: showQuestion ? '1.2rem' : '1.5rem',
                            fontWeight: 'bold',
                            color: '#00D9FF',
                            marginBottom: '0.5rem',
                            transition: 'all 0.5s ease'
                        }}>
                            {dialogue.guidance_type}
                        </h3>
                    </div>

                    <div style={{
                        background: 'rgba(0, 191, 255, 0.05)',
                        border: '1px solid rgba(0, 191, 255, 0.2)',
                        borderRadius: '1rem',
                        padding: showQuestion ? '1.25rem' : '1.75rem',
                        transition: 'all 0.5s ease'
                    }}>
                        <p style={{
                            color: '#fff',
                            lineHeight: '1.7',
                            fontSize: showQuestion ? '0.95rem' : '1.05rem',
                            transition: 'all 0.5s ease'
                        }}>
                            {dialogue.guidance}
                        </p>
                    </div>
                </div>

                {/* Question Section */}
                {!showQuestion ? (
                    <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
                        <button
                            onClick={handleContinue}
                            className="btn-sci-fi px-8 py-3 rounded-xl font-semibold text-white"
                            style={{ position: 'relative', zIndex: 10 }}>
                            Continue →
                        </button>
                    </div>
                ) : (
                    <div style={{
                        animation: 'slideIn 0.5s ease',
                        paddingTop: '1rem'
                    }}>
                        <div style={{
                            background: 'rgba(0, 13, 255, 0.05)',
                            border: '1px solid rgba(0, 13, 255, 0.2)',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{
                                color: '#00D9FF',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                marginBottom: '0.75rem'
                            }}>
                                {dialogue.reflective_question}
                            </p>
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm mb-2 block">
                                Share your thoughts or continue the conversation:
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={userResponse}
                                onChange={(e) => setUserResponse(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Type your response..."
                                rows="4"
                                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-semibold text-gray-400 hover:text-white transition-all"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!userResponse.trim()}
                                    className="btn-sci-fi px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ position: 'relative', zIndex: 10 }}>
                                    Send Response
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

// ============================================================================
// Export Components
// ============================================================================

if (typeof window !== 'undefined') {
    window.SharedComponents = {
        Navigation,
        LoadingScreen,
        DialogueMessage,
        DialogueModal
    };
}
