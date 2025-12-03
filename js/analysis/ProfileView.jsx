// ============================================================
// PROFILE VIEW - Neural Music Profile with D3 Visualizations
// ============================================================

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

function ProfileView({ user, isLocked, conversationCount }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            // Get authentication token
            const token = await getAuthToken();
            if (!token) {
                console.error('No authentication token available');
                throw new Error('Authentication required');
            }

            // Call BFF API with JWT authentication
            const response = await fetch(`${BFF_API_BASE}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Profile fetch failed with status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                console.error('Error details:', errorData);
                throw new Error('Profile not found');
            }

            const data = await response.json();
            console.log('Profile loaded successfully from BFF:', data);
            setProfile(data);
        } catch (err) {
            console.error('Failed to load profile:', err);
            // Set empty profile on error
            setProfile({
                dimensions: {
                    sound_description: null,
                    sonic_title: "EMERGING IDENTITY",
                    genre_fusion: [],
                    neural_spectrum: [],
                    sound_palette: [],
                    tonal_dna: [],
                    rhythmic_dna: [],
                    emotional_fingerprint: [],
                    processing_signature: [],
                    inspirational_triggers: [],
                    sonic_architecture: []
                },
                conversation_count: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading your Neural Music Profile...</p>
                </div>
            </div>
        );
    }

    const dims = profile?.dimensions || {};

    // Handle nested sound_description object
    const soundDescObj = dims.sound_description || {};
    const sonicTitle = soundDescObj.sonic_title || 'EMERGING IDENTITY';
    const soundDescription = soundDescObj.description || soundDescObj.sonic_description || null;

    // Handle neural_spectrum object (has position and direction)
    const neuralSpectrum = dims.neural_spectrum || {};

    // Extract nested arrays and objects from the actual data structure
    const genreFusion = dims.genre_fusion || [];
    const soundPalette = dims.sound_palette || [];

    // tonal_dna is an object with numeric properties, not an array
    const tonalDNA = dims.tonal_dna || {};
    const rhythmicDNA = dims.rhythmic_dna || {};

    // emotional_fingerprint.nodes is the array
    const emotionalFingerprint = (dims.emotional_fingerprint?.nodes) || [];

    const processingSignature = dims.processing_signature || [];

    // inspirational_triggers.sources is the array
    const inspirationalTriggers = (dims.inspirational_triggers?.sources) || [];

    // sonic_architecture is an object with layering_approach and tension_release
    const sonicArchitecture = dims.sonic_architecture || {};

    return (
        <div className="h-full overflow-y-auto relative" style={{ background: '#000' }}>
            {/* Content */}
            <div className={`p-12 ${isLocked ? 'filter blur-md' : ''}`}>
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold glow mb-2" style={{
                            background: 'linear-gradient(135deg, #00A8FF 0%, #005CFF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.05em'
                        }}>
                            NEURAL MUSIC PROFILE
                        </h1>
                        <p className="text-gray-500 text-sm">Mapping the inner architecture of sound and mind</p>
                    </div>

                    {/* Top Row: Sonic Title + Genre Fusion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sonic Title Card */}
                        <div className="card-glow rounded-xl p-8" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Sonic Title</p>
                            <h2 className="text-3xl font-black glow mb-4" style={{
                                background: 'linear-gradient(135deg, #00A8FF 0%, #005CFF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {sonicTitle}
                            </h2>
                            {soundDescription && (
                                <p className="text-gray-400 text-sm leading-relaxed">{soundDescription}</p>
                            )}
                            {!soundDescription && (
                                <p className="text-gray-600 text-sm italic">Your sonic identity is emerging...</p>
                            )}
                        </div>

                        {/* Genre Fusion Ring */}
                        <div className="card-glow rounded-xl p-8" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Sonic Code / Genre Fusion</p>
                            <GenreFusionRing data={genreFusion} />
                        </div>
                    </div>

                    {/* Neural Spectrum - Full Width */}
                    <div className="card-glow rounded-xl p-8" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Neural Spectrum</p>
                        <NeuralSpectrumBar data={neuralSpectrum} />
                    </div>

                    {/* Middle Row: Sound System + Tonal DNA + Rhythmic DNA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="card-glow rounded-xl p-6" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Sound System</p>
                            <SoundPaletteOrbital data={soundPalette} />
                        </div>

                        <div className="card-glow rounded-xl p-6" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Tonal DNA</p>
                            <TonalDNAQuadrant data={tonalDNA} />
                        </div>

                        <div className="card-glow rounded-xl p-6" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Rhythmic DNA</p>
                            <RhythmicDNAWaveform data={rhythmicDNA} />
                        </div>
                    </div>

                    {/* Emotional & Psychological Section */}
                    <div className="card-glow rounded-xl p-8" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-6">Emotional & Psychological</p>
                        <EmotionalBubbleNetwork data={emotionalFingerprint} />
                    </div>

                    {/* Bottom Row: Processing Signature + Inspirational Triggers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="card-glow rounded-xl p-6" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Processing Signature</p>
                            <DataList data={processingSignature} />
                        </div>

                        <div className="card-glow rounded-xl p-6" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">Inspirational Triggers</p>
                            <InspirationalConstellation data={inspirationalTriggers} />
                        </div>
                    </div>

                    {/* Sonic Architecture Tower */}
                    <div className="card-glow rounded-xl p-8" style={{ background: 'rgba(10, 10, 20, 0.6)' }}>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-6 text-center">Sonic Architecture</p>
                        <SonicArchitectureTower data={sonicArchitecture} />
                    </div>

                    {/* Conversation Count Footer */}
                    <div className="text-center">
                        <p className="text-gray-600 text-sm">
                            Built from <span className="text-primary font-semibold">{profile?.conversation_count || 0}</span> conversations with Auron
                        </p>
                    </div>
                </div>
            </div>

            {/* Lock Overlay */}
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}>
                    <div className="text-center max-w-lg p-12 card-glow rounded-2xl" style={{ background: 'rgba(10, 10, 15, 0.95)' }}>
                        <div className="text-7xl mb-6">🔒</div>
                        <h2 className="text-4xl font-black mb-4 glow" style={{
                            background: 'linear-gradient(135deg, #00A8FF 0%, #005CFF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            PROFILE LOCKED
                        </h2>
                        <p className="text-gray-300 text-lg mb-2">
                            Have <span className="text-primary font-bold">{UNLOCK_THRESHOLD - conversationCount} more conversations</span> with Auron to unlock
                        </p>
                        <p className="text-gray-500 text-sm mb-6">
                            Every conversation builds your 10-dimensional sonic identity
                        </p>
                        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(conversationCount / UNLOCK_THRESHOLD) * 100}%`,
                                    background: 'linear-gradient(90deg, #00D9FF 0%, #00BFFF 100%)'
                                }}
                            />
                        </div>
                        <p className="text-gray-400 text-sm">
                            {conversationCount} / {UNLOCK_THRESHOLD} conversations
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// D3 VISUALIZATIONS
// ============================================================

