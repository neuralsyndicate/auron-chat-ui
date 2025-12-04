// ============================================================
// V6 NEURAL HELIX INTERFACE - Micro-Visualizations
// Premium neon micro-visualizations for detail panel
// ============================================================

// Color helpers - Blue-based palette
function getPlacementColor(placement) {
    const colors = {
        parasympathetic: '#0066FF',
        hybrid: '#00D9FF',
        sympathetic: '#FF6B00'
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
// V6 MICRO-VISUALIZATIONS - Premium neon aesthetic
// ============================================================

// Sound Description: Pulse burst rings with bloom
function SoundDescriptionMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    const rings = 4;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz sound-description-micro">
            <defs>
                <filter id="pulse-bloom" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#00D9FF" floodOpacity="0.5" />
                    <feComposite operator="in" in2="blur" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {Array.from({ length: rings }).map((_, i) => (
                <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={20 + i * 20}
                    fill="none"
                    stroke="#00D9FF"
                    strokeWidth="1.5"
                    opacity={0.8 - i * 0.15}
                    filter="url(#pulse-bloom)"
                    style={{
                        animation: `pulse-ring ${2 + i * 0.4}s ease-out infinite`,
                        animationDelay: `${i * 0.25}s`,
                        transformOrigin: `${cx}px ${cy}px`
                    }}
                />
            ))}
            <circle
                cx={cx}
                cy={cy}
                r="10"
                fill="#00D9FF"
                filter="url(#pulse-bloom)"
            />
        </svg>
    );
}

// Genre Fusion: Neon donut wheel
function GenreFusionMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    // Handle both array format and object with genres property
    let rawGenres = [];
    if (Array.isArray(data)) {
        rawGenres = data;
    } else if (data?.characteristics?.genres && Array.isArray(data.characteristics.genres)) {
        rawGenres = data.characteristics.genres.map((g, i) => ({ genre: g, weight: 1 / data.characteristics.genres.length }));
    } else if (Array.isArray(data?.genres)) {
        rawGenres = data.genres;
    }
    const genres = rawGenres.slice(0, 5);
    const colors = ['#00D9FF', '#0066FF', '#00FF88', '#FF6B00', '#FF4488'];
    const r = 55;
    const strokeWidth = 14;

    if (genres.length === 0) {
        return (
            <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz genre-fusion-micro">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
            </svg>
        );
    }

    let accumulated = 0;
    const total = genres.reduce((sum, g) => sum + (typeof g.weight === 'number' && !isNaN(g.weight) ? g.weight : 0.2), 0) || 1;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz genre-fusion-micro">
            <defs>
                <filter id="genre-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {genres.map((genre, i) => {
                const weight = genre.weight || 0.2;
                const startAngle = (accumulated / total) * 360 - 90;
                accumulated += weight;
                const endAngle = (accumulated / total) * 360 - 90;
                const start = startAngle * Math.PI / 180;
                const end = endAngle * Math.PI / 180;
                const x1 = cx + r * Math.cos(start);
                const y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end);
                const y2 = cy + r * Math.sin(end);
                const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
                const color = colors[i % colors.length];

                return (
                    <path
                        key={i}
                        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        opacity={0.7 + weight * 0.3}
                        filter="url(#genre-glow)"
                        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                    />
                );
            })}
        </svg>
    );
}

