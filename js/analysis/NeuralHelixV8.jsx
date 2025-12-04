// ============================================================
// V8 NEURAL HELIX - React Component Wrapper
// Full viewport cinematic DNA experience
// ============================================================

function NeuralHelixV8({ profile, audioUrl, onClose, onNodeSelect }) {
    const canvasRef = React.useRef(null);
    const rendererRef = React.useRef(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedNode, setSelectedNode] = React.useState(null);
    const [hoveredNode, setHoveredNode] = React.useState(null);
    const [error, setError] = React.useState(null);

    // Initialize renderer
    React.useEffect(() => {
        if (!canvasRef.current) return;

        // Check WebGL support
        if (!HelixWebGLV8.isSupported()) {
            setError('WebGL not supported');
            setIsLoading(false);
            return;
        }

        try {
            // Create renderer
            rendererRef.current = new HelixWebGLV8.HelixRenderer(canvasRef.current, {
                profile,
                audioUrl,
                onNodeSelect: (key, data) => {
                    setSelectedNode(key);
                    if (onNodeSelect) {
                        onNodeSelect(key, data);
                    }
                },
                onHover: (key) => {
                    setHoveredNode(key);
                }
            });

            // Start rendering
            rendererRef.current.start();
            setIsLoading(false);

        } catch (err) {
            console.error('V8 Helix initialization error:', err);
            setError(err.message);
            setIsLoading(false);
        }

        // Cleanup
        return () => {
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, []);

    // Update profile when it changes
    React.useEffect(() => {
        if (rendererRef.current && profile) {
            rendererRef.current.setProfile(profile);
        }
    }, [profile]);

    // Handle close
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    // Handle keyboard
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedNode) {
                    // Deselect node first
                    if (rendererRef.current) {
                        rendererRef.current.deselectNode();
                    }
                    setSelectedNode(null);
                } else {
                    // Close modal
                    handleClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode]);

    // Render error state
    if (error) {
        return (
            <div className="neural-helix-v8-container">
                <div className="v8-error-state">
                    <div className="v8-error-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <circle cx="12" cy="16" r="1" fill="currentColor" />
                        </svg>
                    </div>
                    <p className="v8-error-text">Unable to initialize 3D visualization</p>
                    <p className="v8-error-detail">{error}</p>
                    <button className="v8-error-button" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="neural-helix-v8-container">
            {/* WebGL Canvas - Full Viewport */}
            <canvas
                ref={canvasRef}
                className="helix-canvas-v8"
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="v8-loading-overlay">
                    <div className="v8-loading-spinner" />
                    <p className="v8-loading-text">Initializing Neural Helix...</p>
                </div>
            )}

            {/* Header Bar */}
            <div className="v8-header">
                <h1 className="v8-title">Neural Identity Map</h1>
                <button className="v8-close-button" onClick={handleClose}>
                    <span>Close</span>
                    <kbd>ESC</kbd>
                </button>
            </div>

            {/* Hover Label */}
            {hoveredNode && !selectedNode && (
                <div className="v8-hover-label">
                    {getNodeLabel(hoveredNode)}
                </div>
            )}

            {/* Instructions (when nothing selected) */}
            {!selectedNode && !isLoading && (
                <div className="v8-instructions">
                    <p>Click on a node to explore</p>
                </div>
            )}
        </div>
    );
}

// Helper to get node label from key
function getNodeLabel(key) {
    const labels = {
        'sound_description': 'Sound Description',
        'genre_fusion': 'Genre Fusion',
        'neural_spectrum': 'Neural Spectrum',
        'sound_palette': 'Sound Palette',
        'tonal_identity': 'Tonal DNA',
        'rhythmic_dna': 'Rhythmic DNA',
        'timbre_dna': 'Timbre DNA',
        'emotional_fingerprint': 'Emotional Fingerprint',
        'processing_signature': 'Processing Signature',
        'sonic_architecture': 'Sonic Architecture',
        'inspirational_triggers': 'Inspirational Triggers'
    };
    return labels[key] || key;
}

// ═══════════════════════════════════════════════════════════════
// AUDIO SESSION MODAL V8
// Wrapper for the audio session experience
// ═══════════════════════════════════════════════════════════════

function AudioSessionModalV8({ audioSessionId, onClose }) {
    const [profile, setProfile] = React.useState(null);
    const [audioUrl, setAudioUrl] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    // Fetch session data
    React.useEffect(() => {
        async function fetchSession() {
            if (!audioSessionId) {
                setError('No session ID provided');
                setLoading(false);
                return;
            }

            try {
                // Fetch profile data
                const response = await fetch(`/api/audio-sessions/${audioSessionId}`);
                if (!response.ok) {
                    throw new Error('Failed to load session');
                }

                const data = await response.json();
                setProfile(data.profile || {});
                setAudioUrl(data.audioUrl);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching session:', err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchSession();
    }, [audioSessionId]);

    // Handle node selection
    const handleNodeSelect = (key, data) => {
        console.log('Node selected:', key, data);
    };

    if (loading) {
        return (
            <div className="audio-session-modal-v8">
                <div className="session-loading">
                    <div className="v8-loading-spinner" />
                    <p>Loading session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audio-session-modal-v8">
                <div className="session-header-v8">
                    <h2 className="session-title-v8">Neural Identity Map</h2>
                    <button className="session-close-v8" onClick={onClose}>
                        Close
                    </button>
                </div>
                <div className="session-content-v8">
                    <div className="v8-error-state">
                        <p className="v8-error-text">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="audio-session-modal-v8">
            <NeuralHelixV8
                profile={profile}
                audioUrl={audioUrl}
                onClose={onClose}
                onNodeSelect={handleNodeSelect}
            />
        </div>
    );
}

// Export components
window.NeuralHelixV8 = NeuralHelixV8;
window.AudioSessionModalV8 = AudioSessionModalV8;
