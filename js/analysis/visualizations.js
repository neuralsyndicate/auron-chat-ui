// ============================================================
// NEURAL IDENTITY MAP v3 - Neural Music Profile Blueprint
// Visualization Constants and Components
// ============================================================

// 11 Geometric SVG Glyphs - Neon Blueprint Aesthetic
const NEURAL_GLYPHS = {
    // 1. Sound Description - Sonic Fingerprint (concentric rings)
    'sonic-fingerprint': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
            <circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
            <circle cx="20" cy="20" r="7" stroke="currentColor" stroke-width="1" opacity="0.8"/>
            <circle cx="20" cy="20" r="3" fill="currentColor"/>
            <line x1="20" y1="3" x2="20" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="20" y1="32" x2="20" y2="37" stroke="currentColor" stroke-width="1.5"/>
        </svg>
    `,
    // 2. Genre Fusion - Overlapping Hexagons
    'blend-merge': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="15,6 23,6 27,14 23,22 15,22 11,14" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/>
            <polygon points="17,18 25,18 29,26 25,34 17,34 13,26" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.8"/>
            <line x1="19" y1="18" x2="21" y2="22" stroke="currentColor" stroke-width="1"/>
            <circle cx="20" cy="20" r="2" fill="currentColor"/>
        </svg>
    `,
    // 3. Neural Spectrum - Frequency Wave
    'frequency-wave': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="10" width="32" height="20" stroke="currentColor" stroke-width="1" fill="none" opacity="0.3"/>
            <path d="M6 20 Q10 12 14 20 T22 20 T30 20 T34 20" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4"/>
            <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
        </svg>
    `,
    // 4. Sound Palette - Constellation Nodes
    'harmonic-nodes': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="8" r="3" fill="currentColor"/>
            <circle cx="9" cy="18" r="2.5" fill="currentColor" opacity="0.8"/>
            <circle cx="31" cy="16" r="2" fill="currentColor" opacity="0.7"/>
            <circle cx="12" cy="32" r="2.5" fill="currentColor" opacity="0.8"/>
            <circle cx="28" cy="30" r="2" fill="currentColor" opacity="0.7"/>
            <line x1="20" y1="8" x2="9" y2="18" stroke="currentColor" stroke-width="0.75" opacity="0.5"/>
            <line x1="20" y1="8" x2="31" y2="16" stroke="currentColor" stroke-width="0.75" opacity="0.5"/>
            <line x1="9" y1="18" x2="12" y2="32" stroke="currentColor" stroke-width="0.75" opacity="0.5"/>
            <line x1="31" y1="16" x2="28" y2="30" stroke="currentColor" stroke-width="0.75" opacity="0.5"/>
            <line x1="12" y1="32" x2="28" y2="30" stroke="currentColor" stroke-width="0.75" opacity="0.5"/>
        </svg>
    `,
    // 5. Tonal Identity - Musical Key Symbol
    'key-scale': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <line x1="8" y1="18" x2="32" y2="18" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <line x1="8" y1="24" x2="32" y2="24" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <line x1="8" y1="30" x2="32" y2="30" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <path d="M18 8 L18 34 M15 14 L21 10 M15 20 L21 16" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="26" cy="24" r="3" fill="currentColor" opacity="0.8"/>
        </svg>
    `,
    // 6. Rhythmic DNA - Pulse/Heartbeat Pattern
    'pulse-beat': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.3"/>
            <path d="M4 20 L10 20 L13 8 L17 32 L21 12 L25 28 L28 20 L36 20" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
        </svg>
    `,
    // 7. Timbre DNA - Layered Texture Waves
    'texture-wave': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 13 Q12 8 20 13 T36 13" stroke="currentColor" stroke-width="1" fill="none" opacity="0.5"/>
            <path d="M4 20 Q12 13 20 20 T36 20" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M4 27 Q12 22 20 27 T36 27" stroke="currentColor" stroke-width="1" fill="none" opacity="0.5"/>
            <line x1="20" y1="6" x2="20" y2="34" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4"/>
        </svg>
    `,
    // 8. Emotional Fingerprint - Radial Compass
    'emotional-map': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1" fill="none" opacity="0.4"/>
            <circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="0.75" fill="none" opacity="0.6"/>
            <circle cx="20" cy="20" r="4" fill="currentColor"/>
            <line x1="20" y1="4" x2="20" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="20" y1="30" x2="20" y2="36" stroke="currentColor" stroke-width="1.5"/>
            <line x1="4" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="1.5"/>
            <line x1="30" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8.7" y1="8.7" x2="12.8" y2="12.8" stroke="currentColor" stroke-width="1" opacity="0.6"/>
            <line x1="27.2" y1="27.2" x2="31.3" y2="31.3" stroke="currentColor" stroke-width="1" opacity="0.6"/>
        </svg>
    `,
    // 9. Mix Signature - Mixer Faders
    'mix-process': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="8" x2="10" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <rect x="7" y="12" width="6" height="5" fill="currentColor"/>
            <line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <rect x="17" y="20" width="6" height="5" fill="currentColor"/>
            <line x1="30" y1="8" x2="30" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <rect x="27" y="15" width="6" height="5" fill="currentColor"/>
        </svg>
    `,
    // 10. Sonic Architecture - Stacked Blocks
    'structure-blocks': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="24" width="10" height="12" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="20" y="16" width="10" height="20" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="13" y="6" width="10" height="14" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="4" y1="36" x2="36" y2="36" stroke="currentColor" stroke-width="1"/>
        </svg>
    `,
    // 11. Inspirational Triggers - Starburst
    'spark-inspire': `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="5" fill="currentColor"/>
            <line x1="20" y1="4" x2="20" y2="12" stroke="currentColor" stroke-width="1.5"/>
            <line x1="20" y1="28" x2="20" y2="36" stroke="currentColor" stroke-width="1.5"/>
            <line x1="4" y1="20" x2="12" y2="20" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8.7" y1="8.7" x2="14.3" y2="14.3" stroke="currentColor" stroke-width="1" opacity="0.7"/>
            <line x1="25.7" y1="25.7" x2="31.3" y2="31.3" stroke="currentColor" stroke-width="1" opacity="0.7"/>
            <line x1="31.3" y1="8.7" x2="25.7" y2="14.3" stroke="currentColor" stroke-width="1" opacity="0.7"/>
            <line x1="14.3" y1="25.7" x2="8.7" y2="31.3" stroke="currentColor" stroke-width="1" opacity="0.7"/>
        </svg>
    `
};

