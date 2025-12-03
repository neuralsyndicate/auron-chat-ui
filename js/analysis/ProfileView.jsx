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

// 1. Genre Fusion Ring - V6 Segmented donut with cyan-blue gradient, center label, strong outer glow
function GenreFusionRing({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 340;
        const height = 340;
        const radius = Math.min(width, height) / 2 - 30;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // V6: Add bloom filter for outer glow
        const defs = svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'genre-bloom')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur')
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', '10')
            .attr('result', 'blur');
        filter.append('feFlood')
            .attr('flood-color', '#00D9FF')
            .attr('flood-opacity', '0.4');
        filter.append('feComposite')
            .attr('in2', 'blur')
            .attr('operator', 'in')
            .attr('result', 'glow');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'glow');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // V6: Cyan-blue gradient for segments
        const segGradient = defs.append('linearGradient')
            .attr('id', 'segment-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');
        segGradient.append('stop').attr('offset', '0%').attr('stop-color', '#00D9FF');
        segGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0066FF');

        const g = svg.append('g')
            .attr('transform', `translate(${width/2}, ${height/2})`);

        // V6: Larger pad angle for cleaner separation
        const pie = d3.pie().value(d => d.weight || 1).padAngle(0.04).sort(null);
        const arc = d3.arc()
            .innerRadius(radius * 0.45)
            .outerRadius(radius * 0.85);
        const outerArc = d3.arc()
            .innerRadius(radius * 0.85)
            .outerRadius(radius * 0.92);

        const arcs = g.selectAll('arc')
            .data(pie(data.slice(0, 8)))
            .enter()
            .append('g');

        // V6: Main segments with gradient fill and bloom
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => {
                const t = i / 8;
                return d3.interpolateRgb('#00D9FF', '#0066FF')(t);
            })
            .attr('stroke', 'rgba(0, 217, 255, 0.3)')
            .attr('stroke-width', 1)
            .style('opacity', 0.85)
            .style('filter', 'url(#genre-bloom)');

        // V6: Outer highlight ring
        arcs.append('path')
            .attr('d', outerArc)
            .attr('fill', 'none')
            .attr('stroke', '#00D9FF')
            .attr('stroke-width', 2)
            .style('opacity', 0.5);

        // V6: Segment labels positioned outside
        arcs.append('text')
            .attr('transform', d => {
                const pos = arc.centroid(d);
                const midAngle = (d.startAngle + d.endAngle) / 2;
                const x = Math.cos(midAngle - Math.PI / 2) * (radius * 0.65);
                const y = Math.sin(midAngle - Math.PI / 2) * (radius * 0.65);
                return `translate(${x}, ${y})`;
            })
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '600')
            .attr('fill', '#FFF')
            .attr('letter-spacing', '0.5px')
            .text(d => (d.data.name || d.data.genre || '').toUpperCase().substring(0, 10));

        // V6: Center label "GENRE FUSION"
        g.append('text')
            .attr('x', 0)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '2px')
            .text('GENRE');
        g.append('text')
            .attr('x', 0)
            .attr('y', 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '2px')
            .text('FUSION');

        // V6: Inner ring highlight
        g.append('circle')
            .attr('r', radius * 0.45)
            .attr('fill', 'none')
            .attr('stroke', '#00D9FF')
            .attr('stroke-width', 1)
            .style('opacity', 0.3);

    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No genre data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 2. Neural Spectrum Bar - V6 Horizontal waveform with BLUE → WHITE → RED gradient
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
        const height = 140;
        const points = 200;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Blue → White → Orange/Red gradient (Parasympathetic → Hybrid → Sympathetic)
        const gradient = defs.append('linearGradient')
            .attr('id', 'spectrum-gradient-v6')
            .attr('x1', '0%')
            .attr('x2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#0066FF').attr('stop-opacity', 1);
        gradient.append('stop').attr('offset', '50%').attr('stop-color', '#FFFFFF').attr('stop-opacity', 0.9);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF6B00').attr('stop-opacity', 1);

        // V6: Bloom filter
        const filter = defs.append('filter')
            .attr('id', 'spectrum-bloom')
            .attr('x', '-20%')
            .attr('y', '-50%')
            .attr('width', '140%')
            .attr('height', '200%');
        filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '4').attr('result', 'blur');
        filter.append('feColorMatrix').attr('in', 'blur').attr('type', 'saturate').attr('values', '1.5');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // V6: Base axis line
        svg.append('line')
            .attr('x1', 30)
            .attr('x2', width - 30)
            .attr('y1', height / 2)
            .attr('y2', height / 2)
            .attr('stroke', 'rgba(0, 217, 255, 0.2)')
            .attr('stroke-width', 1);

        // V6: Double-headed arrow on axis
        const arrowY = height - 20;
        svg.append('line')
            .attr('x1', 50)
            .attr('x2', width - 50)
            .attr('y1', arrowY)
            .attr('y2', arrowY)
            .attr('stroke', 'rgba(255, 255, 255, 0.3)')
            .attr('stroke-width', 1);
        // Left arrow head
        svg.append('path')
            .attr('d', `M50,${arrowY} L58,${arrowY - 4} L58,${arrowY + 4} Z`)
            .attr('fill', 'rgba(255, 255, 255, 0.3)');
        // Right arrow head
        svg.append('path')
            .attr('d', `M${width - 50},${arrowY} L${width - 58},${arrowY - 4} L${width - 58},${arrowY + 4} Z`)
            .attr('fill', 'rgba(255, 255, 255, 0.3)');

        // Waveform scales
        const xScale = d3.scaleLinear().domain([0, points]).range([30, width - 30]);
        const yScale = d3.scaleLinear().domain([-1, 1]).range([height - 35, 20]);

        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d))
            .curve(d3.curveBasis);

        // Wave generation based on position
        function generateWave(time) {
            return d3.range(points).map(i => {
                const x = i / points;
                const baseFrequency = 3 + (position * 9);
                const animSpeed = 0.005 + (position * 0.015);
                const amplitude1 = 0.5 - (position * 0.2);
                const amplitude2 = 0.1 + (position * 0.2);
                const wave1 = Math.sin((x * baseFrequency + time * animSpeed) * Math.PI) * amplitude1;
                const secondaryFreq = baseFrequency * (1 + position);
                const wave2 = Math.sin((x * secondaryFreq + time * animSpeed * 2) * Math.PI) * amplitude2;
                const noise = (Math.random() - 0.5) * 0.05 * position;
                return wave1 + wave2 + noise;
            });
        }

        const path = svg.append('path')
            .attr('fill', 'none')
            .attr('stroke', 'url(#spectrum-gradient-v6)')
            .attr('stroke-width', 3)
            .style('filter', 'url(#spectrum-bloom)');

        // V6: Position indicator with colored glow based on placement
        const markerX = 30 + position * (width - 60);
        const markerColor = placement === 'parasympathetic' ? '#0066FF' :
                           placement === 'sympathetic' ? '#FF6B00' : '#FFFFFF';

        svg.append('line')
            .attr('x1', markerX)
            .attr('x2', markerX)
            .attr('y1', 15)
            .attr('y2', height - 35)
            .attr('stroke', markerColor)
            .attr('stroke-width', 2)
            .style('filter', `drop-shadow(0 0 8px ${markerColor})`);

        // V6: Endpoint glows
        svg.append('circle')
            .attr('cx', 30)
            .attr('cy', height / 2)
            .attr('r', 6)
            .attr('fill', '#0066FF')
            .style('filter', 'drop-shadow(0 0 10px #0066FF)');
        svg.append('circle')
            .attr('cx', width - 30)
            .attr('cy', height / 2)
            .attr('r', 6)
            .attr('fill', '#FF6B00')
            .style('filter', 'drop-shadow(0 0 10px #FF6B00)');

        let time = 0;
        function animate() {
            time += 1;
            path.attr('d', line(generateWave(time)));
            requestAnimationFrame(animate);
        }
        animate();
    }, [data, position, placement]);

    const getStateLabel = () => placement.charAt(0).toUpperCase() + placement.slice(1);
    const getStateColor = () => {
        if (placement === 'parasympathetic') return '#0066FF';
        if (placement === 'sympathetic') return '#FF6B00';
        return '#FFFFFF';
    };
    const getDescription = () => {
        if (placement === 'parasympathetic') return 'Calm, relaxed, slower waves';
        if (placement === 'sympathetic') return 'Aroused, alert, faster waves';
        return 'Balanced, medium energy';
    };

    return (
        <div className="w-full">
            <div ref={vizRef} className="w-full neural-glow mb-2"></div>
            {/* V6: Zone labels with colored text */}
            <div className="flex justify-between items-center text-xs px-8 mb-1">
                <span style={{ color: '#0066FF', fontWeight: 600 }}>PARASYMPATHETIC</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>HYBRID</span>
                <span style={{ color: '#FF6B00', fontWeight: 600 }}>SYMPATHETIC</span>
            </div>
            {/* State + Percentage + Intensity */}
            <div className="flex justify-center items-center gap-3 text-sm mt-2">
                <span style={{ color: getStateColor(), fontWeight: 700, textShadow: `0 0 10px ${getStateColor()}` }}>
                    {getStateLabel()}
                </span>
                <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                    {(position * 100).toFixed(0)}%
                </span>
                <span style={{
                    fontSize: '0.65rem',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(0, 217, 255, 0.15)',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {intensity}
                </span>
            </div>
            <div className="text-center text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                {getDescription()}
            </div>
        </div>
    );
}

// 3. Sound Palette Orbital - V6 Clean orbital system with central sphere + 3 rings
function SoundPaletteOrbital({ data }) {
    const vizRef = useRef(null);

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 300;
        const height = 260;
        const cx = width / 2;
        const cy = height / 2;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Bloom filter for glowing nodes
        const filter = defs.append('filter')
            .attr('id', 'orbital-bloom')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', '6').attr('result', 'blur');
        filter.append('feFlood').attr('flood-color', '#00D9FF').attr('flood-opacity', '0.5');
        filter.append('feComposite').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'glow');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // V6: Draw 3 thin orbital rings
        const orbits = [55, 85, 115];
        orbits.forEach((r) => {
            svg.append('circle')
                .attr('cx', cx)
                .attr('cy', cy)
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#00D9FF')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.25);
        });

        // V6: Central glowing sphere with "SOUND" label
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 28)
            .attr('fill', 'rgba(0, 102, 255, 0.3)')
            .attr('stroke', '#00D9FF')
            .attr('stroke-width', 1.5)
            .style('filter', 'url(#orbital-bloom)');
        svg.append('text')
            .attr('x', cx)
            .attr('y', cy - 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '1px')
            .text('SOUND');
        svg.append('text')
            .attr('x', cx)
            .attr('y', cy + 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '1px')
            .text('PALETTE');

        // V6: Evenly distribute nodes on orbits (cleaner look, no labels)
        const nodesPerOrbit = [3, 4, 5];
        let nodeIndex = 0;
        orbits.forEach((orbitR, orbitIdx) => {
            const count = Math.min(nodesPerOrbit[orbitIdx], data.length - nodeIndex);
            for (let i = 0; i < count && nodeIndex < data.length; i++) {
                const angle = (i / count) * 2 * Math.PI - Math.PI / 2 + (orbitIdx * 0.3);
                const x = cx + orbitR * Math.cos(angle);
                const y = cy + orbitR * Math.sin(angle);
                const nodeData = data[nodeIndex];
                const nodeR = 8 + (nodeData.weight || 1) * 1.5;

                svg.append('circle')
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', nodeR)
                    .attr('fill', '#00D9FF')
                    .attr('fill-opacity', 0.8)
                    .style('filter', 'url(#orbital-bloom)');

                nodeIndex++;
            }
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No sound data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 4. Tonal DNA Quadrant - V6 4-quadrant plot with glowing blob position indicator
function TonalDNAQuadrant({ data }) {
    const vizRef = useRef(null);

    // Extract values from object structure {dark_bright: 0.7, minimal_maximal: 0.6}
    const darkBright = typeof data === 'object' && data !== null ? (data.dark_bright ?? 0.5) : 0.5;
    const minimalMaximal = typeof data === 'object' && data !== null ? (data.minimal_maximal ?? 0.5) : 0.5;
    const hasData = typeof data === 'object' && data !== null && (data.dark_bright !== undefined || data.minimal_maximal !== undefined);

    useEffect(() => {
        if (!vizRef.current || !hasData) return;
        d3.select(vizRef.current).selectAll('*').remove();

        const width = 300;
        const height = 260;
        const cx = width / 2;
        const cy = height / 2;
        const margin = 35;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Glowing blob gradient (soft edges)
        const blobGradient = defs.append('radialGradient')
            .attr('id', 'tonal-blob-gradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
        blobGradient.append('stop').attr('offset', '0%').attr('stop-color', '#00D9FF').attr('stop-opacity', '0.9');
        blobGradient.append('stop').attr('offset', '50%').attr('stop-color', '#00D9FF').attr('stop-opacity', '0.5');
        blobGradient.append('stop').attr('offset', '100%').attr('stop-color', '#00D9FF').attr('stop-opacity', '0');

        // V6: Bloom filter
        const filter = defs.append('filter')
            .attr('id', 'tonal-bloom')
            .attr('x', '-100%')
            .attr('y', '-100%')
            .attr('width', '300%')
            .attr('height', '300%');
        filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '8');

        // V6: Glass card border
        svg.append('rect')
            .attr('x', margin / 2)
            .attr('y', margin / 2)
            .attr('width', width - margin)
            .attr('height', height - margin)
            .attr('rx', 8)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(0, 217, 255, 0.2)')
            .attr('stroke-width', 1);

        // V6: Quadrant axis lines
        svg.append('line')
            .attr('x1', margin)
            .attr('y1', cy)
            .attr('x2', width - margin)
            .attr('y2', cy)
            .attr('stroke', 'rgba(0, 217, 255, 0.3)')
            .attr('stroke-width', 1);
        svg.append('line')
            .attr('x1', cx)
            .attr('y1', margin)
            .attr('x2', cx)
            .attr('y2', height - margin)
            .attr('stroke', 'rgba(0, 217, 255, 0.3)')
            .attr('stroke-width', 1);

        // V6: Quadrant corner labels
        const cornerLabels = [
            { text: 'MINIMAL', x: margin + 5, y: margin + 15, anchor: 'start' },
            { text: 'BRIGHT', x: width - margin - 5, y: margin + 15, anchor: 'end' },
            { text: 'DARK', x: margin + 5, y: height - margin - 5, anchor: 'start' },
            { text: 'MAXIMAL', x: width - margin - 5, y: height - margin - 5, anchor: 'end' }
        ];
        cornerLabels.forEach(l => {
            svg.append('text')
                .attr('x', l.x)
                .attr('y', l.y)
                .attr('text-anchor', l.anchor)
                .attr('font-size', '8px')
                .attr('font-weight', '600')
                .attr('fill', 'rgba(0, 217, 255, 0.5)')
                .attr('letter-spacing', '0.5px')
                .text(l.text);
        });

        // V6: Inner axis labels (closer to center)
        const innerLabels = [
            { text: 'DIGITAL', x: cx - 40, y: cy - 30 },
            { text: 'HARMONIC', x: cx + 40, y: cy - 30 },
            { text: 'DISSONANT', x: cx - 40, y: cy + 40 },
            { text: 'ANALOG', x: cx + 40, y: cy + 40 }
        ];
        innerLabels.forEach(l => {
            svg.append('text')
                .attr('x', l.x)
                .attr('y', l.y)
                .attr('text-anchor', 'middle')
                .attr('font-size', '7px')
                .attr('fill', 'rgba(255, 255, 255, 0.35)')
                .text(l.text);
        });

        // V6: Calculate position (inverted Y for screen coords)
        const plotWidth = width - margin * 2;
        const plotHeight = height - margin * 2;
        const x = margin + minimalMaximal * plotWidth;
        const y = margin + (1 - darkBright) * plotHeight;

        // V6: Glowing BLOB position indicator (soft edges, not hard circle)
        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 35)
            .attr('fill', 'url(#tonal-blob-gradient)')
            .style('filter', 'url(#tonal-bloom)');

        // V6: Core bright center
        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 8)
            .attr('fill', '#00D9FF')
            .attr('opacity', 0.9);
        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 4)
            .attr('fill', '#FFFFFF');

        // V6: Crosshair from center to blob
        svg.append('line')
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', 'rgba(0, 217, 255, 0.4)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4');

    }, [data, darkBright, minimalMaximal, hasData]);

    if (!hasData) {
        return <p className="text-gray-600 text-sm text-center py-12">No tonal data yet</p>;
    }

    // V6: Axis label descriptions
    const brightLabel = darkBright > 0.6 ? 'Bright' : darkBright < 0.4 ? 'Dark' : 'Balanced';
    const maxLabel = minimalMaximal > 0.6 ? 'Maximal' : minimalMaximal < 0.4 ? 'Minimal' : 'Moderate';

    return (
        <div>
            <div ref={vizRef} className="flex justify-center neural-glow mb-2"></div>
            <div className="text-center text-xs" style={{ color: 'rgba(0, 217, 255, 0.7)' }}>
                <span style={{ fontWeight: 600 }}>{brightLabel}</span>
                <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span>
                <span style={{ fontWeight: 600 }}>{maxLabel}</span>
            </div>
        </div>
    );
}

