// ============================================================
// V7 NEURAL HELIX INTERFACE
// Fullscreen immersive WebGL helix with floating glass panel
// Diagonal flow: top-left to bottom-right
// ============================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const HELIX_MODULES_V7 = [
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

// V7.5 Layout Constants
const LAYOUT_V75 = {
    MARGIN_X: 32,
    MARGIN_Y: 32,
    PANEL_WIDTH: 500,
    PANEL_HEIGHT: 420,
    GAP_FROM_NODE: 28
};

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
// V7.5 NEURAL HELIX HEADER (Sonic Title + Audio Player + Viewing)
// ═══════════════════════════════════════════════════════════════

function NeuralHelixHeader({ profile, audioUrl, viewingModule, panelVisible }) {
    const soundDesc = profile?.sound_description;

    if (!soundDesc) return null;

    const sonicTitle = soundDesc.sonic_title ||
                       soundDesc.characteristics?.sonic_title ||
                       'Neural Profile';
    const synthesis = soundDesc.synthesis || '';

    // Get viewing module label
    const viewingLabel = viewingModule
        ? HELIX_MODULES_V7.find(m => m.key === viewingModule)?.label
        : null;

    return (
        <div className="neural-helix-header">
            <div className="neural-helix-title">{sonicTitle}</div>
            {synthesis && (
                <div className="neural-helix-subtitle">{synthesis}</div>
            )}

            {/* V7.5: Header controls with audio player */}
            <div className="neural-helix-header-controls">
                {audioUrl && typeof MicroPlayer !== 'undefined' && (
                    <div className="header-player-container">
                        <MicroPlayer audioUrl={audioUrl} />
                    </div>
                )}

                {panelVisible && viewingLabel && (
                    <div className="header-viewing-indicator">
                        <span className="viewing-label">Viewing</span>
                        <span className="viewing-module">{viewingLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HELIX CANVAS COMPONENT (WebGL or Canvas2D)
// ═══════════════════════════════════════════════════════════════

function HelixCanvasV7({
    renderMode,
    selectedModule,
    hoveredModule,
    onNodeClick,
    onNodeHover,
    parallaxOffset,  // { x: 0-1, y: 0-1 } normalized pointer position
    visitedNodes     // V7.5: Set of visited node keys
}) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    // Store callbacks in refs to avoid triggering useEffect on every render
    const onNodeClickRef = useRef(onNodeClick);
    const onNodeHoverRef = useRef(onNodeHover);

    // Keep refs updated
    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
        onNodeHoverRef.current = onNodeHover;
    }, [onNodeClick, onNodeHover]);

    // Initialize renderer - only depends on renderMode
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use ref callbacks so renderer doesn't need recreation
        const callbacks = {
            onHover: (hoverData) => onNodeHoverRef.current?.(hoverData),
            onClick: (key) => onNodeClickRef.current?.(key)
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
    }, [renderMode]); // Only recreate when renderMode changes

    // Update selected state
    useEffect(() => {
        if (rendererRef.current) {
            const nodes = rendererRef.current.getNodePositions();
            const index = selectedModule ? nodes.findIndex(n => n.key === selectedModule) : -1;
            rendererRef.current.setSelectedIndex(index);
        }
    }, [selectedModule]);

    // Update parallax
    useEffect(() => {
        if (rendererRef.current && parallaxOffset && rendererRef.current.setParallax) {
            rendererRef.current.setParallax(parallaxOffset.x, parallaxOffset.y);
        }
    }, [parallaxOffset]);

    // V7.5: Update visited state
    useEffect(() => {
        if (rendererRef.current && visitedNodes && rendererRef.current.setVisitedNodes) {
            rendererRef.current.setVisitedNodes(visitedNodes);
        }
    }, [visitedNodes]);

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

function DetailPanelV7({ visible, moduleKey, left, top, flipBelow = false, isMobile = false, profile, onClose }) {
    const moduleInfo = HELIX_MODULES_V7.find(m => m.key === moduleKey);
    const data = profile?.[moduleKey];

    // Crossfade state management
    const [displayedKey, setDisplayedKey] = useState(moduleKey);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevKeyRef = useRef(moduleKey);

    // Handle module switching with crossfade
    useEffect(() => {
        if (moduleKey !== prevKeyRef.current && moduleKey && visible) {
            // Start exit animation
            setIsTransitioning(true);

            // After exit animation, switch content and start enter animation
            const timer = setTimeout(() => {
                setDisplayedKey(moduleKey);
                setIsTransitioning(false);
            }, 250); // Match crossfade-out duration

            prevKeyRef.current = moduleKey;
            return () => clearTimeout(timer);
        } else if (moduleKey) {
            setDisplayedKey(moduleKey);
            prevKeyRef.current = moduleKey;
        }
    }, [moduleKey, visible]);

    // Use displayed key for content rendering
    const displayedModuleInfo = HELIX_MODULES_V7.find(m => m.key === displayedKey);
    const displayedData = profile?.[displayedKey];

    // Content extraction (reuse V6 logic pattern) - uses displayedKey for smooth crossfade
    const content = useMemo(() => {
        if (!displayedKey) return { label: '', title: '', description: '' };

        const label = displayedModuleInfo?.label || displayedKey;
        let title = label;
        let description = '';

        if (!displayedData) {
            return { label, title, description: 'Analysis data not available.' };
        }

        switch (displayedKey) {
            case 'sound_description':
                title = displayedData.sonic_title || displayedData.characteristics?.sonic_title || 'Sonic Profile';
                description = displayedData.synthesis || '';
                break;

            case 'genre_fusion':
                if (Array.isArray(displayedData)) {
                    title = displayedData[0]?.genre || 'Genre Blend';
                    description = displayedData.map(g =>
                        `${g.genre} (${Math.round((g.weight || 0) * 100)}%)`
                    ).join(' · ');
                } else if (displayedData.characteristics?.genres) {
                    title = 'Genre Fusion';
                    description = displayedData.synthesis || displayedData.characteristics.genres.join(', ');
                }
                break;

            case 'neural_spectrum':
                const placement = displayedData.placement || 'hybrid';
                title = placement.charAt(0).toUpperCase() + placement.slice(1).replace('_', ' ');
                description = displayedData.synthesis || `Neural spectrum: ${placement}. Intensity: ${Math.round((displayedData.intensity || 0) * 100)}%`;
                break;

            case 'rhythmic_dna':
                const bpm = displayedData.characteristics?.tempo_bpm;
                title = bpm ? `${Math.round(bpm)} BPM` : 'Rhythmic DNA';
                description = displayedData.synthesis || '';
                break;

            case 'emotional_fingerprint':
                if (displayedData.nodes && Array.isArray(displayedData.nodes)) {
                    title = displayedData.nodes[0]?.emotion || 'Emotional Impact';
                    description = displayedData.synthesis || displayedData.nodes.map(n => n.emotion).join(', ');
                } else {
                    title = 'Emotional Fingerprint';
                    description = displayedData.synthesis || '';
                }
                break;

            case 'inspirational_triggers':
                if (displayedData.sources && Array.isArray(displayedData.sources)) {
                    title = 'Inner Mind';
                    description = displayedData.synthesis || displayedData.sources.join(', ');
                } else {
                    title = 'Inspirational Triggers';
                    description = displayedData.synthesis || '';
                }
                break;

            default:
                title = label;
                description = displayedData.synthesis || (
                    displayedData.characteristics ?
                        Object.entries(displayedData.characteristics)
                            .slice(0, 5)
                            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                            .join(' · ')
                        : ''
                );
        }

        return { label, title, description };
    }, [displayedKey, displayedData, displayedModuleInfo]);

    // V7.5: Explicit left/top positioning (already clamped by parent)
    const panelStyle = isMobile ? {} : {
        left: `${left}px`,
        top: `${top}px`,
        width: `${LAYOUT_V75.PANEL_WIDTH}px`,
        transform: visible
            ? 'scale(1)'
            : (flipBelow ? 'translateY(-12px) scale(0.94)' : 'translateY(12px) scale(0.94)'),
        transformOrigin: flipBelow ? 'top center' : 'bottom center'
    };

    return (
        <div
            className={`detail-panel-v7 ${visible ? 'visible' : ''}`}
            style={panelStyle}
        >
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

                {/* Content with crossfade animation */}
                {displayedKey && (
                    <div className="panel-content-v7">
                        <div
                            className={`panel-content-inner-v7 ${isTransitioning ? 'crossfade-exit' : ''}`}
                            key={displayedKey}
                        >
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
                                    <MicroVisualization moduleKey={displayedKey} data={displayedData} />
                                )}
                            </div>
                        </div>
                    </div>
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
    renderMode,
    visitedNodes,       // V7.5
    onNodeVisited       // V7.5: callback to track visited nodes
}) {
    const [panelVisible, setPanelVisible] = useState(false);

    // Mobile uses old string-only selection (no position needed for bottom sheet)
    const handleNodeClick = useCallback((clickData) => {
        // clickData is now { key, screenX, screenY, index } but mobile only needs key
        const moduleKey = typeof clickData === 'string' ? clickData : clickData.key;
        if (selectedModule === moduleKey) {
            setPanelVisible(false);
            setTimeout(() => setSelectedModule(null), 400);
        } else {
            setSelectedModule(moduleKey);
            setPanelVisible(true);
            // V7.5: Track as visited
            if (onNodeVisited) onNodeVisited(moduleKey);
        }
    }, [selectedModule, setSelectedModule, onNodeVisited]);

    const handleClosePanel = useCallback(() => {
        setPanelVisible(false);
        setTimeout(() => setSelectedModule(null), 400);
    }, [setSelectedModule]);

    return (
        <div className="neural-helix-v7-container mobile">
            {/* V7.5: Neural Helix Header with Audio Player */}
            <NeuralHelixHeader
                profile={profile}
                audioUrl={audioUrl}
                viewingModule={selectedModule}
                panelVisible={panelVisible}
            />

            {/* Fullscreen helix canvas */}
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
                        hoveredModule={null}
                        onNodeClick={handleNodeClick}
                        onNodeHover={() => {}}
                        visitedNodes={visitedNodes}
                    />
                )}

                {/* Instructions (when nothing selected) */}
                {!selectedModule && (
                    <div className="helix-instructions-v7">
                        <p>Tap a node to explore</p>
                    </div>
                )}
            </div>

            {/* Bottom sheet panel (slides up on mobile) */}
            <DetailPanelV7
                visible={panelVisible}
                moduleKey={selectedModule}
                isMobile={true}
                profile={profile}
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
    const [selectedNode, setSelectedNode] = useState(null);  // { key, screenX, screenY, index } or null
    const [hoveredNode, setHoveredNode] = useState(null);    // { key, label, screenX, screenY } or null
    const [panelVisible, setPanelVisible] = useState(false);
    const [renderMode, setRenderMode] = useState('detecting');
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' && window.innerWidth < 769
    );
    const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5 });

    // V7.5: Track visited nodes (session-only)
    const [visitedNodes, setVisitedNodes] = useState(new Set());

    // V7.5: Compute anchor position with two-pass clamping and pointer offset
    const anchorPosition = useMemo(() => {
        const { MARGIN_X, MARGIN_Y, PANEL_WIDTH, PANEL_HEIGHT, GAP_FROM_NODE } = LAYOUT_V75;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

        if (!selectedNode) {
            return {
                left: (vw - PANEL_WIDTH) / 2,
                top: vh * 0.3,
                flipBelow: false,
                pointerOffsetX: 0,
                nodeX: vw / 2,
                nodeY: vh * 0.5
            };
        }

        // Initial position: card above node, centered horizontally on node
        let left = selectedNode.screenX - PANEL_WIDTH / 2;
        let top = selectedNode.screenY - GAP_FROM_NODE - PANEL_HEIGHT;
        let flipBelow = false;

        // Pass 1: Check vertical fit above node
        if (top < MARGIN_Y) {
            // Not enough space above → flip to below
            flipBelow = true;
            top = selectedNode.screenY + GAP_FROM_NODE;
        }

        // Pass 2: Clamp vertical to viewport
        if (flipBelow) {
            // Below: ensure bottom edge doesn't exceed viewport
            top = Math.min(top, vh - MARGIN_Y - PANEL_HEIGHT);
        }
        top = Math.max(MARGIN_Y, top);

        // Horizontal clamping with safe margins
        left = Math.max(MARGIN_X, Math.min(left, vw - MARGIN_X - PANEL_WIDTH));

        // Calculate pointer offset for connector line alignment
        const panelCenterX = left + PANEL_WIDTH / 2;
        const pointerOffsetX = selectedNode.screenX - panelCenterX;

        return {
            left,
            top,
            flipBelow,
            pointerOffsetX,
            nodeX: selectedNode.screenX,
            nodeY: selectedNode.screenY
        };
    }, [selectedNode]);

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

    // Pointer tracking for parallax effect (desktop only)
    useEffect(() => {
        if (isMobile) return;

        const handlePointerMove = (e) => {
            setPointerPos({
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight
            });
        };

        window.addEventListener('pointermove', handlePointerMove);
        return () => window.removeEventListener('pointermove', handlePointerMove);
    }, [isMobile]);

    // Node click handler - now receives { key, screenX, screenY, index }
    const handleNodeClick = useCallback((clickData) => {
        if (selectedNode?.key === clickData.key) {
            // Deselect
            setPanelVisible(false);
            setTimeout(() => setSelectedNode(null), 400);
        } else {
            // Select new node with position
            setSelectedNode(clickData);
            setPanelVisible(true);

            // V7.5: Track as visited
            setVisitedNodes(prev => new Set([...prev, clickData.key]));
        }
    }, [selectedNode]);

    // Node hover handler - now receives full hover data with position
    const handleNodeHover = useCallback((hoverData) => {
        setHoveredNode(hoverData);  // { key, label, screenX, screenY } or null
    }, []);

    // Close panel handler
    const handleClosePanel = useCallback(() => {
        setPanelVisible(false);
        setTimeout(() => setSelectedNode(null), 400);
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
                selectedModule={selectedNode?.key || null}
                setSelectedModule={(key) => setSelectedNode(key ? { key, screenX: 0, screenY: 0, index: -1 } : null)}
                renderMode={renderMode}
                visitedNodes={visitedNodes}
                onNodeVisited={(key) => setVisitedNodes(prev => new Set([...prev, key]))}
            />
        );
    }

    // Desktop layout - Fullscreen cinematic mode
    return (
        <div className="neural-helix-v7-container">
            {/* V7.5: Neural Helix Header with Audio Player */}
            <NeuralHelixHeader
                profile={profile}
                audioUrl={audioUrl}
                viewingModule={selectedNode?.key}
                panelVisible={panelVisible}
            />

            {/* Fullscreen helix canvas */}
            <div className="helix-column-v7">
                {renderMode === 'svg' ? (
                    // V6 SVG fallback
                    typeof NeuralHelix !== 'undefined' && (
                        <NeuralHelix
                            modules={HELIX_MODULES_V7}
                            selectedModule={selectedNode?.key}
                            onNodeClick={handleNodeClick}
                            parallaxOffset={pointerPos}
                        />
                    )
                ) : (
                    <HelixCanvasV7
                        renderMode={renderMode}
                        selectedModule={selectedNode?.key}
                        hoveredModule={hoveredNode?.key}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                        parallaxOffset={pointerPos}
                        visitedNodes={visitedNodes}
                    />
                )}

                {/* V7.5: Anchor connector line with pointer offset */}
                {selectedNode && panelVisible && (
                    <svg
                        className="node-anchor-connector"
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 99
                        }}
                    >
                        <defs>
                            {/* Gradient direction: bright at node, fades toward card */}
                            <linearGradient
                                id="anchorGradient"
                                x1="0%"
                                y1={anchorPosition.flipBelow ? '0%' : '100%'}
                                x2="0%"
                                y2={anchorPosition.flipBelow ? '100%' : '0%'}
                            >
                                <stop offset="0%" stopColor="rgba(0, 217, 255, 0.6)" />
                                <stop offset="100%" stopColor="rgba(0, 217, 255, 0)" />
                            </linearGradient>
                            <filter id="anchorGlow">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <line
                            x1={anchorPosition.nodeX}
                            y1={anchorPosition.nodeY}
                            x2={anchorPosition.left + LAYOUT_V75.PANEL_WIDTH / 2 + anchorPosition.pointerOffsetX}
                            y2={anchorPosition.flipBelow
                                ? anchorPosition.top
                                : anchorPosition.top + LAYOUT_V75.PANEL_HEIGHT}
                            stroke="url(#anchorGradient)"
                            strokeWidth="1.5"
                            filter="url(#anchorGlow)"
                        />
                    </svg>
                )}

                {/* Positioned hover tooltip near node */}
                {hoveredNode && !selectedNode && (
                    <div
                        className="helix-hover-tooltip-v7"
                        style={{
                            left: hoveredNode.screenX,
                            top: hoveredNode.screenY - 45,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {hoveredNode.label}
                    </div>
                )}

                {/* Instructions (when nothing selected) */}
                {!selectedNode && (
                    <div className="helix-instructions-v7">
                        <p>Click on a node to explore</p>
                    </div>
                )}
            </div>

            {/* V7.5: Floating panel with explicit positioning */}
            <DetailPanelV7
                visible={panelVisible}
                moduleKey={selectedNode?.key}
                left={anchorPosition.left}
                top={anchorPosition.top}
                flipBelow={anchorPosition.flipBelow}
                isMobile={false}
                profile={profile}
                onClose={handleClosePanel}
            />
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