// Neural Spectrum: Blue-White-Orange gradient bar
function NeuralSpectrumMicro({ data, size = 160 }) {
    const rawValue = data?.value ?? data?.intensity ?? 0.5;
    const specValue = typeof rawValue === 'number' && !isNaN(rawValue) ? Math.max(0, Math.min(1, rawValue)) : 0.5;
    const placement = data?.placement || 'hybrid';
    const cx = size / 2, cy = size / 2;
    const barWidth = size * 0.75;
    const barHeight = 12;
    const markerPos = specValue * barWidth;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz neural-spectrum-micro">
            <defs>
                <linearGradient id="spectrum-bar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0066FF" />
                    <stop offset="50%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>
                <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="4" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Track */}
            <rect
                x={(size - barWidth) / 2}
                y={cy - barHeight / 2}
                width={barWidth}
                height={barHeight}
                rx={barHeight / 2}
                fill="url(#spectrum-bar-grad)"
                opacity="0.4"
            />
            {/* Marker */}
            <circle
                cx={(size - barWidth) / 2 + markerPos}
                cy={cy}
                r="10"
                fill={getPlacementColor(placement)}
                filter="url(#marker-glow)"
                style={{ filter: `drop-shadow(0 0 12px ${getPlacementColor(placement)})` }}
            />
            {/* Labels */}
            <text x={(size - barWidth) / 2} y={cy + 30} fill="#0066FF" fontSize="10" opacity="0.7">Calm</text>
            <text x={(size + barWidth) / 2} y={cy + 30} fill="#FF6B00" fontSize="10" textAnchor="end" opacity="0.7">Energy</text>
        </svg>
    );
}

// Sound Palette: Orbital constellation dots
function SoundPaletteMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    const rawRichness = data?.characteristics?.harmonic_richness ?? data?.harmonic_richness ?? 0.5;
    const richness = typeof rawRichness === 'number' && !isNaN(rawRichness) ? Math.max(0, Math.min(1, rawRichness)) : 0.5;
    const nodeCount = Math.max(5, Math.floor(5 + richness * 5));

    const nodes = React.useMemo(() =>
        Array.from({ length: nodeCount }).map((_, i) => {
            const angle = (i / nodeCount) * Math.PI * 2;
            const r = 25 + Math.sin(i * 2.5) * 15 + Math.random() * 10;
            return {
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle),
                size: 3 + Math.random() * 4,
                delay: i * 0.2
            };
        })
    , [nodeCount, cx, cy]);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz sound-palette-micro">
            <defs>
                <filter id="orbit-glow">
                    <feGaussianBlur stdDeviation="2" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Orbital path */}
            <circle cx={cx} cy={cy} r="35" fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
            {/* Connection lines */}
            {nodes.slice(0, -1).map((node, i) => (
                <line
                    key={`line-${i}`}
                    x1={node.x}
                    y1={node.y}
                    x2={nodes[i + 1].x}
                    y2={nodes[i + 1].y}
                    stroke="#00D9FF"
                    strokeWidth="0.5"
                    opacity="0.25"
                />
            ))}
            {/* Nodes */}
            {nodes.map((node, i) => (
                <circle
                    key={`node-${i}`}
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill="#00D9FF"
                    filter="url(#orbit-glow)"
                    style={{
                        animation: `twinkle 2s ease-in-out infinite`,
                        animationDelay: `${node.delay}s`
                    }}
                />
            ))}
        </svg>
    );
}