// 5. Rhythmic DNA Waveform - V6 Circular arc with labeled nodes + central waveform helix
function RhythmicDNAWaveform({ data }) {
    const vizRef = useRef(null);

    // V6: Define rhythm type labels (for display around arc)
    const rhythmTypes = [
        'SYNCOPATED', 'POLYRHYTHM', 'STRAIGHT', 'TRIPLET',
        'OSTINATO', 'CROSS-RHYTHM', 'PUNCTUATED', 'STAGGERED'
    ];

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        const width = 300;
        const height = 260;
        const cx = width / 2;
        const cy = height / 2;
        const arcRadius = 100;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Bloom filter
        const filter = defs.append('filter')
            .attr('id', 'rhythm-bloom')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', '5').attr('result', 'blur');
        filter.append('feFlood').attr('flood-color', '#00D9FF').attr('flood-opacity', '0.4');
        filter.append('feComposite').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'glow');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // V6: Outer circular arc (partial, ~270 degrees)
        const arcPath = d3.arc()
            .innerRadius(arcRadius - 2)
            .outerRadius(arcRadius + 2)
            .startAngle(-Math.PI * 0.75)
            .endAngle(Math.PI * 0.75);

        svg.append('path')
            .attr('d', arcPath())
            .attr('transform', `translate(${cx}, ${cy})`)
            .attr('fill', 'rgba(0, 217, 255, 0.2)')
            .attr('stroke', '#00D9FF')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4);

        // V6: Place rhythm type nodes around the arc
        const nodeCount = rhythmTypes.length;
        const dataArr = Array.isArray(data) ? data : [];

        rhythmTypes.forEach((label, i) => {
            const angle = -Math.PI * 0.75 + (i / (nodeCount - 1)) * Math.PI * 1.5;
            const x = cx + arcRadius * Math.sin(angle);
            const y = cy - arcRadius * Math.cos(angle);

            // Check if this rhythm type is in data (glow if present)
            const isActive = dataArr.some(d =>
                (d.type || d.name || '').toLowerCase().includes(label.toLowerCase().split('-')[0])
            );

            // Node
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', isActive ? 8 : 5)
                .attr('fill', isActive ? '#00D9FF' : 'rgba(0, 217, 255, 0.3)')
                .style('filter', isActive ? 'url(#rhythm-bloom)' : 'none');

            // Label (positioned outside arc)
            const labelRadius = arcRadius + 25;
            const labelX = cx + labelRadius * Math.sin(angle);
            const labelY = cy - labelRadius * Math.cos(angle);

            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('font-size', '7px')
                .attr('fill', isActive ? '#00D9FF' : 'rgba(255, 255, 255, 0.4)')
                .attr('font-weight', isActive ? '600' : '400')
                .text(label);

            // Connection line from center to active nodes
            if (isActive) {
                svg.append('line')
                    .attr('x1', cx)
                    .attr('y1', cy)
                    .attr('x2', x)
                    .attr('y2', y)
                    .attr('stroke', 'rgba(0, 217, 255, 0.3)')
                    .attr('stroke-width', 1);
            }
        });

        // V6: Central DNA-like double helix waveform
        const wavePoints = 40;
        const waveRadius = 35;
        const waveHeight = 50;

        // First helix strand
        const helix1 = d3.range(wavePoints).map(i => {
            const t = i / wavePoints;
            const x = cx - waveRadius + t * waveRadius * 2;
            const y = cy + Math.sin(t * Math.PI * 3) * 15;
            return [x, y];
        });

        // Second helix strand (offset)
        const helix2 = d3.range(wavePoints).map(i => {
            const t = i / wavePoints;
            const x = cx - waveRadius + t * waveRadius * 2;
            const y = cy + Math.sin(t * Math.PI * 3 + Math.PI) * 15;
            return [x, y];
        });

        const helixLine = d3.line().curve(d3.curveBasis);

        svg.append('path')
            .attr('d', helixLine(helix1))
            .attr('fill', 'none')
            .attr('stroke', '#00D9FF')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .style('filter', 'url(#rhythm-bloom)');

        svg.append('path')
            .attr('d', helixLine(helix2))
            .attr('fill', 'none')
            .attr('stroke', '#0066FF')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.5);

        // V6: Central "RHYTHM" label
        svg.append('text')
            .attr('x', cx)
            .attr('y', cy + 45)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '2px')
            .text('RHYTHM DNA');

    }, [data]);

    // Handle both array and object data structures
    const hasData = (Array.isArray(data) && data.length > 0) ||
                   (typeof data === 'object' && data !== null && Object.keys(data).length > 0);

    if (!hasData) {
        return <p className="text-gray-600 text-sm text-center py-12">No rhythmic data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 6. Emotional Bubble Network - V6 Hub-and-spoke with BLUE (cool) + ORANGE (warm) spheres
function EmotionalBubbleNetwork({ data }) {
    const vizRef = useRef(null);

    // V6: Define warm vs cool emotions
    const warmEmotions = ['passion', 'energy', 'intensity', 'power', 'fire', 'anger', 'excitement', 'twisted', 'dark', 'intense'];
    const isWarmEmotion = (emotion) => {
        const lower = (emotion || '').toLowerCase();
        return warmEmotions.some(w => lower.includes(w));
    };

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = vizRef.current.clientWidth || 700;
        const height = 320;
        const cx = width / 2;
        const cy = height / 2;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Blue sphere gradient (cool emotions)
        const blueGradient = defs.append('radialGradient')
            .attr('id', 'cool-sphere-gradient')
            .attr('cx', '30%')
            .attr('cy', '30%')
            .attr('r', '70%');
        blueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#66CCFF');
        blueGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0066FF');
        blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#003399');

        // V6: Orange/red sphere gradient (warm emotions)
        const warmGradient = defs.append('radialGradient')
            .attr('id', 'warm-sphere-gradient')
            .attr('cx', '30%')
            .attr('cy', '30%')
            .attr('r', '70%');
        warmGradient.append('stop').attr('offset', '0%').attr('stop-color', '#FFAA66');
        warmGradient.append('stop').attr('offset', '50%').attr('stop-color', '#FF6B00');
        warmGradient.append('stop').attr('offset', '100%').attr('stop-color', '#CC3300');

        // V6: Bloom filters
        const blueFilter = defs.append('filter').attr('id', 'blue-bloom').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
        blueFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '6');
        const warmFilter = defs.append('filter').attr('id', 'warm-bloom').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
        warmFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '6');

        // V6: Central hub (primary emotion - largest weight)
        const sortedData = [...data].sort((a, b) => (b.weight || 1) - (a.weight || 1));
        const primary = sortedData[0];
        const satellites = sortedData.slice(1, 9); // Up to 8 satellites
        const primaryIsWarm = isWarmEmotion(primary.emotion || primary.name);

        // Draw connection lines first (so they're behind spheres)
        const spokeRadius = 110;
        satellites.forEach((d, i) => {
            const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + spokeRadius * Math.cos(angle);
            const y = cy + spokeRadius * Math.sin(angle);

            svg.append('line')
                .attr('x1', cx)
                .attr('y1', cy)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', 'rgba(0, 217, 255, 0.2)')
                .attr('stroke-width', 1);
        });

        // V6: Central hub sphere
        const hubRadius = 45;
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', hubRadius + 15)
            .attr('fill', primaryIsWarm ? '#FF6B00' : '#0066FF')
            .attr('opacity', 0.15)
            .style('filter', primaryIsWarm ? 'url(#warm-bloom)' : 'url(#blue-bloom)');

        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', hubRadius)
            .attr('fill', primaryIsWarm ? 'url(#warm-sphere-gradient)' : 'url(#cool-sphere-gradient)');

        svg.append('text')
            .attr('x', cx)
            .attr('y', cy + 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', '#FFF')
            .text((primary.emotion || primary.name || '').substring(0, 12));

        // V6: Satellite spheres
        satellites.forEach((d, i) => {
            const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + spokeRadius * Math.cos(angle);
            const y = cy + spokeRadius * Math.sin(angle);
            const r = 18 + (d.weight || 1) * 4;
            const isWarm = isWarmEmotion(d.emotion || d.name);

            // Outer glow
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', r + 8)
                .attr('fill', isWarm ? '#FF6B00' : '#0066FF')
                .attr('opacity', 0.15)
                .style('filter', isWarm ? 'url(#warm-bloom)' : 'url(#blue-bloom)');

            // Main sphere
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', r)
                .attr('fill', isWarm ? 'url(#warm-sphere-gradient)' : 'url(#cool-sphere-gradient)');

            // Label next to sphere
            const labelOffset = r + 15;
            const labelX = cx + (spokeRadius + labelOffset) * Math.cos(angle);
            const labelY = cy + (spokeRadius + labelOffset) * Math.sin(angle);

            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY + 4)
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px')
                .attr('font-weight', '500')
                .attr('fill', isWarm ? '#FF6B00' : '#00D9FF')
                .text((d.emotion || d.name || '').substring(0, 12));
        });

    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No emotional data yet</p>;
    }

    return <div ref={vizRef} className="w-full neural-glow"></div>;
}