// 11 Modules with FULL labels and glyph references
const NEURAL_MODULES = [
    { key: 'sound_description', label: 'Sound Description', glyph: 'sonic-fingerprint', angle: 0 },
    { key: 'genre_fusion', label: 'Genre Fusion', glyph: 'blend-merge', angle: 32.7 },
    { key: 'neural_spectrum', label: 'Neural Spectrum', glyph: 'frequency-wave', angle: 65.4 },
    { key: 'sound_palette', label: 'Sound Palette', glyph: 'harmonic-nodes', angle: 98.1 },
    { key: 'tonal_identity', label: 'Tonal Identity', glyph: 'key-scale', angle: 130.8 },
    { key: 'rhythmic_dna', label: 'Rhythmic DNA', glyph: 'pulse-beat', angle: 163.5 },
    { key: 'timbre_dna', label: 'Timbre DNA', glyph: 'texture-wave', angle: 196.2 },
    { key: 'emotional_fingerprint', label: 'Emotional Fingerprint', glyph: 'emotional-map', angle: 228.9 },
    { key: 'processing_signature', label: 'Mix Signature', glyph: 'mix-process', angle: 261.6 },
    { key: 'sonic_architecture', label: 'Sonic Architecture', glyph: 'structure-blocks', angle: 294.3 },
    { key: 'inspirational_triggers', label: 'Inspirational Triggers', glyph: 'spark-inspire', angle: 327 }
];

// Color helper - Blue-based palette (NO PURPLE)
function getPlacementColor(placement) {
    const colors = {
        parasympathetic: '#0066FF',  // Deep blue
        hybrid: '#00D9FF',           // Electric cyan (was purple)
        sympathetic: '#FF6B00'       // Orange
    };
    return colors[placement] || colors.hybrid;
}