// Tonal DNA: 2D quadrant with position marker
function TonalDNAMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    // Safely extract values with fallback to center (0.5)
    const rawDarkBright = data?.dark_bright ?? data?.characteristics?.dark_bright ?? 0.5;
    const rawMinMax = data?.minimal_maximal ?? data?.characteristics?.minimal_maximal ?? 0.5;
    const darkBright = typeof rawDarkBright === 'number' && !isNaN(rawDarkBright) ? Math.max(0, Math.min(1, rawDarkBright)) : 0.5;
    const minimalMaximal = typeof rawMinMax === 'number' && !isNaN(rawMinMax) ? Math.max(0, Math.min(1, rawMinMax)) : 0.5;
    const quadSize = 100;

    // Map values to quadrant position
    const markerX = cx - quadSize / 2 + darkBright * quadSize;
    const markerY = cy + quadSize / 2 - minimalMaximal * quadSize;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz tonal-dna-micro">
            <defs>
                <filter id="quad-glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Quadrant grid */}
            <rect
                x={cx - quadSize / 2}
                y={cy - quadSize / 2}
                width={quadSize}
                height={quadSize}
                fill="none"
                stroke="#00D9FF"
                strokeWidth="1"
                opacity="0.2"
            />
            {/* Cross lines */}
            <line x1={cx} y1={cy - quadSize / 2} x2={cx} y2={cy + quadSize / 2} stroke="#00D9FF" strokeWidth="0.5" opacity="0.3" />
            <line x1={cx - quadSize / 2} y1={cy} x2={cx + quadSize / 2} y2={cy} stroke="#00D9FF" strokeWidth="0.5" opacity="0.3" />
            {/* Labels */}
            <text x={cx - quadSize / 2 - 5} y={cy} fill="#00D9FF" fontSize="8" textAnchor="end" opacity="0.6">Dark</text>
            <text x={cx + quadSize / 2 + 5} y={cy} fill="#00D9FF" fontSize="8" opacity="0.6">Bright</text>
            <text x={cx} y={cy - quadSize / 2 - 5} fill="#00D9FF" fontSize="8" textAnchor="middle" opacity="0.6">Maximal</text>
            <text x={cx} y={cy + quadSize / 2 + 12} fill="#00D9FF" fontSize="8" textAnchor="middle" opacity="0.6">Minimal</text>
            {/* Position marker */}
            <circle
                cx={markerX}
                cy={markerY}
                r="8"
                fill="#00D9FF"
                filter="url(#quad-glow)"
                style={{ filter: 'drop-shadow(0 0 10px #00D9FF)' }}
            />
        </svg>
    );
}

// Rhythmic DNA: Circular arc with pulse points
function RhythmicDNAMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    const rawBpm = data?.characteristics?.tempo_bpm ?? data?.tempo_bpm ?? data?.bpm ?? 120;
    const bpm = typeof rawBpm === 'number' && !isNaN(rawBpm) && rawBpm > 0 ? Math.round(rawBpm) : 120;
    const r = 50;
    const pulseCount = 8;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz rhythmic-dna-micro">
            <defs>
                <filter id="rhythm-glow">
                    <feGaussianBlur stdDeviation="2" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Outer arc */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00D9FF" strokeWidth="2" opacity="0.3" />
            {/* Inner arc */}
            <circle cx={cx} cy={cy} r={r - 15} fill="none" stroke="#0066FF" strokeWidth="1" opacity="0.2" strokeDasharray="4 8" />
            {/* Pulse points */}
            {Array.from({ length: pulseCount }).map((_, i) => {
                const angle = (i / pulseCount) * Math.PI * 2 - Math.PI / 2;
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                const pulseDelay = (60 / bpm) * (i / pulseCount);

                return (
                    <circle
                        key={i}
                        cx={px}
                        cy={py}
                        r="5"
                        fill="#00D9FF"
                        filter="url(#rhythm-glow)"
                        style={{
                            animation: `pulse 0.5s ease-in-out infinite`,
                            animationDelay: `${pulseDelay}s`
                        }}
                    />
                );
            })}
            {/* BPM text */}
            <text x={cx} y={cy + 5} fill="#00D9FF" fontSize="14" fontWeight="600" textAnchor="middle">{bpm}</text>
            <text x={cx} y={cy + 18} fill="#00D9FF" fontSize="8" textAnchor="middle" opacity="0.6">BPM</text>
        </svg>
    );
}

