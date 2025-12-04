// ============================================================
// V7 NEURAL HELIX INTERFACE
// Pseudo-3D WebGL helix with floating glass detail panel
// ============================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const HELIX_MODULES_V7 = [
    { key: 'sound_description', label: 'Sound Description' },
    { key: 'genre_fusion', label: 'Genre Fusion' },
    { key: 'neural_spectrum', label: 'Neural Spectrum' },
    { key: 'sound_palette', label: 'Sound Palette' },
    { key: 'tonal_identity', label: 'Tonal DNA' },
    { key: 'rhythmic_dna', label: 'Rhythmic DNA' },
    { key: 'timbre_dna', label: 'Timbre DNA' },
    { key: 'emotional_fingerprint', label: 'Emotional Fingerprint' },
    { key: 'processing_signature', label: 'Processing Signature' },
    { key: 'sonic_architecture', label: 'Sonic Architecture' },
    { key: 'inspirational_triggers', label: 'Inspirational Triggers' }
];

// ═══════════════════════════════════════════════════════════════
// RENDERER DETECTION
// ═══════════════════════════════════════════════════════════════

function detectRenderMode() {
    // Check for mobile
    const isMobile = typeof window !== 'undefined' &&
                     (window.innerWidth < 769 || 'ontouchstart' in window);

    // Check WebGL support
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (gl && !isMobile) {
            // Check for required features
            const ext = gl.getExtension('OES_standard_derivatives');
            if (ext) {
                return 'webgl';
            }
        }
    } catch (e) {
        console.warn('WebGL detection failed:', e);
    }

    // Check Canvas 2D
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            return 'canvas2d';
        }
    } catch (e) {
        console.warn('Canvas 2D detection failed:', e);
    }

    // Fallback to SVG
    return 'svg';
}

// ═══════════════════════════════════════════════════════════════
// HELIX CANVAS COMPONENT (WebGL or Canvas2D)
// ═══════════════════════════════════════════════════════════════