// 1. Genre Fusion Ring - Circular ring divided into 8 segments
function GenreFusionRing({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 320;
        const height = 320;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width/2}, ${height/2})`);

        const pie = d3.pie().value(d => d.weight || 1).padAngle(0.02);
        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.9);

        const arcs = svg.selectAll('arc')
            .data(pie(data.slice(0, 8)))
            .enter()
            .append('g');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => d3.interpolateCool(i / 8))
            .attr('stroke', '#00A8FF')
            .attr('stroke-width', 2)
            .style('opacity', 0.7)
            .style('filter', 'drop-shadow(0 0 8px rgba(0, 168, 255, 0.5))');

        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', '#FFF')
            .text(d => (d.data.name || d.data.genre || '').substring(0, 8));
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No genre data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 2. Neural Spectrum Bar - Horizontal bar with waveform gradient
function NeuralSpectrumBar({ data }) {
    const vizRef = useRef(null);

    // Extract value, placement, intensity from data object (v5 Neural Spectrum)
    const position = typeof data === 'object' ? (data.value ?? data.position ?? 0.5) : 0.5;
    const placement = typeof data === 'object' ? (data.placement || 'hybrid') : 'hybrid';
    const intensity = typeof data === 'object' ? (data.intensity || 'medium') : 'medium';

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        const width = vizRef.current.clientWidth || 800;
        const height = 120;
        const points = 200;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Gradient bar - color shifts based on position
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'spectrum-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#005CFF')
            .attr('stop-opacity', 0.8);

        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', '#00A8FF')
            .attr('stop-opacity', 0.6);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#AD00FF')
            .attr('stop-opacity', 0.8);

        // Waveform
        const xScale = d3.scaleLinear().domain([0, points]).range([0, width]);
        const yScale = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d))
            .curve(d3.curveBasis);

        // Generate wave based on position (0.0 = parasympathetic/slow, 1.0 = sympathetic/fast)
        // Sympathetic: faster, sharper waves (aroused, alert)
        // Parasympathetic: slower, smoother waves (calm, relaxed)
        // Hybrid: medium speed (balanced)
        function generateWave(time) {
            return d3.range(points).map(i => {
                const x = i / points;

                // Frequency increases with position (sympathetic = faster)
                // Range: 3-12 Hz to show dramatic difference
                const baseFrequency = 3 + (position * 9); // 0.0 -> 3Hz, 1.0 -> 12Hz

                // Animation speed increases with position (sympathetic = more rapid)
                const animSpeed = 0.005 + (position * 0.015); // 0.005-0.020

                // Amplitude: parasympathetic = wider waves, sympathetic = tighter/sharper
                const amplitude1 = 0.5 - (position * 0.2); // 0.5 -> 0.3
                const amplitude2 = 0.1 + (position * 0.2); // 0.1 -> 0.3

                // Main wave (slower for parasympathetic, faster for sympathetic)
                const wave1 = Math.sin((x * baseFrequency + time * animSpeed) * Math.PI) * amplitude1;

                // Secondary wave (adds sharpness for sympathetic)
                const secondaryFreq = baseFrequency * (1 + position); // More harmonics in sympathetic
                const wave2 = Math.sin((x * secondaryFreq + time * animSpeed * 2) * Math.PI) * amplitude2;

                // Noise component (more chaotic in sympathetic state)
                const noise = (Math.random() - 0.5) * 0.05 * position;

                return wave1 + wave2 + noise;
            });
        }

        const path = svg.append('path')
            .attr('fill', 'none')
            .attr('stroke', 'url(#spectrum-gradient)')
            .attr('stroke-width', 3)
            .style('filter', 'drop-shadow(0 0 12px rgba(0, 168, 255, 0.8))');

        // Position indicator
        const markerX = position * width;
        svg.append('line')
            .attr('x1', markerX)
            .attr('x2', markerX)
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#00FFFF')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4')
            .style('opacity', 0.6);

        let time = 0;
        function animate() {
            time += 1;
            path.attr('d', line(generateWave(time)));
            requestAnimationFrame(animate);
        }
        animate();
    }, [data, position]);

    // Trust DSP placement directly - no position-based thresholds
    // Position (value) is only for slider UI, placement is the truth
    const getStateLabel = () => {
        return placement.charAt(0).toUpperCase() + placement.slice(1);
    };

    // Color based on DSP placement only
    const getStateColor = () => {
        if (placement === 'parasympathetic') return '#005CFF';
        if (placement === 'sympathetic') return '#AD00FF';
        return '#00A8FF'; // hybrid
    };

    // Description based on DSP placement only
    const getDescription = () => {
        if (placement === 'parasympathetic') return 'Calm, relaxed, slower waves';
        if (placement === 'sympathetic') return 'Aroused, alert, faster waves';
        return 'Balanced, medium energy'; // hybrid
    };

    return (
        <div className="w-full">
            <div ref={vizRef} className="w-full neural-glow mb-2"></div>
            {/* 3-Zone Labels */}
            <div className="flex justify-between items-center text-xs px-2 mb-1" style={{ opacity: 0.6 }}>
                <span>Parasympathetic</span>
                <span>Hybrid</span>
                <span>Sympathetic</span>
            </div>
            {/* State + Percentage + Intensity */}
            <div className="flex justify-center items-center gap-2 text-sm">
                <span style={{ color: getStateColor(), fontWeight: 600 }}>
                    {getStateLabel()}
                </span>
                <span style={{ opacity: 0.7 }}>
                    ({(position * 100).toFixed(0)}%)
                </span>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.4rem',
                    background: 'rgba(0, 217, 255, 0.15)',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                }}>
                    {intensity}
                </span>
            </div>
            <div className="text-center text-xs text-gray-600 mt-1">
                {getDescription()}
            </div>
        </div>
    );
}

// 3. Sound Palette Orbital - Orbital visualization with rotating nodes
function SoundPaletteOrbital({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 280;
        const height = 240;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Draw 3 orbital rings
        [60, 90, 120].forEach((r, idx) => {
            svg.append('circle')
                .attr('cx', width / 2)
                .attr('cy', height / 2)
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#00A8FF')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.3);
        });

        // Place nodes on orbits
        const nodes = data.slice(0, 12).map((d, i) => {
            const orbit = [60, 90, 120][i % 3];
            const angle = (i / (data.length / 3)) * 2 * Math.PI;
            return {
                ...d,
                x: width / 2 + orbit * Math.cos(angle),
                y: height / 2 + orbit * Math.sin(angle),
                r: 8 + (d.weight || 1) * 2
            };
        });

        const nodeGroups = svg.selectAll('g.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        nodeGroups.append('circle')
            .attr('r', d => d.r)
            .attr('fill', '#00A8FF')
            .attr('stroke', '#005CFF')
            .attr('stroke-width', 2)
            .style('opacity', 0.8)
            .style('filter', 'drop-shadow(0 0 6px rgba(0, 168, 255, 0.8))');

        nodeGroups.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 4)
            .attr('font-size', '8px')
            .attr('fill', '#000')
            .attr('font-weight', 'bold')
            .text(d => (d.name || d.sound || '').substring(0, 4));
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No sound data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 4. Tonal DNA Quadrant - Quadrant visualization showing tonal characteristics
function TonalDNAQuadrant({ data }) {
    const vizRef = useRef(null);

    // Extract values from object structure {dark_bright: 0.7, minimal_maximal: 0.6}
    const darkBright = typeof data === 'object' && data !== null ? (data.dark_bright ?? 0.5) : 0.5;
    const minimalMaximal = typeof data === 'object' && data !== null ? (data.minimal_maximal ?? 0.5) : 0.5;
    const hasData = typeof data === 'object' && data !== null && (data.dark_bright !== undefined || data.minimal_maximal !== undefined);

    useEffect(() => {
        if (!vizRef.current || !hasData) return;
        d3.select(vizRef.current).selectAll('*').remove();

        const width = 280;
        const height = 240;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Draw quadrant lines
        svg.append('line')
            .attr('x1', 0).attr('y1', height / 2)
            .attr('x2', width).attr('y2', height / 2)
            .attr('stroke', '#00A8FF')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4);

        svg.append('line')
            .attr('x1', width / 2).attr('y1', 0)
            .attr('x2', width / 2).attr('y2', height)
            .attr('stroke', '#00A8FF')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4);

        // Labels
        const labels = [
            { text: 'BRIGHT', x: width / 2, y: 15 },
            { text: 'DARK', x: width / 2, y: height - 10 },
            { text: 'MINIMAL', x: 20, y: height / 2 + 5 },
            { text: 'MAXIMAL', x: width - 30, y: height / 2 + 5 }
        ];

        svg.selectAll('text.label')
            .data(labels)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#00A8FF')
            .attr('font-weight', 'bold')
            .text(d => d.text);

        // Plot position based on values
        // dark_bright: 0=dark (bottom), 1=bright (top)
        // minimal_maximal: 0=minimal (left), 1=maximal (right)
        const x = minimalMaximal * width;
        const y = (1 - darkBright) * height; // Invert Y for screen coordinates

        // Draw position marker
        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 12)
            .attr('fill', '#00FFFF')
            .attr('opacity', 0.8)
            .style('filter', 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.9))');

        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 6)
            .attr('fill', '#FFFFFF')
            .attr('opacity', 1);

        // Crosshair lines from center to point
        svg.append('line')
            .attr('x1', width / 2)
            .attr('y1', height / 2)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', '#00FFFF')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.5);
    }, [data, darkBright, minimalMaximal, hasData]);

    if (!hasData) {
        return <p className="text-gray-600 text-sm text-center py-12">No tonal data yet</p>;
    }

    return (
        <div>
            <div ref={vizRef} className="flex justify-center neural-glow mb-2"></div>
            <div className="text-center text-xs text-gray-500">
                <span>{(darkBright * 100).toFixed(0)}% Bright, {(minimalMaximal * 100).toFixed(0)}% Maximal</span>
            </div>
        </div>
    );
}

// 5. Rhythmic DNA Waveform - Waveform showing rhythmic patterns
function RhythmicDNAWaveform({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 280;
        const height = 180;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const xScale = d3.scaleLinear()
            .domain([0, data.length])
            .range([20, width - 20]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.weight || 1)])
            .range([height - 30, 30]);

        const area = d3.area()
            .x((d, i) => xScale(i))
            .y0(height - 30)
            .y1(d => yScale(d.weight || 1))
            .curve(d3.curveCatmullRom);

        svg.append('path')
            .datum(data.slice(0, 20))
            .attr('d', area)
            .attr('fill', 'url(#rhythmic-gradient)')
            .attr('stroke', '#00A8FF')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 0 8px rgba(0, 168, 255, 0.6))');

        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'rhythmic-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#00A8FF')
            .attr('stop-opacity', 0.8);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#005CFF')
            .attr('stop-opacity', 0.1);
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No rhythmic data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 6. Emotional Bubble Network - Connected bubble network
function EmotionalBubbleNetwork({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = vizRef.current.clientWidth || 700;
        const height = 280;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const simulation = d3.forceSimulation(data.slice(0, 10).map(d => ({
            ...d,
            r: Math.sqrt((d.weight || 1) * 50) + 25
        })))
            .force('charge', d3.forceManyBody().strength(-50))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => d.r + 10));

        const nodeGroups = svg.selectAll('g')
            .data(simulation.nodes())
            .enter()
            .append('g');

        nodeGroups.append('circle')
            .attr('r', d => d.r)
            .attr('fill', (d, i) => ['#00A8FF', '#AD00FF', '#4ECDC4', '#FFE66D', '#FF6B6B'][i % 5])
            .attr('stroke', '#00A8FF')
            .attr('stroke-width', 2)
            .style('opacity', 0.7)
            .style('filter', 'drop-shadow(0 0 10px rgba(0, 168, 255, 0.6))');

        nodeGroups.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', d => Math.min(14, d.r / 4))
            .attr('font-weight', 'bold')
            .attr('fill', '#FFF')
            .text(d => (d.emotion || d.name || '').substring(0, 10));

        simulation.on('tick', () => {
            nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No emotional data yet</p>;
    }

    return <div ref={vizRef} className="w-full neural-glow"></div>;
}

// 7. Data List - Simple list view for text data
function DataList({ data }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <p className="text-gray-600 text-sm">No data yet</p>;
    }

    return (
        <div className="space-y-2">
            {data.slice(0, 6).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/30 border-l-2 border-primary/50">
                    <span className="text-white text-sm">{item.name || item.type || item.signature || 'Unknown'}</span>
                    <span className="text-xs text-gray-400 bg-primary/10 px-2 py-1 rounded">
                        {Math.round((item.weight || 1) * 10) / 10}
                    </span>
                </div>
            ))}
        </div>
    );
}

// 8. Inspirational Constellation - Star-like constellation pattern
function InspirationalConstellation({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 280;
        const height = 240;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Central node
        svg.append('circle')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', 20)
            .attr('fill', '#00A8FF')
            .attr('stroke', '#005CFF')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 0 10px rgba(0, 168, 255, 0.8))');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', '#000')
            .text('CORE');

        // Surrounding nodes
        data.slice(0, 8).forEach((item, i) => {
            const angle = (i / data.slice(0, 8).length) * 2 * Math.PI;
            const radius = 80;
            const x = width / 2 + radius * Math.cos(angle);
            const y = height / 2 + radius * Math.sin(angle);

            // Connecting line
            svg.append('line')
                .attr('x1', width / 2)
                .attr('y1', height / 2)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#00A8FF')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.3)
                .attr('class', 'pulse-line');

            // Node
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 12)
                .attr('fill', '#005CFF')
                .attr('stroke', '#00A8FF')
                .attr('stroke-width', 1.5)
                .style('opacity', 0.8)
                .style('filter', 'drop-shadow(0 0 6px rgba(0, 168, 255, 0.6))');

            // Label
            svg.append('text')
                .attr('x', x)
                .attr('y', y + 25)
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px')
                .attr('fill', '#00A8FF')
                .text((item.type || item.name || '').substring(0, 8));
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No trigger data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 9. Sonic Architecture - Display layering approach and tension/release
function SonicArchitectureTower({ data }) {
    // Extract text properties from object structure
    const layeringApproach = typeof data === 'object' && data !== null ? (data.layering_approach || data.layering) : null;
    const tensionRelease = typeof data === 'object' && data !== null ? (data.tension_release || data.tension) : null;
    const hasData = layeringApproach || tensionRelease;

    if (!hasData) {
        return <p className="text-gray-600 text-sm text-center py-12">No architecture data yet</p>;
    }

    return (
        <div className="space-y-4 px-6">
            {layeringApproach && (
                <div className="p-4 rounded-lg bg-black/30 border-l-4 border-primary">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Layering Approach</p>
                    <p className="text-white text-sm leading-relaxed">{layeringApproach}</p>
                </div>
            )}
            {tensionRelease && (
                <div className="p-4 rounded-lg bg-black/30 border-l-4 border-purple-500">
                    <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">Tension & Release</p>
                    <p className="text-white text-sm leading-relaxed">{tensionRelease}</p>
                </div>
            )}
        </div>
    );
}