// Timbre DNA: Layered wave forms
function TimbreDNAMicro({ data, size = 160 }) {
    const chars = data?.characteristics || {};
    const warmth = chars.warmth ?? 0.5;
    const brightness = chars.brightness ?? 0.5;
    const stability = chars.stability ?? 0.5;
    const cx = size / 2;

    const generateWave = (yBase, amplitude, frequency, phase = 0) => {
        let path = '';
        for (let x = 20; x <= size - 20; x += 2) {
            const t = (x - 20) / (size - 40);
            const y = yBase + Math.sin(t * Math.PI * frequency + phase) * amplitude;
            path += x === 20 ? `M${x},${y}` : ` L${x},${y}`;
        }
        return path;
    };

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz timbre-dna-micro">
            <defs>
                <filter id="wave-glow">
                    <feGaussianBlur stdDeviation="2" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Warmth wave (orange) */}
            <path
                d={generateWave(50, 8 + warmth * 12, 3, 0)}
                fill="none"
                stroke="#FF6B00"
                strokeWidth="2"
                opacity="0.7"
                filter="url(#wave-glow)"
            />
            {/* Brightness wave (cyan) */}
            <path
                d={generateWave(80, 8 + brightness * 15, 4, Math.PI / 3)}
                fill="none"
                stroke="#00D9FF"
                strokeWidth="2"
                opacity="0.8"
                filter="url(#wave-glow)"
            />
            {/* Stability wave (blue) */}
            <path
                d={generateWave(110, 5 + stability * 10, 2, Math.PI / 2)}
                fill="none"
                stroke="#0066FF"
                strokeWidth="1.5"
                opacity="0.6"
                filter="url(#wave-glow)"
            />
        </svg>
    );
}