function getPlacementColors(placement) {
    const colorSets = {
        parasympathetic: { primary: '#0066FF', secondary: '#00A8FF' },
        hybrid: { primary: '#00D9FF', secondary: '#00EAFF' },
        sympathetic: { primary: '#FF6B00', secondary: '#FF9500' }
    };
    return colorSets[placement] || colorSets.hybrid;
}

// ============================================================
// VISUALIZATION COMPONENTS - Neural Music Profile v3
// ============================================================

// NeuralGlyph - Renders SVG glyph by type with neon glow
function NeuralGlyph({ type, size = 40, color = 'var(--neural-primary)', className = '' }) {
    const svgContent = NEURAL_GLYPHS[type] || NEURAL_GLYPHS['sonic-fingerprint'];
    return (
        <div
            className={`neural-glyph ${className}`}
            style={{
                width: size,
                height: size,
                color: color,
                filter: `drop-shadow(0 0 8px ${color})`
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
}

// Helper to generate polygon points for emblem
const generateEmblemPoints = (cx, cy, radius, sides) => {
    const points = [];
    for (let i = 0; i < sides * 2; i++) {
        const angle = (i / (sides * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.55;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
};

// Neural Emblem - Procedural SVG with BPM pulse and rotation
// V4: Added rotating blueprint rings and particle field
function NeuralEmblem({ profile, placement, pulseDuration, rotateDuration }) {
    const c = getPlacementColors(placement);
    const stability = profile?.timbre_dna?.characteristics?.stability ?? 0.5;
    const sides = Math.floor(stability * 3) + 5; // 5-8 sides

    // V4: Generate particle positions (memoized via useMemo)
    const particles = React.useMemo(() => {
        const pts = [];
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 30 + Math.random() * 35;
            pts.push({
                x: 70 + Math.cos(angle) * radius,
                y: 70 + Math.sin(angle) * radius,
                size: 1 + Math.random() * 1.5,
                delay: i * 0.4
            });
        }
        return pts;
    }, []);

    return (
        <svg
            className="neural-emblem-svg"
            viewBox="0 0 140 140"
            style={{
                '--pulse-duration': `${pulseDuration}s`,
                '--rotate-duration': `${rotateDuration}s`
            }}
        >
            <defs>
                <radialGradient id={`emblem-grad-${placement}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={c.secondary} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={c.primary} stopOpacity="0.2" />
                </radialGradient>
                <filter id="emblem-glow-filter">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* V4: Rotating blueprint rings behind emblem */}
            <circle className="emblem-ring emblem-ring-1" cx="70" cy="70" r="55" fill="none" stroke={c.primary} strokeWidth="0.5" strokeDasharray="4 8" />
            <circle className="emblem-ring emblem-ring-2" cx="70" cy="70" r="62" fill="none" stroke={c.primary} strokeWidth="0.5" strokeDasharray="2 12" />
            <circle className="emblem-ring emblem-ring-3" cx="70" cy="70" r="48" fill="none" stroke={c.primary} strokeWidth="0.5" strokeDasharray="6 6" />

            {/* V4: Particle field */}
            <g className="emblem-particles">
                {particles.map((p, i) => (
                    <circle
                        key={`particle-${i}`}
                        className="emblem-particle"
                        cx={p.x}
                        cy={p.y}
                        r={p.size}
                        style={{ animationDelay: `${p.delay}s` }}
                    />
                ))}
            </g>

            <circle cx="70" cy="70" r="65" fill="none" stroke={c.primary} strokeWidth="1" opacity="0.3" />
            <polygon
                className="emblem-shape"
                points={generateEmblemPoints(70, 70, 45, sides)}
                fill={`url(#emblem-grad-${placement})`}
                stroke={c.secondary}
                strokeWidth="1.5"
                opacity="0.8"
                filter="url(#emblem-glow-filter)"
            />
            <circle
                className="emblem-core"
                cx="70" cy="70" r="18"
                fill={c.primary}
                opacity="0.7"
            />
        </svg>
    );
}

// Neural Player Mini - Compact player for center hub
function NeuralPlayerMini({ audioUrl, audioRef, isPlaying, setIsPlaying, currentTime, setCurrentTime, duration, setDuration }) {
    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.volume = 0.25;
        }
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * duration;
    };

    const formatTime = (t) => {
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="neural-player-mini">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onEnded={() => setIsPlaying(false)}
            />
            <button className="neural-play-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="neural-progress-bar" onClick={handleProgressClick}>
                <div
                    className="neural-progress-fill"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
            </div>
            <span className="neural-time">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// V5 SECTOR VISUALIZATIONS - Blueprint aesthetic micro-visualizations
// ═══════════════════════════════════════════════════════════════════════════════

// Sound Description: Concentric ripple field
function SoundDescriptionViz({ profile, size = 120 }) {
    const cx = size / 2, cy = size / 2;
    const rings = 5;
    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz sound-description-viz">
            {Array.from({ length: rings }).map((_, i) => (
                <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={10 + i * 15}
                    fill="none"
                    stroke="var(--neural-primary)"
                    strokeWidth="1"
                    opacity={0.15 + (rings - i) * 0.1}
                    style={{
                        animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`
                    }}
                />
            ))}
            <circle cx={cx} cy={cy} r="4" fill="var(--neural-primary)" opacity="0.8" />
        </svg>
    );
}

// Genre Fusion: Segment ring with colored arcs
function GenreFusionViz({ profile, size = 120 }) {
    const cx = size / 2, cy = size / 2;
    const genres = profile?.genre_fusion?.characteristics?.genre_proportions || {};
    const genreList = Object.entries(genres).slice(0, 4);
    const colors = ['#00D9FF', '#0066FF', '#FF6B00', '#00FF88'];
    const r = 35;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz genre-fusion-viz">
            {genreList.map(([genre, value], i) => {
                const startAngle = (i / genreList.length) * 360 - 90;
                const endAngle = ((i + 1) / genreList.length) * 360 - 90;
                const start = startAngle * Math.PI / 180;
                const end = endAngle * Math.PI / 180;
                const x1 = cx + r * Math.cos(start);
                const y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end);
                const y2 = cy + r * Math.sin(end);
                const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

                return (
                    <path
                        key={genre}
                        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity={0.4 + (value || 0.2) * 0.5}
                        style={{
                            filter: 'drop-shadow(0 0 4px ' + colors[i % colors.length] + '40)'
                        }}
                    />
                );
            })}
        </svg>
    );
}

// Neural Spectrum: Waveform arc
function NeuralSpectrumViz({ profile, size = 120 }) {
    const specValue = profile?.neural_spectrum?.value ?? 0.5;
    const points = [];
    const cx = size / 2, cy = size / 2;
    const r = 35;

    for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const angle = -140 + t * 100; // -140 to -40 degrees
        const rad = (angle - 90) * Math.PI / 180;
        const wave = Math.sin(t * Math.PI * 4) * (10 + specValue * 15);
        const x = cx + (r + wave) * Math.cos(rad);
        const y = cy + (r + wave) * Math.sin(rad);
        points.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
    }

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz neural-spectrum-viz">
            <path
                d={points.join(' ')}
                fill="none"
                stroke="url(#spectrum-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,217,255,0.5))' }}
            />
        </svg>
    );
}

// Rhythmic DNA: Timing pulses
function RhythmicDNAViz({ profile, size = 120 }) {
    const bpm = profile?.rhythmic_dna?.characteristics?.tempo_bpm || 120;
    const bpmDuration = 60 / bpm;
    const cx = size / 2, cy = size / 2;
    const r = 30;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz rhythmic-dna-viz">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--neural-primary)" strokeWidth="1" opacity="0.2" strokeDasharray="3 5" />
            <g style={{ animation: `rotate ${bpmDuration * 4}s linear infinite` }}>
                {[0, 90, 180, 270].map((angle, i) => {
                    const rad = (angle - 90) * Math.PI / 180;
                    return (
                        <circle
                            key={i}
                            cx={cx + r * Math.cos(rad)}
                            cy={cy + r * Math.sin(rad)}
                            r="4"
                            fill="var(--neural-primary)"
                            style={{
                                animation: `pulse ${bpmDuration}s ease-in-out infinite`,
                                animationDelay: `${i * bpmDuration / 4}s`
                            }}
                        />
                    );
                })}
            </g>
        </svg>
    );
}

// Timbre DNA: Wave stacks
function TimbreDNAViz({ profile, size = 120 }) {
    const chars = profile?.timbre_dna?.characteristics || {};
    const warmth = chars.warmth ?? 0.5;
    const brightness = chars.brightness ?? 0.5;
    const texture = chars.texture_complexity ?? 0.5;
    const cx = size / 2;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz timbre-dna-viz">
            {/* Warmth wave */}
            <path
                d={`M10 50 Q${cx} ${50 - warmth * 20} ${size - 10} 50`}
                fill="none"
                stroke="#FF6B00"
                strokeWidth="1.5"
                opacity="0.6"
            />
            {/* Brightness wave */}
            <path
                d={`M10 60 Q${cx} ${60 - brightness * 25} ${size - 10} 60`}
                fill="none"
                stroke="#00D9FF"
                strokeWidth="1.5"
                opacity="0.7"
            />
            {/* Texture wave */}
            <path
                d={`M10 70 Q${cx} ${70 - texture * 20} ${size - 10} 70`}
                fill="none"
                stroke="#00FF88"
                strokeWidth="1.5"
                opacity="0.5"
            />
        </svg>
    );
}

// Emotional Fingerprint: Compass wheel
function EmotionalFingerprintViz({ profile, size = 120 }) {
    const chars = profile?.emotional_fingerprint?.characteristics || {};
    const energy = chars.energy ?? 0.5;
    const valence = chars.valence ?? 0.5;
    const tension = chars.tension ?? 0.5;
    const depth = chars.depth ?? 0.5;
    const cx = size / 2, cy = size / 2;
    const maxR = 40;

    const arms = [
        { label: 'E', value: energy, angle: 0 },
        { label: 'V', value: valence, angle: 90 },
        { label: 'T', value: tension, angle: 180 },
        { label: 'D', value: depth, angle: 270 }
    ];

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz emotional-fingerprint-viz">
            {arms.map(arm => {
                const rad = (arm.angle - 90) * Math.PI / 180;
                const r = 10 + arm.value * maxR;
                return (
                    <g key={arm.label}>
                        <line
                            x1={cx}
                            y1={cy}
                            x2={cx + r * Math.cos(rad)}
                            y2={cy + r * Math.sin(rad)}
                            stroke="var(--neural-primary)"
                            strokeWidth="2"
                            opacity="0.6"
                        />
                        <circle
                            cx={cx + r * Math.cos(rad)}
                            cy={cy + r * Math.sin(rad)}
                            r="3"
                            fill="var(--neural-primary)"
                        />
                    </g>
                );
            })}
            <circle cx={cx} cy={cy} r="4" fill="var(--neural-secondary)" opacity="0.8" />
        </svg>
    );
}

// Sonic Architecture: Vertical bars
function SonicArchitectureViz({ profile, size = 120 }) {
    const sections = ['intro', 'verse', 'chorus', 'bridge', 'outro'];
    const barWidth = 12;
    const gap = 6;
    const totalWidth = sections.length * barWidth + (sections.length - 1) * gap;
    const startX = (size - totalWidth) / 2;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz sonic-architecture-viz">
            {sections.map((section, i) => {
                const height = 20 + Math.random() * 40;
                return (
                    <rect
                        key={section}
                        x={startX + i * (barWidth + gap)}
                        y={size / 2 + 20 - height}
                        width={barWidth}
                        height={height}
                        fill="url(#bar-gradient)"
                        opacity="0.7"
                        rx="2"
                        style={{
                            animation: `bar-grow 1.5s ease-out ${i * 0.1}s`
                        }}
                    />
                );
            })}
        </svg>
    );
}

// Inspirational Triggers: Spark bursts
function InspirationalTriggersViz({ profile, size = 120 }) {
    const cx = size / 2, cy = size / 2;
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        angle: (i / 12) * 360,
        r: 15 + Math.random() * 25,
        delay: Math.random() * 2,
        size: 1 + Math.random() * 2
    }));

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz inspirational-triggers-viz">
            {particles.map((p, i) => {
                const rad = (p.angle - 90) * Math.PI / 180;
                return (
                    <circle
                        key={i}
                        cx={cx + p.r * Math.cos(rad)}
                        cy={cy + p.r * Math.sin(rad)}
                        r={p.size}
                        fill="var(--neural-primary)"
                        style={{
                            animation: `twinkle 1.5s ease-in-out infinite`,
                            animationDelay: `${p.delay}s`
                        }}
                    />
                );
            })}
        </svg>
    );
}

// Sound Palette: Constellation
function SoundPaletteViz({ profile, size = 120 }) {
    const richness = profile?.sound_palette?.characteristics?.harmonic_richness ?? 0.5;
    const nodeCount = Math.floor(4 + richness * 4);
    const cx = size / 2, cy = size / 2;

    const nodes = React.useMemo(() =>
        Array.from({ length: nodeCount }).map((_, i) => ({
            x: cx + (15 + Math.random() * 30) * Math.cos((i / nodeCount) * Math.PI * 2),
            y: cy + (15 + Math.random() * 30) * Math.sin((i / nodeCount) * Math.PI * 2),
            size: 2 + Math.random() * 3
        }))
    , [nodeCount, cx, cy]);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz sound-palette-viz">
            {nodes.slice(0, -1).map((node, i) => (
                <line
                    key={`line-${i}`}
                    x1={node.x}
                    y1={node.y}
                    x2={nodes[i + 1].x}
                    y2={nodes[i + 1].y}
                    stroke="var(--neural-primary)"
                    strokeWidth="0.5"
                    opacity="0.3"
                />
            ))}
            {nodes.map((node, i) => (
                <circle
                    key={`node-${i}`}
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill="var(--neural-primary)"
                    opacity="0.7"
                />
            ))}
        </svg>
    );
}

// Tonal Identity: Quadrant display
function TonalIdentityViz({ profile, size = 120 }) {
    const chars = profile?.tonal_identity?.characteristics || {};
    const key = chars.key || 'C';
    const mode = chars.mode || 'Major';
    const cx = size / 2, cy = size / 2;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz tonal-identity-viz">
            <rect x={cx - 30} y={cy - 20} width="60" height="40" fill="none" stroke="var(--neural-primary)" strokeWidth="1" opacity="0.3" rx="4" />
            <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 20} stroke="var(--neural-primary)" strokeWidth="0.5" opacity="0.3" />
            <line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke="var(--neural-primary)" strokeWidth="0.5" opacity="0.3" />
            <text x={cx - 15} y={cy - 5} fill="var(--neural-primary)" fontSize="10" textAnchor="middle" opacity="0.8">{key}</text>
            <text x={cx + 15} y={cy + 12} fill="var(--neural-secondary)" fontSize="8" textAnchor="middle" opacity="0.6">{mode}</text>
        </svg>
    );
}

// Processing Signature: Stereo bars
function ProcessingSignatureViz({ profile, size = 120 }) {
    const chars = profile?.processing_signature?.characteristics || {};
    const width = chars.stereo_width ?? 0.5;
    const range = chars.dynamic_range ?? 0.5;
    const cx = size / 2, cy = size / 2;
    const barWidth = width * 60;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="sector-viz processing-signature-viz">
            {/* Stereo width bars */}
            <rect x={cx - barWidth / 2} y={cy - 5} width={barWidth} height="10" fill="var(--neural-primary)" opacity="0.5" rx="2" />
            {/* Dynamic range arc */}
            <path
                d={`M ${cx - 25} ${cy + 20} Q ${cx} ${cy + 20 - range * 20} ${cx + 25} ${cy + 20}`}
                fill="none"
                stroke="var(--neural-secondary)"
                strokeWidth="2"
                opacity="0.6"
            />
        </svg>
    );
}

// Visualization router component
function SectorVisualization({ moduleKey, profile }) {
    const vizMap = {
        'sound_description': SoundDescriptionViz,
        'genre_fusion': GenreFusionViz,
        'neural_spectrum': NeuralSpectrumViz,
        'sound_palette': SoundPaletteViz,
        'tonal_identity': TonalIdentityViz,
        'rhythmic_dna': RhythmicDNAViz,
        'timbre_dna': TimbreDNAViz,
        'emotional_fingerprint': EmotionalFingerprintViz,
        'processing_signature': ProcessingSignatureViz,
        'sonic_architecture': SonicArchitectureViz,
        'inspirational_triggers': InspirationalTriggersViz
    };

    const Component = vizMap[moduleKey];
    if (!Component) return null;

    return <Component profile={profile} size={100} />;
}