// 7. Data List / Processing Signature - V6 Circular node network with geometric connections
function DataList({ data }) {
    const vizRef = React.useRef(null);

    React.useEffect(() => {
        if (!vizRef.current || !data || !Array.isArray(data) || data.length === 0) return;
        d3.select(vizRef.current).selectAll('*').remove();

        const width = 280;
        const height = 240;
        const cx = width / 2;
        const cy = height / 2;
        const radius = 85;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Bloom filter
        const filter = defs.append('filter')
            .attr('id', 'process-bloom')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', '4').attr('result', 'blur');
        filter.append('feFlood').attr('flood-color', '#00D9FF').attr('flood-opacity', '0.4');
        filter.append('feComposite').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'glow');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        const nodes = data.slice(0, 8);
        const nodeCount = nodes.length;

        // V6: Radial connections from center to each node
        nodes.forEach((_, i) => {
            const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);

            svg.append('line')
                .attr('x1', cx)
                .attr('y1', cy)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', 'rgba(0, 217, 255, 0.2)')
                .attr('stroke-width', 1);
        });

        // V6: Circular connections between adjacent nodes
        nodes.forEach((_, i) => {
            const angle1 = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
            const angle2 = ((i + 1) / nodeCount) * 2 * Math.PI - Math.PI / 2;
            const x1 = cx + radius * Math.cos(angle1);
            const y1 = cy + radius * Math.sin(angle1);
            const x2 = cx + radius * Math.cos(angle2);
            const y2 = cy + radius * Math.sin(angle2);

            svg.append('line')
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('stroke', 'rgba(0, 217, 255, 0.15)')
                .attr('stroke-width', 1);
        });

        // V6: Central hub node
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 20)
            .attr('fill', '#0066FF')
            .attr('fill-opacity', 0.4)
            .style('filter', 'url(#process-bloom)');
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 12)
            .attr('fill', '#00D9FF');

        // V6: Outer nodes
        nodes.forEach((item, i) => {
            const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);

            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 10)
                .attr('fill', '#00D9FF')
                .attr('fill-opacity', 0.7)
                .style('filter', 'url(#process-bloom)');

            // Arrow indicator on line (small triangle pointing outward)
            const arrowDist = 45;
            const arrowX = cx + arrowDist * Math.cos(angle);
            const arrowY = cy + arrowDist * Math.sin(angle);
            const arrowSize = 4;
            const perpAngle = angle + Math.PI / 2;

            svg.append('path')
                .attr('d', `M${arrowX + arrowSize * Math.cos(angle)},${arrowY + arrowSize * Math.sin(angle)}
                           L${arrowX + arrowSize * Math.cos(perpAngle)},${arrowY + arrowSize * Math.sin(perpAngle)}
                           L${arrowX - arrowSize * Math.cos(perpAngle)},${arrowY - arrowSize * Math.sin(perpAngle)} Z`)
                .attr('fill', 'rgba(0, 217, 255, 0.4)');
        });

        // V6: Center label
        svg.append('text')
            .attr('x', cx)
            .attr('y', cy + height / 2 - 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#00D9FF')
            .attr('letter-spacing', '2px')
            .text('PROCESSING');

    }, [data]);

    if (!data || !Array.isArray(data) || data.length === 0) {
        return <p className="text-gray-600 text-sm">No data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 8. Inspirational Constellation - V6 "INNER MIND" central hub with 8 labeled satellites
function InspirationalConstellation({ data }) {
    const vizRef = useRef(null);

    // V6: Default trigger categories
    const defaultTriggers = [
        'MYTHOLOGY', 'NATURE', 'PHILOSOPHY', 'PSYCHOLOGY',
        'SYMBOLISM', 'DREAMS', 'CULTURE', 'SPIRITUALITY'
    ];

    useEffect(() => {
        if (!vizRef.current) return;
        d3.select(vizRef.current).selectAll('*').remove();

        if (!data || !Array.isArray(data) || data.length === 0) return;

        const width = 300;
        const height = 280;
        const cx = width / 2;
        const cy = height / 2;
        const spokeRadius = 95;

        const svg = d3.select(vizRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // V6: Bloom filter
        const filter = defs.append('filter')
            .attr('id', 'inspire-bloom')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', '6').attr('result', 'blur');
        filter.append('feFlood').attr('flood-color', '#00D9FF').attr('flood-opacity', '0.5');
        filter.append('feComposite').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'glow');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        // V6: Central hub gradient
        const hubGradient = defs.append('radialGradient')
            .attr('id', 'inspire-hub-gradient')
            .attr('cx', '30%')
            .attr('cy', '30%')
            .attr('r', '70%');
        hubGradient.append('stop').attr('offset', '0%').attr('stop-color', '#66CCFF');
        hubGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0066FF');
        hubGradient.append('stop').attr('offset', '100%').attr('stop-color', '#003399');

        // Get actual triggers from data or use defaults
        const triggers = data.slice(0, 8).map((d, i) => ({
            label: (d.type || d.name || defaultTriggers[i] || '').toUpperCase(),
            weight: d.weight || 1
        }));

        // V6: Outer ring connecting adjacent satellites
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', spokeRadius)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(0, 217, 255, 0.15)')
            .attr('stroke-width', 1);

        // Draw spoke lines first
        triggers.forEach((t, i) => {
            const angle = (i / triggers.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + spokeRadius * Math.cos(angle);
            const y = cy + spokeRadius * Math.sin(angle);

            svg.append('line')
                .attr('x1', cx)
                .attr('y1', cy)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', 'rgba(0, 217, 255, 0.25)')
                .attr('stroke-width', 1);
        });

        // V6: Central "INNER MIND" hub
        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 35)
            .attr('fill', 'url(#inspire-hub-gradient)')
            .style('filter', 'url(#inspire-bloom)');

        svg.append('text')
            .attr('x', cx)
            .attr('y', cy - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#FFF')
            .attr('letter-spacing', '1px')
            .text('INNER');
        svg.append('text')
            .attr('x', cx)
            .attr('y', cy + 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('fill', '#FFF')
            .attr('letter-spacing', '1px')
            .text('MIND');

        // V6: Satellite nodes with labels
        triggers.forEach((t, i) => {
            const angle = (i / triggers.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + spokeRadius * Math.cos(angle);
            const y = cy + spokeRadius * Math.sin(angle);
            const nodeR = 12 + t.weight * 2;

            // Outer glow
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', nodeR + 5)
                .attr('fill', '#0066FF')
                .attr('opacity', 0.2)
                .style('filter', 'url(#inspire-bloom)');

            // Main node
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', nodeR)
                .attr('fill', '#00D9FF')
                .attr('fill-opacity', 0.8);

            // Label (positioned outside)
            const labelRadius = spokeRadius + 25;
            const labelX = cx + labelRadius * Math.cos(angle);
            const labelY = cy + labelRadius * Math.sin(angle);

            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY + 4)
                .attr('text-anchor', 'middle')
                .attr('font-size', '8px')
                .attr('font-weight', '500')
                .attr('fill', '#00D9FF')
                .attr('letter-spacing', '0.5px')
                .text(t.label.substring(0, 12));
        });

    }, [data]);

    if (!data || data.length === 0) {
        return <p className="text-gray-600 text-sm text-center py-12">No trigger data yet</p>;
    }

    return <div ref={vizRef} className="flex justify-center neural-glow"></div>;
}

// 9. Sonic Architecture - V6 Glass cards with glow indicators
function SonicArchitectureTower({ data }) {
    // Extract text properties from object structure
    const layeringApproach = typeof data === 'object' && data !== null ? (data.layering_approach || data.layering) : null;
    const tensionRelease = typeof data === 'object' && data !== null ? (data.tension_release || data.tension) : null;
    const hasData = layeringApproach || tensionRelease;

    if (!hasData) {
        return <p className="text-gray-600 text-sm text-center py-12">No architecture data yet</p>;
    }

    // V6: Glass card style
    const glassCardStyle = {
        background: 'rgba(10, 10, 31, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 217, 255, 0.15)',
        borderRadius: '12px',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden'
    };

    const glowBarStyle = (color) => ({
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: `linear-gradient(180deg, ${color}, transparent)`,
        boxShadow: `0 0 20px ${color}`,
        borderRadius: '4px 0 0 4px'
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            {layeringApproach && (
                <div style={glassCardStyle}>
                    <div style={glowBarStyle('#00D9FF')}></div>
                    <p style={{
                        fontSize: '0.7rem',
                        color: '#00D9FF',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '0.75rem',
                        paddingLeft: '12px'
                    }}>Layering Approach</p>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        paddingLeft: '12px'
                    }}>{layeringApproach}</p>
                </div>
            )}
            {tensionRelease && (
                <div style={glassCardStyle}>
                    <div style={glowBarStyle('#FF6B00')}></div>
                    <p style={{
                        fontSize: '0.7rem',
                        color: '#FF6B00',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '0.75rem',
                        paddingLeft: '12px'
                    }}>Tension & Release</p>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        paddingLeft: '12px'
                    }}>{tensionRelease}</p>
                </div>
            )}
        </div>
    );
}