// Emotional Fingerprint: Blue/Orange polar field
function EmotionalFingerprintMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    // Handle various data formats
    let nodes = [];
    if (Array.isArray(data?.nodes)) {
        nodes = data.nodes;
    } else if (Array.isArray(data)) {
        nodes = data;
    } else if (data?.characteristics?.emotions && Array.isArray(data.characteristics.emotions)) {
        nodes = data.characteristics.emotions;
    }
    const maxR = 55;

    // Default emotional axes if no nodes
    const defaultAxes = [
        { label: 'Joy', angle: 0, value: 0.6, color: '#00D9FF' },
        { label: 'Energy', angle: 60, value: 0.5, color: '#FF6B00' },
        { label: 'Tension', angle: 120, value: 0.4, color: '#FF4488' },
        { label: 'Melancholy', angle: 180, value: 0.3, color: '#0066FF' },
        { label: 'Calm', angle: 240, value: 0.5, color: '#00FF88' },
        { label: 'Wonder', angle: 300, value: 0.4, color: '#00D9FF' }
    ];

    const axisCount = Math.max(1, Math.min(nodes.length, 6));
    const axes = nodes.length > 0
        ? nodes.slice(0, 6).map((n, i) => {
            const rawValue = n.intensity ?? n.value ?? 0.5;
            const safeValue = typeof rawValue === 'number' && !isNaN(rawValue) ? Math.max(0, Math.min(1, rawValue)) : 0.5;
            return {
                label: n.label || n.emotion || `E${i}`,
                angle: (i / axisCount) * 360,
                value: safeValue,
                color: i % 2 === 0 ? '#00D9FF' : '#FF6B00'
            };
        })
        : defaultAxes;

    // Generate shape path
    const shapePath = axes.map((axis, i) => {
        const rad = (axis.angle - 90) * Math.PI / 180;
        const r = 15 + axis.value * maxR;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return i === 0 ? `M${x},${y}` : `L${x},${y}`;
    }).join(' ') + ' Z';

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz emotional-fingerprint-micro">
            <defs>
                <filter id="emotion-glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id="emotion-fill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0.1" />
                </radialGradient>
            </defs>
            {/* Grid circles */}
            <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.2" />
            <circle cx={cx} cy={cy} r={maxR * 0.66} fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.15" />
            <circle cx={cx} cy={cy} r={maxR * 0.33} fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.1" />
            {/* Axis lines */}
            {axes.map((axis, i) => {
                const rad = (axis.angle - 90) * Math.PI / 180;
                return (
                    <line
                        key={`axis-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={cx + maxR * Math.cos(rad)}
                        y2={cy + maxR * Math.sin(rad)}
                        stroke="#00D9FF"
                        strokeWidth="0.5"
                        opacity="0.2"
                    />
                );
            })}
            {/* Shape fill */}
            <path d={shapePath} fill="url(#emotion-fill)" stroke="#00D9FF" strokeWidth="1.5" filter="url(#emotion-glow)" />
            {/* Node dots */}
            {axes.map((axis, i) => {
                const rad = (axis.angle - 90) * Math.PI / 180;
                const r = 15 + axis.value * maxR;
                return (
                    <circle
                        key={`dot-${i}`}
                        cx={cx + r * Math.cos(rad)}
                        cy={cy + r * Math.sin(rad)}
                        r="4"
                        fill={axis.color}
                        filter="url(#emotion-glow)"
                    />
                );
            })}
        </svg>
    );
}

// Processing Signature: Brainwave EQ pattern
function ProcessingSignatureMicro({ data, size = 160 }) {
    const techniques = Array.isArray(data) ? data : [];
    const cx = size / 2;

    // Generate EQ-style brainwave
    const generateEQ = () => {
        let path = '';
        const points = 30;
        for (let i = 0; i <= points; i++) {
            const x = 20 + (i / points) * (size - 40);
            const baseline = size / 2;
            const amplitude = 15 + Math.random() * 20;
            const y = baseline + Math.sin(i * 0.8) * amplitude * (0.5 + Math.random() * 0.5);
            path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
        }
        return path;
    };

    const eqPath = React.useMemo(() => generateEQ(), []);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz processing-signature-micro">
            <defs>
                <filter id="eq-glow">
                    <feGaussianBlur stdDeviation="2" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="eq-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0066FF" />
                    <stop offset="50%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#00FF88" />
                </linearGradient>
            </defs>
            {/* Baseline */}
            <line x1="20" y1={size / 2} x2={size - 20} y2={size / 2} stroke="#00D9FF" strokeWidth="0.5" opacity="0.2" />
            {/* EQ wave */}
            <path
                d={eqPath}
                fill="none"
                stroke="url(#eq-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#eq-glow)"
            />
            {/* Technique count */}
            {techniques.length > 0 && (
                <g>
                    <text x={cx} y={size - 20} fill="#00D9FF" fontSize="10" textAnchor="middle" opacity="0.7">
                        {techniques.length} techniques
                    </text>
                </g>
            )}
        </svg>
    );
}

// Sonic Architecture: Vertical frequency bars
function SonicArchitectureMicro({ data, size = 160 }) {
    const layering = data?.layering_approach || 'balanced';
    const tension = data?.tension_release || 0.5;
    const barCount = 12;
    const barWidth = 8;
    const gap = 4;
    const totalWidth = barCount * barWidth + (barCount - 1) * gap;
    const startX = (size - totalWidth) / 2;
    const maxHeight = 80;

    const bars = React.useMemo(() =>
        Array.from({ length: barCount }).map((_, i) => {
            // Create a frequency-like distribution
            const center = barCount / 2;
            const dist = Math.abs(i - center) / center;
            const baseHeight = (1 - dist * 0.6) * maxHeight;
            const variation = Math.random() * 15;
            return baseHeight + variation;
        })
    , []);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz sonic-architecture-micro">
            <defs>
                <linearGradient id="bar-gradient-v6" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#00D9FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00EAFF" stopOpacity="1" />
                </linearGradient>
                <filter id="bar-glow">
                    <feGaussianBlur stdDeviation="2" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {bars.map((height, i) => (
                <rect
                    key={i}
                    x={startX + i * (barWidth + gap)}
                    y={size / 2 + 20 - height}
                    width={barWidth}
                    height={height}
                    fill="url(#bar-gradient-v6)"
                    rx="2"
                    filter="url(#bar-glow)"
                    style={{
                        animation: `bar-grow 0.8s ease-out forwards`,
                        animationDelay: `${i * 0.05}s`,
                        transformOrigin: `${startX + i * (barWidth + gap) + barWidth / 2}px ${size / 2 + 20}px`
                    }}
                />
            ))}
            {/* Baseline */}
            <line x1={startX - 5} y1={size / 2 + 20} x2={startX + totalWidth + 5} y2={size / 2 + 20} stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
        </svg>
    );
}

// Inspirational Triggers: Radial hub with spokes
function InspirationalTriggersMicro({ data, size = 160 }) {
    const cx = size / 2, cy = size / 2;
    const sources = data?.sources || [];
    const spokeCount = Math.max(6, Math.min(12, sources.length || 8));

    const spokes = React.useMemo(() =>
        Array.from({ length: spokeCount }).map((_, i) => ({
            angle: (i / spokeCount) * 360,
            length: 25 + Math.random() * 25,
            delay: i * 0.1,
            size: 2 + Math.random() * 3
        }))
    , [spokeCount]);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="micro-viz inspirational-triggers-micro">
            <defs>
                <filter id="spark-glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id="hub-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0.2" />
                </radialGradient>
            </defs>
            {/* Central hub */}
            <circle cx={cx} cy={cy} r="12" fill="url(#hub-gradient)" filter="url(#spark-glow)" />
            {/* Spokes */}
            {spokes.map((spoke, i) => {
                const rad = (spoke.angle - 90) * Math.PI / 180;
                const x1 = cx + 15 * Math.cos(rad);
                const y1 = cy + 15 * Math.sin(rad);
                const x2 = cx + (15 + spoke.length) * Math.cos(rad);
                const y2 = cy + (15 + spoke.length) * Math.sin(rad);

                return (
                    <g key={i}>
                        <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#00D9FF"
                            strokeWidth="1"
                            opacity="0.4"
                        />
                        <circle
                            cx={x2}
                            cy={y2}
                            r={spoke.size}
                            fill="#00D9FF"
                            filter="url(#spark-glow)"
                            style={{
                                animation: `twinkle 1.5s ease-in-out infinite`,
                                animationDelay: `${spoke.delay}s`
                            }}
                        />
                    </g>
                );
            })}
        </svg>
    );
}

// ============================================================
// MICRO-VISUALIZATION ROUTER - V6 Interface
// ============================================================

// Helper to ensure a value is a valid number, with fallback
function safeNumber(value, fallback = 0) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) || !isFinite(num) ? fallback : num;
}

// Helper to clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(safeNumber(value, (min + max) / 2), min), max);
}

function MicroVisualization({ moduleKey, data }) {
    const vizMap = {
        'sound_description': SoundDescriptionMicro,
        'genre_fusion': GenreFusionMicro,
        'neural_spectrum': NeuralSpectrumMicro,
        'sound_palette': SoundPaletteMicro,
        'tonal_identity': TonalDNAMicro,
        'rhythmic_dna': RhythmicDNAMicro,
        'timbre_dna': TimbreDNAMicro,
        'emotional_fingerprint': EmotionalFingerprintMicro,
        'processing_signature': ProcessingSignatureMicro,
        'sonic_architecture': SonicArchitectureMicro,
        'inspirational_triggers': InspirationalTriggersMicro
    };

    const Component = vizMap[moduleKey];
    if (!Component) return null;

    // Wrap in error boundary-like try/catch for rendering safety
    try {
        return (
            <div className="micro-visualization-container">
                <Component data={data} size={160} />
            </div>
        );
    } catch (e) {
        console.warn('MicroVisualization render error:', moduleKey, e);
        return null;
    }
}

// ============================================================
// LEGACY COMPATIBILITY - SectorVisualization alias
// ============================================================
function SectorVisualization({ moduleKey, profile }) {
    return <MicroVisualization moduleKey={moduleKey} data={profile?.[moduleKey]} />;
}
