// ═══════════════════════════════════════════════════════════════════════════════
// V6 NEURAL HELIX INTERFACE (NHI)
// Complete layout redesign: Vertical Helix (40%) + Liquid Glass Panel (60%)
// ═══════════════════════════════════════════════════════════════════════════════

/* React Hooks (UMD) */
const {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
} = React;

// ═══════════════════════════════════════════════════════════════════════════════
// HELIX CONFIGURATION - 11 Analysis Modules
// ═══════════════════════════════════════════════════════════════════════════════

const HELIX_MODULES = [
    { key: 'sound_description', label: 'Sound Description', yPercent: 8 },
    { key: 'genre_fusion', label: 'Genre Fusion', yPercent: 16 },
    { key: 'neural_spectrum', label: 'Neural Spectrum', yPercent: 24 },
    { key: 'sound_palette', label: 'Sound Palette', yPercent: 32 },
    { key: 'tonal_identity', label: 'Tonal DNA', yPercent: 40 },
    { key: 'rhythmic_dna', label: 'Rhythmic DNA', yPercent: 48 },
    { key: 'timbre_dna', label: 'Timbre DNA', yPercent: 56 },
    { key: 'emotional_fingerprint', label: 'Emotional Fingerprint', yPercent: 64 },
    { key: 'processing_signature', label: 'Processing Signature', yPercent: 72 },
    { key: 'sonic_architecture', label: 'Sonic Architecture', yPercent: 80 },
    { key: 'inspirational_triggers', label: 'Inspirational Triggers', yPercent: 88 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL HELIX COMPONENT - Left Column SVG
// ═══════════════════════════════════════════════════════════════════════════════

function NeuralHelix({ modules, selectedModule, onNodeClick, parallaxOffset }) {
    // SVG dimensions
    const height = 900;
    const width = 400;
    const centerX = 200;
    const amplitude = 60;
    const frequency = 3;

    // Generate sinusoidal helix path
    const generateHelixPath = useCallback((phase = 0) => {
        let path = '';
        for (let y = 0; y <= height; y += 2) {
            const x = centerX + amplitude * Math.sin((y / height) * frequency * Math.PI * 2 + phase);
            path += y === 0 ? `M${x},${y}` : ` L${x},${y}`;
        }
        return path;
    }, []);

    // Calculate node position on helix + branch offset
    const getNodePosition = useCallback((yPercent) => {
        const y = (yPercent / 100) * height;
        const x = centerX + amplitude * Math.sin((y / height) * frequency * Math.PI * 2);

        // Calculate tangent angle for perpendicular branch
        const tangent = (frequency * Math.PI * 2 / height) * amplitude *
                        Math.cos((y / height) * frequency * Math.PI * 2);
        const angle = Math.atan(tangent);
        const branchLength = 35;

        // Branch extends to the right (positive x direction)
        const nodeX = x + branchLength * Math.cos(angle + Math.PI / 2);
        const nodeY = y + branchLength * Math.sin(angle + Math.PI / 2);

        return { helixX: x, helixY: y, nodeX, nodeY };
    }, []);

    // Memoized helix paths
    const helixPath1 = useMemo(() => generateHelixPath(0), [generateHelixPath]);
    const helixPath2 = useMemo(() => generateHelixPath(Math.PI), [generateHelixPath]);

    // Flowing particles
    const particles = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            delay: i * 0.8,
            duration: 10 + Math.random() * 5,
            size: 1.5 + Math.random() * 1.5
        }))
    , []);

    return (
        <svg
            className="neural-helix-svg"
            viewBox={`0 0 ${width} ${height}`}
            style={{
                transform: `translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px)`,
                transition: 'transform 0.15s ease-out'
            }}
        >
            <defs>
                {/* Helix glow filter */}
                <filter id="helix-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                    <feFlood floodColor="#00D9FF" floodOpacity="0.5" />
                    <feComposite in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Node glow - idle state */}
                <filter id="node-glow-idle" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor="#00D9FF" floodOpacity="0.2" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Node glow - hover state */}
                <filter id="node-glow-hover" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feFlood floodColor="#00D9FF" floodOpacity="0.6" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Node glow - selected state */}
                <filter id="node-glow-selected" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feFlood floodColor="#00D9FF" floodOpacity="0.8" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Helix gradient */}
                <linearGradient id="helix-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#00D9FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Primary helix strand */}
            <path
                d={helixPath1}
                className="helix-strand"
                stroke="url(#helix-gradient)"
                filter="url(#helix-glow)"
            />

            {/* Secondary helix strand (phase offset) */}
            <path
                d={helixPath2}
                className="helix-strand-secondary"
                stroke="url(#helix-gradient)"
            />

            {/* Flowing particles along helix */}
            <g className="helix-particles">
                {particles.map(p => {
                    const startY = Math.random() * height;
                    return (
                        <circle
                            key={p.id}
                            className="helix-particle flowing"
                            r={p.size}
                            fill="#00D9FF"
                            style={{
                                '--particle-duration': `${p.duration}s`,
                                '--particle-delay': `${p.delay}s`,
                                offsetPath: `path('${helixPath1}')`,
                                offsetRotate: '0deg'
                            }}
                        />
                    );
                })}
            </g>

            {/* Neural Nodes */}
            {modules.map(mod => {
                const pos = getNodePosition(mod.yPercent);
                const isSelected = selectedModule === mod.key;
                const isDimmed = selectedModule && !isSelected;

                return (
                    <g
                        key={mod.key}
                        className={`helix-node ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
                        onClick={() => onNodeClick(mod.key)}
                    >
                        {/* Branch line connecting helix to node */}
                        <line
                            className="branch-line"
                            x1={pos.helixX}
                            y1={pos.helixY}
                            x2={pos.nodeX}
                            y2={pos.nodeY}
                        />

                        {/* Ripple rings (animated on hover via CSS) */}
                        <circle
                            className="ripple-ring"
                            cx={pos.nodeX}
                            cy={pos.nodeY}
                            r="12"
                        />
                        <circle
                            className="ripple-ring"
                            cx={pos.nodeX}
                            cy={pos.nodeY}
                            r="12"
                        />

                        {/* Node sphere */}
                        <circle
                            className="helix-node-sphere"
                            cx={pos.nodeX}
                            cy={pos.nodeY}
                            r="12"
                        />

                        {/* Node label - hidden by default, shown on hover */}
                        <text
                            className="helix-node-label"
                            x={pos.nodeX + 22}
                            y={pos.nodeY + 4}
                            textAnchor="start"
                        >
                            {mod.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MICRO PLAYER COMPONENT - Minimal Waveform Audio Player
// ═══════════════════════════════════════════════════════════════════════════════

function MicroPlayer({ audioUrl }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Generate pseudo-waveform bars
    const waveformBars = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            height: 8 + Math.random() * 20,
            index: i
        }))
    , []);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    // Handle audio end
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, []);

    if (!audioUrl) return null;

    return (
        <div className={`micro-player ${isPlaying ? 'playing' : ''}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <button
                className={`micro-player-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <svg viewBox="0 0 12 12" fill="currentColor">
                        <rect x="2" y="2" width="3" height="8" rx="1" />
                        <rect x="7" y="2" width="3" height="8" rx="1" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 2L10 6L3 10V2Z" />
                    </svg>
                )}
            </button>

            <div className="micro-waveform">
                {waveformBars.map((bar) => (
                    <div
                        key={bar.index}
                        className={`micro-waveform-bar ${isPlaying ? 'active' : ''}`}
                        style={{
                            height: `${bar.height}px`,
                            '--bar-index': bar.index
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL COMPONENT - Right Column Liquid Glass
// ═══════════════════════════════════════════════════════════════════════════════

function DetailPanel({ visible, moduleKey, profile, audioUrl, onClose }) {
    // Module label mapping
    const MODULE_LABELS = {
        sound_description: 'Sound Description',
        genre_fusion: 'Genre Fusion',
        neural_spectrum: 'Neural Spectrum',
        sound_palette: 'Sound Palette',
        tonal_identity: 'Tonal DNA',
        rhythmic_dna: 'Rhythmic DNA',
        timbre_dna: 'Timbre DNA',
        emotional_fingerprint: 'Emotional Fingerprint',
        processing_signature: 'Processing Signature',
        sonic_architecture: 'Sonic Architecture',
        inspirational_triggers: 'Inspirational Triggers'
    };

    // Extract content from profile based on module
    const getContent = useCallback(() => {
        if (!moduleKey || !profile) {
            return { label: '', title: '', description: '' };
        }

        const label = MODULE_LABELS[moduleKey] || moduleKey;
        const data = profile[moduleKey];
        let title = '';
        let description = '';

        if (!data) {
            return { label, title: label, description: 'Analysis data not available.' };
        }

        // Handle different module data structures
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
                    ).join(' • ');
                } else if (data.characteristics?.genres) {
                    title = 'Genre Fusion';
                    description = data.synthesis || data.characteristics.genres.join(', ');
                }
                break;

            case 'neural_spectrum':
                const placement = data.placement || 'hybrid';
                title = placement.charAt(0).toUpperCase() + placement.slice(1).replace('_', ' ');
                description = data.synthesis || `Neural spectrum placement: ${placement}. Intensity: ${Math.round((data.intensity || 0) * 100)}%`;
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
                            .join(' • ')
                        : JSON.stringify(data).slice(0, 200)
                );
        }

        return { label, title, description };
    }, [moduleKey, profile]);

    const content = getContent();

    // Handle click outside to close
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    return (
        <div
            className={`detail-panel ${visible ? 'visible' : ''}`}
            onClick={handleOverlayClick}
        >
            {/* Close button */}
            <button
                className="detail-panel-close"
                onClick={onClose}
                aria-label="Close panel"
            >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1L13 13M1 13L13 1" />
                </svg>
            </button>

            {moduleKey && (
                <>
                    {/* Component label */}
                    <div className="panel-component-label">
                        {content.label}
                    </div>

                    {/* Title */}
                    <h2 className="panel-title">
                        {content.title}
                    </h2>

                    {/* Description */}
                    <p className="panel-description">
                        {content.description}
                    </p>

                    {/* Micro-visualization placeholder */}
                    <div className="panel-visualization">
                        <MicroVisualization moduleKey={moduleKey} data={profile?.[moduleKey]} />
                    </div>

                    {/* Micro audio player */}
                    <MicroPlayer audioUrl={audioUrl} />
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDLE HELIX FIELD - Decorative Empty State (Breathing Helix)
// ═══════════════════════════════════════════════════════════════════════════════

function IdleHelixField() {
    // Generate idle helix path (smaller, subtler)
    const generateIdlePath = useCallback((phase = 0) => {
        const height = 500;
        const amplitude = 35;
        const frequency = 2;
        const cx = 150;

        let path = '';
        for (let y = 50; y <= height; y += 3) {
            const x = cx + amplitude * Math.sin((y / height) * frequency * Math.PI * 2 + phase);
            path += y === 50 ? `M${x},${y}` : ` L${x},${y}`;
        }
        return path;
    }, []);

    const idlePath1 = useMemo(() => generateIdlePath(0), [generateIdlePath]);
    const idlePath2 = useMemo(() => generateIdlePath(Math.PI), [generateIdlePath]);

    // Slowly drifting dots
    const idleDots = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            cx: 150 + (Math.random() - 0.5) * 60,
            cy: 80 + i * 55,
            duration: 10 + Math.random() * 8,
            delay: i * 1.5
        }))
    , []);

    return (
        <div className="idle-helix-field">
            <svg viewBox="0 0 300 550" className="idle-helix-svg">
                <defs>
                    <filter id="idle-glow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="5" />
                        <feFlood floodColor="#00D9FF" floodOpacity="0.15" />
                        <feComposite operator="in" in2="SourceAlpha" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Subtle double helix strands */}
                <path
                    d={idlePath1}
                    className="idle-strand"
                    stroke="#00D9FF"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.18"
                    filter="url(#idle-glow)"
                />
                <path
                    d={idlePath2}
                    className="idle-strand"
                    stroke="#0066FF"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.12"
                    filter="url(#idle-glow)"
                />

                {/* Slowly drifting dots */}
                {idleDots.map(dot => (
                    <circle
                        key={dot.id}
                        className="idle-dot"
                        cx={dot.cx}
                        cy={dot.cy}
                        r="3"
                        fill="#00D9FF"
                        opacity="0.25"
                        style={{
                            '--drift-duration': `${dot.duration}s`,
                            '--drift-delay': `${dot.delay}s`
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN NEURAL IDENTITY MAP COMPONENT - V6 Helix Layout
// ═══════════════════════════════════════════════════════════════════════════════

function NeuralIdentityMap({ profile, audioUrl, messages, input, setInput, sending, sendMessage, handleKeyPress }) {
    // State
    const [selectedModule, setSelectedModule] = useState(null);
    const [panelVisible, setPanelVisible] = useState(false);
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 769);

    // Refs
    const containerRef = useRef(null);

    // Handle node click
    const handleNodeClick = useCallback((moduleKey) => {
        if (selectedModule === moduleKey) {
            // Clicking same node closes panel
            setPanelVisible(false);
            setTimeout(() => setSelectedModule(null), 350);
        } else {
            setSelectedModule(moduleKey);
            setPanelVisible(true);
        }
    }, [selectedModule]);

    // Handle panel close
    const handleClosePanel = useCallback(() => {
        setPanelVisible(false);
        setTimeout(() => setSelectedModule(null), 350);
    }, []);

    // Responsive detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 769);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Parallax mouse tracking (desktop only)
    useEffect(() => {
        if (isMobile) return;

        const handleMouseMove = (e) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

            setParallaxOffset(prev => ({
                x: prev.x + (x - prev.x) * 0.1,
                y: prev.y + (y - prev.y) * 0.1
            }));
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile]);

    // Mobile Layout Component
    const MobileLayout = () => {
        const [mobileTab, setMobileTab] = useState('helix');

        return (
            <div className="neural-helix-container" style={{ flexDirection: 'column' }}>
                {/* Helix view (top) */}
                {mobileTab === 'helix' && (
                    <div className="helix-column" style={{ width: '100%', height: '50vh' }}>
                        <NeuralHelix
                            modules={HELIX_MODULES}
                            selectedModule={selectedModule}
                            onNodeClick={handleNodeClick}
                            parallaxOffset={{ x: 0, y: 0 }}
                        />
                    </div>
                )}

                {/* Details list view */}
                {mobileTab === 'details' && (
                    <div style={{
                        width: '100%',
                        height: 'calc(100vh - 72px)',
                        overflowY: 'auto',
                        padding: '16px'
                    }}>
                        {HELIX_MODULES.map(mod => {
                            const data = profile?.[mod.key];
                            const isActive = selectedModule === mod.key;

                            return (
                                <div
                                    key={mod.key}
                                    onClick={() => handleNodeClick(mod.key)}
                                    style={{
                                        padding: '16px',
                                        marginBottom: '12px',
                                        background: isActive ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${isActive ? 'rgba(0, 217, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: 'rgba(0, 217, 255, 0.7)',
                                        marginBottom: '8px'
                                    }}>
                                        {mod.label}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        lineHeight: '1.5',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {data?.synthesis || 'Analysis pending...'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mobile bottom sheet panel */}
                <DetailPanel
                    visible={panelVisible}
                    moduleKey={selectedModule}
                    profile={profile}
                    audioUrl={audioUrl}
                    onClose={handleClosePanel}
                />

                {/* Mobile Tab Navigation */}
                <nav style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '72px',
                    background: 'rgba(10, 10, 31, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(0, 217, 255, 0.15)',
                    display: 'flex',
                    paddingBottom: 'env(safe-area-inset-bottom, 0)',
                    zIndex: 100
                }}>
                    <button
                        onClick={() => setMobileTab('helix')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: mobileTab === 'helix' ? '#00D9FF' : 'rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>◈</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Helix</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('details')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: mobileTab === 'details' ? '#00D9FF' : 'rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>▣</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Details</span>
                    </button>
                </nav>
            </div>
        );
    };

    // Mobile layout
    if (isMobile) {
        return <MobileLayout />;
    }

    // Desktop layout - Helix (40%) + Panel (60%)
    return (
        <div className="neural-helix-container" ref={containerRef}>
            {/* Left Column - Neural Helix */}
            <div className="helix-column">
                <NeuralHelix
                    modules={HELIX_MODULES}
                    selectedModule={selectedModule}
                    onNodeClick={handleNodeClick}
                    parallaxOffset={parallaxOffset}
                />
            </div>

            {/* Right Column - Detail Panel or Idle State */}
            <div className="detail-column">
                <DetailPanel
                    visible={panelVisible}
                    moduleKey={selectedModule}
                    profile={profile}
                    audioUrl={audioUrl}
                    onClose={handleClosePanel}
                />

                {/* Idle helix field when no panel is open */}
                {!panelVisible && <IdleHelixField />}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SESSION MODAL - Session Analysis Mode (Preserved)
// ═══════════════════════════════════════════════════════════════════════════════

function AudioSessionModal({ uploadId, synthesizedProfile, onClose, audioUrl }) {
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
                content: "I apologize, but I'm having trouble responding right now."
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
            <div style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid rgba(0, 217, 255, 0.2)',
                        borderTop: '2px solid rgba(0, 217, 255, 0.8)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading session...</p>
                </div>
            </div>
        );
    }

    const sonicTitle = profile?.sound_description?.sonic_title ||
                       profile?.sound_description?.characteristics?.sonic_title ||
                       sessionData?.track_info?.filename ||
                       'Your Track';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(10, 10, 31, 0.95)',
                backdropFilter: 'blur(40px)',
                padding: '1.25rem 2rem',
                borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div>
                    <div style={{
                        fontSize: '0.6875rem',
                        color: 'rgba(0, 217, 255, 0.8)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginBottom: '0.25rem'
                    }}>
                        NEURAL HELIX INTERFACE
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        color: '#fff',
                        fontWeight: '600',
                        margin: 0,
                        background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {sonicTitle}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.625rem 1.25rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Close
                </button>
            </div>

            {/* Neural Helix Interface */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <NeuralIdentityMap
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