function HelixCanvasV7({
    renderMode,
    selectedModule,
    hoveredModule,
    onNodeClick,
    onNodeHover
}) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    // Initialize renderer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const callbacks = {
            onHover: onNodeHover,
            onClick: onNodeClick
        };

        if (renderMode === 'webgl' && window.HelixWebGL) {
            rendererRef.current = window.HelixWebGL.createRenderer(canvas, callbacks);
        } else if (renderMode === 'canvas2d' && window.HelixCanvas2D) {
            rendererRef.current = window.HelixCanvas2D.createRenderer(canvas, callbacks);
        }

        if (rendererRef.current) {
            rendererRef.current.start();
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, [renderMode, onNodeClick, onNodeHover]);

    // Update selected state
    useEffect(() => {
        if (rendererRef.current) {
            const nodes = rendererRef.current.getNodePositions();
            const index = selectedModule ? nodes.findIndex(n => n.key === selectedModule) : -1;
            rendererRef.current.setSelectedIndex(index);
        }
    }, [selectedModule]);

    return (
        <canvas
            ref={canvasRef}
            className="helix-canvas-v7"
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: 'transparent'
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL V7 - Floating Glass Card
// ═══════════════════════════════════════════════════════════════

function DetailPanelV7({ visible, moduleKey, profile, audioUrl, onClose }) {
    const moduleInfo = HELIX_MODULES_V7.find(m => m.key === moduleKey);
    const data = profile?.[moduleKey];

    // Content extraction (reuse V6 logic pattern)
    const content = useMemo(() => {
        if (!moduleKey) return { label: '', title: '', description: '' };

        const label = moduleInfo?.label || moduleKey;
        let title = label;
        let description = '';

        if (!data) {
            return { label, title, description: 'Analysis data not available.' };
        }

        switch (moduleKey) {
            case 'sound_description':
                title = data.sonic_title || data.characteristics?.sonic_title || 'Sonic Profile';
                description = data.synthesis || '';
                break;

            case 'genre_fusion':
                if (Array.isArray(data)) {
                    title = data[0]?.genre || 'Genre Blend';
                    description = data.map(g =>
                        `${g.genre} (${Math.round((g.weight || 0) * 100)}%)`
                    ).join(' · ');
                } else if (data.characteristics?.genres) {
                    title = 'Genre Fusion';
                    description = data.synthesis || data.characteristics.genres.join(', ');
                }
                break;

            case 'neural_spectrum':
                const placement = data.placement || 'hybrid';
                title = placement.charAt(0).toUpperCase() + placement.slice(1).replace('_', ' ');
                description = data.synthesis || `Neural spectrum: ${placement}. Intensity: ${Math.round((data.intensity || 0) * 100)}%`;
                break;

            case 'rhythmic_dna':
                const bpm = data.characteristics?.tempo_bpm;
                title = bpm ? `${Math.round(bpm)} BPM` : 'Rhythmic DNA';
                description = data.synthesis || '';
                break;

            case 'emotional_fingerprint':
                if (data.nodes && Array.isArray(data.nodes)) {
                    title = data.nodes[0]?.emotion || 'Emotional Impact';
                    description = data.synthesis || data.nodes.map(n => n.emotion).join(', ');
                } else {
                    title = 'Emotional Fingerprint';
                    description = data.synthesis || '';
                }
                break;

            case 'inspirational_triggers':
                if (data.sources && Array.isArray(data.sources)) {
                    title = 'Inner Mind';
                    description = data.synthesis || data.sources.join(', ');
                } else {
                    title = 'Inspirational Triggers';
                    description = data.synthesis || '';
                }
                break;

            default:
                title = label;
                description = data.synthesis || (
                    data.characteristics ?
                        Object.entries(data.characteristics)
                            .slice(0, 5)
                            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                            .join(' · ')
                        : ''
                );
        }

        return { label, title, description };
    }, [moduleKey, data, moduleInfo]);

    return (
        <div className={`detail-panel-v7 ${visible ? 'visible' : ''}`}>
            <div className="panel-glass-card-v7">
                {/* Close button */}
                <button
                    className="panel-close-v7"
                    onClick={onClose}
                    aria-label="Close panel"
                >
                    <svg viewBox="0 0 14 14" fill="none">
                        <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>

                {moduleKey && (
                    <>
                        {/* Component label */}
                        <div className="panel-label-v7">
                            {content.label}
                        </div>

                        {/* Title */}
                        <h2 className="panel-title-v7">
                            {content.title}
                        </h2>

                        {/* Description */}
                        <p className="panel-description-v7">
                            {content.description}
                        </p>

                        {/* Micro-visualization (reuse from V6) */}
                        <div className="panel-viz-v7">
                            {typeof MicroVisualization !== 'undefined' && (
                                <MicroVisualization moduleKey={moduleKey} data={data} />
                            )}
                        </div>

                        {/* Audio player (reuse from V6) */}
                        {audioUrl && typeof MicroPlayer !== 'undefined' && (
                            <div className="panel-player-v7">
                                <MicroPlayer audioUrl={audioUrl} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════

function MobileLayoutV7({
    profile,
    audioUrl,
    selectedModule,
    setSelectedModule,
    renderMode
}) {
    const [panelVisible, setPanelVisible] = useState(false);

    const handleNodeClick = useCallback((moduleKey) => {
        if (selectedModule === moduleKey) {
            setPanelVisible(false);
            setTimeout(() => setSelectedModule(null), 400);
        } else {
            setSelectedModule(moduleKey);
            setPanelVisible(true);
        }
    }, [selectedModule, setSelectedModule]);

    const handleClosePanel = useCallback(() => {
        setPanelVisible(false);
        setTimeout(() => setSelectedModule(null), 400);
    }, [setSelectedModule]);

    return (
        <div className="neural-helix-v7-container mobile">
            {/* Helix view */}
            <div className="helix-column-v7 mobile">
                {renderMode === 'svg' ? (
                    // V6 SVG fallback
                    typeof NeuralHelix !== 'undefined' && (
                        <NeuralHelix
                            modules={HELIX_MODULES_V7}
                            selectedModule={selectedModule}
                            onNodeClick={handleNodeClick}
                            parallaxOffset={{ x: 0, y: 0 }}
                        />
                    )
                ) : (
                    <HelixCanvasV7
                        renderMode={renderMode}
                        selectedModule={selectedModule}
                        hoveredModule={null}
                        onNodeClick={handleNodeClick}
                        onNodeHover={() => {}}
                    />
                )}
            </div>

            {/* Bottom sheet panel */}
            <DetailPanelV7
                visible={panelVisible}
                moduleKey={selectedModule}
                profile={profile}
                audioUrl={audioUrl}
                onClose={handleClosePanel}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

function NeuralIdentityMapV7({ profile, audioUrl, messages, input, setInput, sending, sendMessage, handleKeyPress }) {
    // State
    const [selectedModule, setSelectedModule] = useState(null);
    const [hoveredModule, setHoveredModule] = useState(null);
    const [panelVisible, setPanelVisible] = useState(false);
    const [renderMode, setRenderMode] = useState('detecting');
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' && window.innerWidth < 769
    );

    // Detect renderer on mount
    useEffect(() => {
        const mode = detectRenderMode();
        setRenderMode(mode);
        console.log('Neural Helix V7 render mode:', mode);
    }, []);

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 769;
            setIsMobile(mobile);

            // Re-detect render mode on resize (mobile might change preference)
            if (mobile !== isMobile) {
                setRenderMode(detectRenderMode());
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    // Node click handler
    const handleNodeClick = useCallback((moduleKey) => {
        if (selectedModule === moduleKey) {
            setPanelVisible(false);
            setTimeout(() => setSelectedModule(null), 400);
        } else {
            setSelectedModule(moduleKey);
            setPanelVisible(true);
        }
    }, [selectedModule]);

    // Node hover handler
    const handleNodeHover = useCallback((moduleKey) => {
        setHoveredModule(moduleKey);
    }, []);

    // Close panel handler
    const handleClosePanel = useCallback(() => {
        setPanelVisible(false);
        setTimeout(() => setSelectedModule(null), 400);
    }, []);

    // Loading state
    if (renderMode === 'detecting') {
        return (
            <div className="neural-helix-v7-container loading">
                <div className="helix-loading-indicator">
                    <div className="helix-loading-spinner"></div>
                </div>
            </div>
        );
    }

    // Mobile layout
    if (isMobile) {
        return (
            <MobileLayoutV7
                profile={profile}
                audioUrl={audioUrl}
                selectedModule={selectedModule}
                setSelectedModule={setSelectedModule}
                renderMode={renderMode}
            />
        );
    }

    // Desktop layout
    return (
        <div className="neural-helix-v7-container">
            {/* Helix column (45%) */}
            <div className="helix-column-v7">
                {renderMode === 'svg' ? (
                    // V6 SVG fallback
                    typeof NeuralHelix !== 'undefined' && (
                        <NeuralHelix
                            modules={HELIX_MODULES_V7}
                            selectedModule={selectedModule}
                            onNodeClick={handleNodeClick}
                            parallaxOffset={{ x: 0, y: 0 }}
                        />
                    )
                ) : (
                    <HelixCanvasV7
                        renderMode={renderMode}
                        selectedModule={selectedModule}
                        hoveredModule={hoveredModule}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                    />
                )}

                {/* Hover label overlay */}
                {hoveredModule && !selectedModule && (
                    <div className="helix-hover-label-v7">
                        {HELIX_MODULES_V7.find(m => m.key === hoveredModule)?.label}
                    </div>
                )}
            </div>

            {/* Detail column (55%) */}
            <div className="detail-column-v7">
                <DetailPanelV7
                    visible={panelVisible}
                    moduleKey={selectedModule}
                    profile={profile}
                    audioUrl={audioUrl}
                    onClose={handleClosePanel}
                />

                {/* Empty state */}
                {!panelVisible && (
                    <div className="helix-empty-state-v7">
                        <p className="empty-state-text">
                            Select a node to explore your sonic profile
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// AUDIO SESSION MODAL V7 (Wrapper)
// ═══════════════════════════════════════════════════════════════

function AudioSessionModalV7({ uploadId, synthesizedProfile, onClose, audioUrl }) {
    const [sessionData, setSessionData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(!synthesizedProfile);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Profile data from synthesized response
    const profile = synthesizedProfile?.profile || {};

    useEffect(() => {
        if (!synthesizedProfile) {
            loadSessionData();
        } else {
            const welcomeMsg = generateSynthesizedWelcome();
            setMessages([{ role: 'auron', content: welcomeMsg }]);
        }
    }, [uploadId, synthesizedProfile]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadSessionData = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(
                `${BFF_API_BASE}/audio/session/${uploadId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to load session');

            const data = await response.json();
            setSessionData(data);

            const welcomeMsg = generateLegacyWelcome(data);
            setMessages([{ role: 'auron', content: welcomeMsg }]);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load session:', err);
            setLoading(false);
        }
    };

    const generateSynthesizedWelcome = () => {
        const soundDesc = profile?.sound_description;
        const sonicTitle = soundDesc?.sonic_title || soundDesc?.characteristics?.sonic_title || 'Your Track';
        return `Your sonic fingerprint has been synthesized. I see "${sonicTitle}" — explore the helix to understand the architecture of your sound.

What aspects of this profile resonate most with your intentions?`;
    };

    const generateLegacyWelcome = (data) => {
        const { track_info } = data;
        const duration = Math.round(track_info?.duration || 0);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `I've analyzed "${track_info?.filename}" — ${minutes}:${seconds.toString().padStart(2, '0')} of sonic data processed.

What were you trying to express when you created this piece?`;
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const token = await getAuthToken();
            const response = await fetch(
                `${BFF_API_BASE}/audio/session/${uploadId}/message`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        upload_id: uploadId
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'auron',
                content: data.message || "I'm reflecting on what you've shared..."
            }]);
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                role: 'auron',
                content: "I encountered an issue processing your message. Let's continue exploring your profile."
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (loading) {
        return (
            <div className="audio-session-modal-v7">
                <div className="session-loading">
                    <div className="helix-loading-spinner"></div>
                    <p>Synthesizing neural profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="audio-session-modal-v7">
            {/* Header */}
            <div className="session-header-v7">
                <h1 className="session-title-v7">Neural Analysis</h1>
                <button
                    className="session-close-v7"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>

            {/* Neural Helix Interface */}
            <div className="session-content-v7">
                <NeuralIdentityMapV7
                    profile={profile}
                    audioUrl={audioUrl}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    sending={sending}
                    sendMessage={sendMessage}
                    handleKeyPress={handleKeyPress}
                />
            </div>
        </div>
    );
}
