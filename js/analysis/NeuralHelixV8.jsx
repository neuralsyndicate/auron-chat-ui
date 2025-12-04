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
// Drop-in replacement for V7 modal - same props interface
// ═══════════════════════════════════════════════════════════════

function AudioSessionModalV8({ uploadId, synthesizedProfile, onClose, audioUrl }) {
    // Profile data from synthesized response (same as V7)
    const profile = synthesizedProfile?.profile || {};

    // Transform profile modules into format V8 renderer expects
    const transformedProfile = React.useMemo(() => {
        if (!profile) return { modules: {} };

        // Map the profile data to module format for card display
        const modules = {};

        // Sound Description
        if (profile.sound_description) {
            const sd = profile.sound_description;
            modules.sound_description = {
                label: 'Sound Description',
                title: sd.sonic_title || sd.characteristics?.sonic_title || 'Sonic Identity',
                description: sd.sonic_story || sd.characteristics?.sonic_story ||
                    (sd.characteristics ? `${sd.characteristics.primary_genre || ''} with ${sd.characteristics.mood || ''} energy` : '')
            };
        }

        // Genre Fusion
        if (profile.genre_fusion) {
            const gf = profile.genre_fusion;
            modules.genre_fusion = {
                label: 'Genre Fusion',
                title: gf.primary_genre || 'Genre Analysis',
                description: gf.genre_story || (gf.influences ? `Influenced by ${gf.influences.slice(0, 3).join(', ')}` : '')
            };
        }

        // Neural Spectrum
        if (profile.neural_spectrum) {
            const ns = profile.neural_spectrum;
            modules.neural_spectrum = {
                label: 'Neural Spectrum',
                title: 'Frequency Analysis',
                description: ns.summary || 'Spectral characteristics of your sound'
            };
        }

        // Sound Palette
        if (profile.sound_palette) {
            const sp = profile.sound_palette;
            modules.sound_palette = {
                label: 'Sound Palette',
                title: 'Timbral Colors',
                description: sp.description || (sp.primary_colors ? `Primary: ${sp.primary_colors.join(', ')}` : '')
            };
        }

        // Tonal Identity
        if (profile.tonal_identity) {
            const ti = profile.tonal_identity;
            modules.tonal_identity = {
                label: 'Tonal DNA',
                title: ti.key ? `${ti.key} ${ti.mode || ''}` : 'Harmonic Profile',
                description: ti.harmonic_story || ti.description || ''
            };
        }

        // Rhythmic DNA
        if (profile.rhythmic_dna) {
            const rd = profile.rhythmic_dna;
            modules.rhythmic_dna = {
                label: 'Rhythmic DNA',
                title: rd.tempo ? `${Math.round(rd.tempo)} BPM` : 'Rhythm Profile',
                description: rd.groove_story || rd.description || ''
            };
        }

        // Timbre DNA
        if (profile.timbre_dna) {
            const td = profile.timbre_dna;
            modules.timbre_dna = {
                label: 'Timbre DNA',
                title: 'Textural Identity',
                description: td.texture_story || td.description || ''
            };
        }

        // Emotional Fingerprint
        if (profile.emotional_fingerprint) {
            const ef = profile.emotional_fingerprint;
            modules.emotional_fingerprint = {
                label: 'Emotional Fingerprint',
                title: ef.primary_emotion || 'Emotional Arc',
                description: ef.emotional_story || ef.description || ''
            };
        }

        // Processing Signature
        if (profile.processing_signature) {
            const ps = profile.processing_signature;
            modules.processing_signature = {
                label: 'Processing Signature',
                title: 'Production DNA',
                description: ps.production_story || ps.description || ''
            };
        }

        // Sonic Architecture
        if (profile.sonic_architecture) {
            const sa = profile.sonic_architecture;
            modules.sonic_architecture = {
                label: 'Sonic Architecture',
                title: 'Structural Design',
                description: sa.architecture_story || sa.description || ''
            };
        }

        // Inspirational Triggers
        if (profile.inspirational_triggers) {
            const it = profile.inspirational_triggers;
            modules.inspirational_triggers = {
                label: 'Inspirational Triggers',
                title: 'Creative Seeds',
                description: it.trigger_story || (it.triggers ? it.triggers.slice(0, 3).join(', ') : '')
            };
        }

        return { modules, raw: profile };
    }, [profile]);

    // Handle node selection
    const handleNodeSelect = (key, data) => {
        console.log('V8 Node selected:', key, data);
    };

    return (
        <div className="audio-session-modal-v8">
            <NeuralHelixV8
                profile={transformedProfile}
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
