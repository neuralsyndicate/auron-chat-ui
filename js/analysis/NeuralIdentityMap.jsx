// ═══════════════════════════════════════════════════════════════════════════════
// V5 EXPANDED SECTOR PANEL COMPONENT
// Liquid glass wedge that expands from module node
// ═══════════════════════════════════════════════════════════════════════════════

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

function ExpandedSectorPanel({ module, profile, cx, cy, isExpanded, sectorPath, onClose }) {
    if (!isExpanded || !module) return null;

    const moduleData = profile?.[module.key];
    const startAngle = (module.angle - 16.35 - 90) * Math.PI / 180;
    const endAngle = (module.angle + 16.35 - 90) * Math.PI / 180;
    const midAngle = (module.angle - 90) * Math.PI / 180;

    // V6: Calculate node position for field line
    const nodeRadius = 360; // Match the updated layout radius
    const nodeX = cx + nodeRadius * Math.cos(midAngle);
    const nodeY = cy + nodeRadius * Math.sin(midAngle);

    // V6: Field line control point for curved connection
    const fieldControlRadius = nodeRadius * 0.6;
    const fieldControlAngle = midAngle + 0.15;
    const fieldControlX = cx + fieldControlRadius * Math.cos(fieldControlAngle);
    const fieldControlY = cy + fieldControlRadius * Math.sin(fieldControlAngle);

    // Particle positions along sector arc
    const particles = React.useMemo(() =>
        Array(12).fill(0).map((_, i) => {
            const t = i / 11;
            const angle = startAngle + (endAngle - startAngle) * t;
            const baseRadius = 320 + Math.random() * 70;
            return {
                x: cx + baseRadius * Math.cos(angle),
                y: cy + baseRadius * Math.sin(angle),
                delay: i * 0.04,
                driftX: (Math.random() - 0.5) * 45,
                driftY: (Math.random() - 0.5) * 45,
                scale: 0.5 + Math.random() * 0.6
            };
        })
    , [startAngle, endAngle, cx, cy]);

    // V6: Content position - further from center for better spacing
    const contentRadius = 310;
    const contentX = cx + contentRadius * Math.cos(midAngle);
    const contentY = cy + contentRadius * Math.sin(midAngle);

    return (
        <g className="sector-panel expanded v6">
            {/* V6: Neural field line connecting center to module */}
            <path
                className="neural-field-line"
                d={`M${cx},${cy} Q${fieldControlX},${fieldControlY} ${nodeX},${nodeY}`}
                fill="none"
                stroke="url(#field-line-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#edge-bloom-filter)"
                style={{
                    opacity: 0.6,
                    transition: 'opacity 0.3s ease'
                }}
            />

            {/* Glass sector background */}
            <path
                className="liquid-glass-sector"
                d={sectorPath}
                fill="url(#sector-glass-gradient)"
                stroke="rgba(0,217,255,0.28)"
                strokeWidth="1.5"
                filter="url(#liquid-glass-v6)"
                style={{
                    transition: 'all 0.45s cubic-bezier(0.25, 0.84, 0.42, 1)'
                }}
            />

            {/* Specular highlight overlay */}
            <path
                className="sector-specular"
                d={sectorPath}
                fill="url(#sector-specular-gradient)"
                opacity="0.3"
                style={{ pointerEvents: 'none' }}
            />

            {/* Edge glow - stronger for V6 */}
            <path
                className="sector-edge-glow"
                d={sectorPath}
                fill="none"
                stroke="rgba(0,217,255,0.5)"
                strokeWidth="2.5"
                filter="url(#v6-bloom)"
                style={{ pointerEvents: 'none' }}
            />

            {/* Particle trails */}
            {particles.map((p, i) => (
                <circle
                    key={`particle-${i}`}
                    className="sector-particle"
                    cx={p.x}
                    cy={p.y}
                    r={2.5 * p.scale}
                    fill="var(--neural-primary)"
                    style={{
                        '--drift-x': `${p.driftX}px`,
                        '--drift-y': `${p.driftY}px`,
                        animationDelay: `${p.delay}s`,
                        opacity: 0.75
                    }}
                />
            ))}

            {/* Module label in sector */}
            <text
                className="sector-label"
                x={cx + 220 * Math.cos(midAngle)}
                y={cy + 220 * Math.sin(midAngle)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--neural-primary)"
                fontSize="13"
                fontWeight="500"
                letterSpacing="0.12em"
                style={{
                    textTransform: 'uppercase',
                    opacity: 0.95,
                    filter: 'drop-shadow(0 0 8px rgba(0,217,255,0.4))'
                }}
            >
                {module.label}
            </text>

            {/* V6: Sector Visualization - Larger size */}
            <foreignObject
                x={contentX - 65}
                y={contentY - 75}
                width="130"
                height="130"
                style={{ overflow: 'visible' }}
            >
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <SectorVisualization moduleKey={module.key} profile={profile} />
                </div>
            </foreignObject>

            {/* V6: Synthesis text - improved overflow handling */}
            {moduleData?.synthesis && (
                <foreignObject
                    x={contentX - 90}
                    y={contentY + 50}
                    width="180"
                    height="75"
                    style={{ overflow: 'hidden' }}
                >
                    <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '9px',
                            lineHeight: '1.35',
                            textAlign: 'center',
                            padding: '6px',
                            maxHeight: '75px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {moduleData.synthesis.slice(0, 160)}
                        {moduleData.synthesis.length > 160 ? '...' : ''}
                    </div>
                </foreignObject>
            )}

            {/* V6: Close hint - updated position */}
            <text
                className="sector-close-hint"
                x={cx + 420 * Math.cos(midAngle)}
                y={cy + 420 * Math.sin(midAngle)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="9"
                letterSpacing="0.05em"
                style={{ cursor: 'pointer' }}
                onClick={onClose}
            >
                TAP TO CLOSE
            </text>
        </g>
    );
}

// Neural Identity Map v3.1 - Unified Radial with Integrated Visualizations
function NeuralIdentityMap({ profile, audioUrl, messages, input, setInput, sending, sendMessage, handleKeyPress }) {
    const [selectedModule, setSelectedModule] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [rippleOrigin, setRippleOrigin] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [mobileTab, setMobileTab] = useState('track');
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 769);
    const audioRef = useRef(null);
    const messagesEndRef = useRef(null);

    // V5 Liquid Glass System - State and Refs
    const [expandedSector, setExpandedSector] = useState(null);
    const [sectorExpanding, setSectorExpanding] = useState(false);
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const glCanvasRef = useRef(null);
    const glContextRef = useRef(null);
    const glProgramRef = useRef(null);
    const rafRef = useRef(null);
    const mouseRef = useRef({ x: 450, y: 450 });

    // Profile data extraction
    const placement = profile?.neural_spectrum?.placement || 'hybrid';
    const bpm = profile?.rhythmic_dna?.characteristics?.tempo_bpm || 120;
    const stability = profile?.timbre_dna?.characteristics?.stability || 0.5;

    // Animation durations from profile
    const pulseDuration = (60 / bpm) * 2;
    const rotateDuration = 30 + (stability * 60);
    const bpmDuration = 60 / bpm;

    const baseColor = getPlacementColor(placement);

    // Get current center content
    const centerContent = React.useMemo(() => {
        if (selectedModule) {
            const moduleData = profile?.[selectedModule];
            return {
                title: NEURAL_MODULES.find(m => m.key === selectedModule)?.label || selectedModule,
                synthesis: moduleData?.synthesis || '',
                characteristics: moduleData?.characteristics || {}
            };
        }
        return {
            title: profile?.sound_description?.characteristics?.sonic_title || 'Neural Profile',
            synthesis: profile?.sound_description?.synthesis || profile?.creative_identity_statement || '',
            characteristics: null
        };
    }, [selectedModule, profile]);

    // Determine which visualization to highlight based on selected module
    const getActiveViz = () => {
        if (!selectedModule) return null;
        const vizMap = {
            'neural_spectrum': 'spectrum',
            'sound_palette': 'constellation',
            'emotional_fingerprint': 'compass',
            'sonic_architecture': 'bars',
            'genre_fusion': 'genres',
            'timbre_dna': 'timbre',
            'rhythmic_dna': 'pulse'
        };
        return vizMap[selectedModule] || null;
    };

    const activeViz = getActiveViz();

    // Handle module click with ripple effect
    // V5 Enhanced module click with sector expansion
    const handleModuleClick = (moduleKey, x, y) => {
        setRippleOrigin({ x, y });

        if (expandedSector === moduleKey) {
            // Collapse current sector
            setSectorExpanding(true);
            setExpandedSector(null);
            setSelectedModule(null);
        } else {
            // Expand new sector
            setSectorExpanding(true);
            setExpandedSector(moduleKey);
            setSelectedModule(moduleKey);
        }

        // Clear animation states
        setTimeout(() => {
            setRippleOrigin(null);
            setSectorExpanding(false);
        }, 500);
    };

    const handleBackToCenter = () => {
        setSectorExpanding(true);
        setExpandedSector(null);
        setSelectedModule(null);
        setTimeout(() => setSectorExpanding(false), 500);
    };

    // Responsive detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 769);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Chat scroll
    useEffect(() => {
        if (showChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showChat]);

    // ═══════════════════════════════════════════════════════════════════════════
    // V5 WEBGL LIQUID GLASS REFRACTION SYSTEM
    // Cross-browser shader implementation for organic glass distortion
    // ═══════════════════════════════════════════════════════════════════════════

    // WebGL Shader Sources
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform float u_refractionStrength;
        uniform float u_expandedSector;
        varying vec2 v_texCoord;

        // Pseudo-random noise
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Smooth noise interpolation
        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // Fractal Brownian Motion for organic patterns
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 4; i++) {
                value += amplitude * smoothNoise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 uv = v_texCoord;
            vec2 center = vec2(0.5);
            float dist = distance(uv, center);

            // Create organic displacement using FBM
            vec2 noiseCoord = uv * 8.0 + u_time * 0.05;
            float nx = fbm(noiseCoord) - 0.5;
            float ny = fbm(noiseCoord + vec2(5.0, 3.0)) - 0.5;

            // Radial mask - stronger effect near glass surfaces (ring area)
            float ringMask = smoothstep(0.15, 0.35, dist) * (1.0 - smoothstep(0.4, 0.5, dist));
            ringMask = max(ringMask, 0.3); // Base level everywhere

            // Apply refraction displacement
            vec2 displacement = vec2(nx, ny) * u_refractionStrength * 0.03 * ringMask;

            // Mouse-based focal point for interactive refraction
            vec2 mouseNorm = u_mouse / u_resolution;
            float mouseDist = distance(uv, mouseNorm);
            float mouseInfluence = 1.0 + (1.0 - smoothstep(0.0, 0.25, mouseDist)) * 0.4;
            displacement *= mouseInfluence;

            // Sector expansion ripple effect
            if (u_expandedSector >= 0.0) {
                float sectorAngle = u_expandedSector * 0.0174533; // degrees to radians
                vec2 sectorDir = vec2(cos(sectorAngle), sin(sectorAngle));
                float sectorDist = abs(dot(normalize(uv - center), sectorDir));
                float ripple = sin(dist * 20.0 - u_time * 3.0) * 0.02;
                displacement += sectorDir * ripple * (1.0 - sectorDist) * ringMask;
            }

            // Final UV with displacement
            vec2 finalUV = uv + displacement;

            // Chromatic aberration
            float aberration = u_refractionStrength * 0.003;
            float r = 0.05 + finalUV.x * 0.1; // Simulated color channel
            float g = 0.1 + finalUV.y * 0.1;
            float b = 0.15 + (1.0 - dist) * 0.2;

            // Fresnel edge glow
            float fresnel = pow(dist, 1.5) * 0.4 * u_refractionStrength;
            vec3 fresnelColor = vec3(0.0, 0.85, 1.0) * fresnel;

            // Base glass tint
            vec3 glassTint = vec3(0.04, 0.04, 0.12);

            // Combine: dark glass with fresnel edge and subtle distortion pattern
            vec3 color = glassTint + fresnelColor;
            color += vec3(nx * 0.05, ny * 0.05, (nx + ny) * 0.03) * ringMask;

            // Specular highlight (top-left light source)
            vec2 lightDir = normalize(vec2(-0.5, -0.7));
            float specular = max(0.0, dot(normalize(uv - center), lightDir));
            specular = pow(specular, 8.0) * 0.3 * (1.0 - dist);
            color += vec3(1.0) * specular;

            gl_FragColor = vec4(color, 0.6 * ringMask);
        }
    `;

    // Compile shader helper
    const compileShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    // Create program helper
    const createProgram = (gl, vertShader, fragShader) => {
        const program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    };

    // WebGL initialization effect
    useEffect(() => {
        const canvas = glCanvasRef.current;
        if (!canvas || isMobile) return;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
            preserveDrawingBuffer: false
        });

        if (!gl) {
            console.warn('WebGL not supported, falling back to CSS effects');
            return;
        }

        glContextRef.current = gl;

        // Compile shaders
        const vertShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertShader || !fragShader) return;

        const program = createProgram(gl, vertShader, fragShader);
        if (!program) return;
        glProgramRef.current = program;

        // Set up geometry (full-screen quad)
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Get uniform locations
        const uniforms = {
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            mouse: gl.getUniformLocation(program, 'u_mouse'),
            time: gl.getUniformLocation(program, 'u_time'),
            refractionStrength: gl.getUniformLocation(program, 'u_refractionStrength'),
            expandedSector: gl.getUniformLocation(program, 'u_expandedSector')
        };

        // Animation loop with visibility-based pausing
        let startTime = performance.now();
        let isVisible = true;
        let lastFrameTime = 0;
        const targetFPS = 30; // Throttle to 30fps for performance
        const frameInterval = 1000 / targetFPS;

        const render = (time) => {
            // Skip rendering if tab is not visible
            if (!isVisible) {
                rafRef.current = requestAnimationFrame(render);
                return;
            }

            // Throttle to target FPS
            const delta = time - lastFrameTime;
            if (delta < frameInterval) {
                rafRef.current = requestAnimationFrame(render);
                return;
            }
            lastFrameTime = time - (delta % frameInterval);

            const elapsed = (time - startTime) * 0.001;

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);

            // Update uniforms
            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
            gl.uniform2f(uniforms.mouse, mouseRef.current.x, mouseRef.current.y);
            gl.uniform1f(uniforms.time, elapsed);
            gl.uniform1f(uniforms.refractionStrength, 0.7);

            // Expanded sector angle (-1 if none)
            const sectorAngle = expandedSector
                ? NEURAL_MODULES.find(m => m.key === expandedSector)?.angle ?? -1
                : -1;
            gl.uniform1f(uniforms.expandedSector, sectorAngle);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            rafRef.current = requestAnimationFrame(render);
        };

        // Visibility change handler for performance
        const handleVisibilityChange = () => {
            isVisible = !document.hidden;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        rafRef.current = requestAnimationFrame(render);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Cleanup WebGL resources
            gl.deleteProgram(program);
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);
            gl.deleteBuffer(posBuffer);
            gl.deleteBuffer(texBuffer);
        };
    }, [isMobile, expandedSector]);

    // Parallax tracking effect
    useEffect(() => {
        if (isMobile) return;

        let animationFrame;
        const handleMouseMove = (e) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1 to 1
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            // Update WebGL mouse position
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width * 900,
                y: (1 - (e.clientY - rect.top) / rect.height) * 900
            };

            // Damped parallax lerp
            animationFrame = requestAnimationFrame(() => {
                setParallaxOffset(prev => ({
                    x: prev.x + (x * 15 - prev.x) * 0.08,
                    y: prev.y + (y * 15 - prev.y) * 0.08
                }));
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isMobile]);

    // V5 Sector path generator
    const generateSectorPath = (cx, cy, innerR, outerR, startAngle, endAngle) => {
        const start = (startAngle - 90) * Math.PI / 180;
        const end = (endAngle - 90) * Math.PI / 180;

        const x1 = cx + innerR * Math.cos(start);
        const y1 = cy + innerR * Math.sin(start);
        const x2 = cx + outerR * Math.cos(start);
        const y2 = cy + outerR * Math.sin(start);
        const x3 = cx + outerR * Math.cos(end);
        const y3 = cy + outerR * Math.sin(end);
        const x4 = cx + innerR * Math.cos(end);
        const y4 = cy + innerR * Math.sin(end);

        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

        return `M${x1},${y1} L${x2},${y2} A${outerR},${outerR} 0 ${largeArc} 1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 ${largeArc} 0 ${x1},${y1} Z`;
    };

    // Memoized sector paths for performance
    const sectorPaths = React.useMemo(() =>
        NEURAL_MODULES.reduce((acc, mod) => {
            const halfAngle = 16.35;
            acc[mod.key] = {
                collapsed: generateSectorPath(450, 450, 120, 320, mod.angle - halfAngle, mod.angle + halfAngle),
                expanded: generateSectorPath(450, 450, 120, 420, mod.angle - halfAngle, mod.angle + halfAngle)
            };
            return acc;
        }, {})
    , []);

    // ═══════════════════════════════════════════════════════════════════════════

    // Get module data
    const getModuleData = (key) => {
        const data = profile?.[key];
        return {
            synthesis: data?.synthesis || '',
            characteristics: data?.characteristics || {}
        };
    };

    // V6: SVG layout constants - EXPANDED for better spacing
    const cx = 475, cy = 475, radius = 360;

    // Generate spectrum arc path
    const generateSpectrumArc = () => {
        const specValue = profile?.neural_spectrum?.value ?? 0.5;
        const startAngle = -150;
        const endAngle = -30;
        const arcRadius = 380;
        const amplitude = 15 + specValue * 25;
        const points = [];
        for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            const angle = startAngle + t * (endAngle - startAngle);
            const rad = (angle - 90) * Math.PI / 180;
            const wave = Math.sin(t * Math.PI * 6) * amplitude * (0.5 + 0.5 * Math.sin(t * Math.PI));
            const r = arcRadius + wave;
            points.push(`${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`);
        }
        return `M${points.join(' L')}`;
    };

    // Generate constellation nodes for sound palette
    const generateConstellation = () => {
        const nodes = [];
        const numNodes = 8;
        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2 + Math.PI / 4;
            const r = 180 + Math.random() * 70;
            nodes.push({
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle),
                size: 2 + Math.random() * 3
            });
        }
        return nodes;
    };

    const constellationNodes = React.useMemo(() => generateConstellation(), []);

    // Generate emotional compass segments
    const generateCompassSegments = () => {
        const labels = ['Focus', 'Energy', 'Calm', 'Drive'];
        const segments = [];
        const compassRadius = 180;
        labels.forEach((label, i) => {
            const startAngle = i * 90 - 45;
            const endAngle = startAngle + 60;
            const start = (startAngle - 90) * Math.PI / 180;
            const end = (endAngle - 90) * Math.PI / 180;
            segments.push({
                path: `M ${cx + compassRadius * Math.cos(start)} ${cy + compassRadius * Math.sin(start)} A ${compassRadius} ${compassRadius} 0 0 1 ${cx + compassRadius * Math.cos(end)} ${cy + compassRadius * Math.sin(end)}`,
                label,
                labelX: cx + (compassRadius + 20) * Math.cos((startAngle + 30 - 90) * Math.PI / 180),
                labelY: cy + (compassRadius + 20) * Math.sin((startAngle + 30 - 90) * Math.PI / 180)
            });
        });
        return segments;
    };

    const compassSegments = React.useMemo(() => generateCompassSegments(), [profile]);

    // Generate architecture bars
    const generateArchBars = () => {
        const arch = profile?.sonic_architecture?.characteristics || {};
        const values = [arch.intro_duration || 0.3, arch.verse_density || 0.5, arch.chorus_energy || 0.7, arch.bridge_contrast || 0.4, arch.outro_fade || 0.3];
        const bars = [];
        const barRadius = 240;
        const numBars = 12;
        for (let i = 0; i < numBars; i++) {
            const angle = 150 + (i / (numBars - 1)) * 60;
            const rad = (angle - 90) * Math.PI / 180;
            const height = 15 + (values[i % values.length] || 0.5) * 35;
            bars.push({ x: cx + barRadius * Math.cos(rad), y: cy + barRadius * Math.sin(rad), height, angle: angle - 90, index: i });
        }
        return bars;
    };

    const archBars = React.useMemo(() => generateArchBars(), [profile]);

    // Generate genre segments
    const generateGenreSegments = () => {
        const genres = profile?.genre_fusion?.characteristics?.genres || ['Electronic', 'Ambient'];
        const segments = [];
        const genreRadius = 360;
        const segmentAngle = 30;
        genres.slice(0, 4).forEach((genre, i) => {
            const startAngle = -60 + i * (segmentAngle + 10);
            const endAngle = startAngle + segmentAngle;
            const start = (startAngle - 90) * Math.PI / 180;
            const end = (endAngle - 90) * Math.PI / 180;
            segments.push({
                path: `M ${cx + genreRadius * Math.cos(start)} ${cy + genreRadius * Math.sin(start)} A ${genreRadius} ${genreRadius} 0 0 1 ${cx + genreRadius * Math.cos(end)} ${cy + genreRadius * Math.sin(end)}`,
                genre,
                color: `hsl(${190 + i * 15}, 100%, 50%)`
            });
        });
        return segments;
    };

    const genreSegments = React.useMemo(() => generateGenreSegments(), [profile]);

    // Mobile Layout Component
    const MobileLayout = () => (
        <>
            {/* Track Tab - Center Hub */}
            <div className={`mobile-panel ${mobileTab === 'track' ? 'active' : ''}`}>
                <div className="neural-center-hub" style={{ position: 'relative', transform: 'none', top: 0, left: 0, margin: '0 auto' }}>
                    <div className="neural-emblem">
                        <NeuralEmblem profile={profile} placement={placement} pulseDuration={pulseDuration} rotateDuration={rotateDuration} />
                    </div>
                    <div className="neural-center-identity">
                        <h2 className="neural-center-title">{centerContent.title}</h2>
                        <div className="neural-center-creator">Neural Music Profile</div>
                    </div>
                    <div className="neural-center-content">
                        <p className="neural-center-synthesis">{centerContent.synthesis}</p>
                    </div>
                    <div className="neural-center-player">
                        <NeuralPlayerMini audioUrl={audioUrl} audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} currentTime={currentTime} setCurrentTime={setCurrentTime} duration={duration} setDuration={setDuration} />
                    </div>
                </div>
            </div>

            {/* V6: Map Tab - Scaled Radial with expanded viewBox */}
            <div className={`mobile-panel ${mobileTab === 'map' ? 'active' : ''}`}>
                <svg viewBox="0 0 950 950" style={{ width: '100%', maxHeight: '65vh' }}>
                    <defs>
                        <linearGradient id="spectrum-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0066FF" />
                            <stop offset="100%" stopColor="#00D9FF" />
                        </linearGradient>
                    </defs>
                    {NEURAL_MODULES.map((mod) => {
                        const x = cx + radius * Math.cos((mod.angle - 90) * Math.PI / 180);
                        const y = cy + radius * Math.sin((mod.angle - 90) * Math.PI / 180);
                        return <line key={`conn-${mod.key}`} className="neural-connection" x1={cx} y1={cy} x2={x} y2={y} />;
                    })}
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke={baseColor} strokeWidth="1" opacity="0.1" strokeDasharray="4 8" />
                    {NEURAL_MODULES.map((mod) => {
                        const x = cx + radius * Math.cos((mod.angle - 90) * Math.PI / 180);
                        const y = cy + radius * Math.sin((mod.angle - 90) * Math.PI / 180);
                        const hasData = !!profile?.[mod.key]?.synthesis;
                        return (
                            <g key={mod.key} className="neural-node-group" onClick={() => handleModuleClick(mod.key, x, y)}>
                                <circle className="neural-node-circle" cx={x} cy={y} r={26} fill={hasData ? baseColor : 'rgba(255,255,255,0.1)'} stroke={baseColor} strokeWidth="1" />
                                <text className="neural-node-label" x={x} y={y + 40}>{mod.label}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Details Tab - Module List */}
            <div className={`mobile-panel ${mobileTab === 'details' ? 'active' : ''}`}>
                <div className="mobile-details-list">
                    {NEURAL_MODULES.map((mod) => {
                        const moduleData = getModuleData(mod.key);
                        const isSelected = selectedModule === mod.key;
                        return (
                            <div key={mod.key} className={`mobile-module-item ${isSelected ? 'active' : ''}`} onClick={() => setSelectedModule(isSelected ? null : mod.key)}>
                                <div className="mobile-module-header">
                                    <div className="mobile-module-glyph"><NeuralGlyph type={mod.glyph} size={28} /></div>
                                    <span className="mobile-module-title">{mod.label}</span>
                                </div>
                                <p className="mobile-module-synthesis">{moduleData.synthesis || 'Analysis pending...'}</p>
                                {isSelected && moduleData.characteristics && Object.keys(moduleData.characteristics).length > 0 && (
                                    <div className="mobile-module-detail">
                                        <div className="mobile-char-grid">
                                            {Object.entries(moduleData.characteristics).slice(0, 4).map(([key, value]) => (
                                                <div key={key} className="mobile-char-item">
                                                    <div className="mobile-char-label">{key.replace(/_/g, ' ')}</div>
                                                    <div className="mobile-char-value">{Array.isArray(value) ? value.slice(0, 2).join(', ') : typeof value === 'number' ? value.toFixed(2) : String(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Tab Navigation */}
            <nav className="mobile-tab-nav">
                <button className={`mobile-tab ${mobileTab === 'track' ? 'active' : ''}`} onClick={() => setMobileTab('track')}>
                    <span className="mobile-tab-icon">◎</span><span>Track</span>
                </button>
                <button className={`mobile-tab ${mobileTab === 'map' ? 'active' : ''}`} onClick={() => setMobileTab('map')}>
                    <span className="mobile-tab-icon">◈</span><span>Map</span>
                </button>
                <button className={`mobile-tab ${mobileTab === 'details' ? 'active' : ''}`} onClick={() => setMobileTab('details')}>
                    <span className="mobile-tab-icon">▣</span><span>Details</span>
                </button>
            </nav>
        </>
    );

    // Mobile: return mobile layout
    if (isMobile) {
        return (
            <div className="neural-identity-map">
                <MobileLayout />
                <button className={`neural-chat-fab ${showChat ? 'active' : ''}`} onClick={() => setShowChat(!showChat)}>{showChat ? '✕' : '💬'}</button>
                {showChat && (
                    <div className="neural-chat-overlay">
                        <div className="neural-chat-header"><h3>Chat with Auron</h3><button className="neural-chat-close" onClick={() => setShowChat(false)}>×</button></div>
                        <div className="neural-chat-messages">{messages.map((msg, i) => (<div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>{msg.content}</div>))}<div ref={messagesEndRef} /></div>
                        <div className="neural-chat-input-area"><input className="neural-chat-input" type="text" placeholder="Ask about your neural profile..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} /><button className="neural-chat-send" onClick={sendMessage} disabled={sending || !input.trim()}>{sending ? '...' : 'Send'}</button></div>
                    </div>
                )}
            </div>
        );
    }

    // Desktop: Full radial layout
    return (
        <div
            ref={containerRef}
            className={`neural-identity-map ${selectedModule ? 'module-selected' : ''} ${expandedSector ? 'sector-expanded' : ''}`}
        >
            {/* V5 WebGL Liquid Glass Canvas Layer */}
            {!isMobile && (
                <canvas
                    ref={glCanvasRef}
                    className="liquid-glass-canvas"
                    width={900}
                    height={900}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100%',
                        maxWidth: '900px',
                        height: 'auto',
                        aspectRatio: '1 / 1',
                        pointerEvents: 'none',
                        zIndex: 0,
                        opacity: 0.7,
                        mixBlendMode: 'screen'
                    }}
                />
            )}

            {/* Background ambient rings with parallax */}
            <div
                className="neural-bg-rings parallax-bg"
                style={{
                    transform: `translate(${parallaxOffset.x * 3}px, ${parallaxOffset.y * 3}px)`
                }}
            >
                {[1, 2, 3, 4, 5].map(i => (<div key={`ring-${i}`} className="neural-bg-ring" style={{ width: `${200 + i * 150}px`, height: `${200 + i * 150}px`, animationDelay: `${i * 0.5}s` }} />))}
            </div>

            {/* V6: Main radial SVG with expanded viewBox for larger layout */}
            <svg className="neural-radial-svg" viewBox="0 0 950 950" style={{ position: 'relative', zIndex: 1 }}>
                <defs>
                    <filter id="node-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="spectrum-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0066FF" /><stop offset="100%" stopColor="#00D9FF" />
                    </linearGradient>
                    <linearGradient id="bar-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#0066FF" /><stop offset="100%" stopColor="#00D9FF" />
                    </linearGradient>

                    {/* ═══════════════════════════════════════════════════════════════
                        V5 LIQUID GLASS SVG FILTERS
                        Apple VisionOS-inspired refraction and glass effects
                    ═══════════════════════════════════════════════════════════════ */}

                    {/* Primary Liquid Glass Filter - Organic distortion */}
                    <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.008 0.008"
                            numOctaves="2"
                            seed="92"
                            result="noise"
                        />
                        <feGaussianBlur in="noise" stdDeviation="2" result="blurred-noise"/>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="blurred-noise"
                            scale="70"
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="displaced"
                        />
                        <feGaussianBlur in="displaced" stdDeviation="0.5" result="softened"/>
                        <feMerge>
                            <feMergeNode in="softened"/>
                        </feMerge>
                    </filter>

                    {/* Hover Liquid Glass - Enhanced distortion with animated seed */}
                    <filter id="liquid-glass-hover" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.012 0.012"
                            numOctaves="3"
                            seed="42"
                            result="noise"
                        >
                            <animate
                                attributeName="seed"
                                values="42;92;142;92;42"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feGaussianBlur in="noise" stdDeviation="2.5" result="blurred-noise"/>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="blurred-noise"
                            scale="90"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* Ripple Feedback Filter - Click/expansion effect */}
                    <filter id="liquid-glass-ripple" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.015 0.015"
                            numOctaves="4"
                            seed="7"
                            result="noise"
                        />
                        <feGaussianBlur in="noise" stdDeviation="3" result="blurred-noise"/>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="blurred-noise"
                            scale="120"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* Edge Bloom Filter - Soft glow around glass edges */}
                    <filter id="edge-bloom-filter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
                        <feFlood floodColor="rgba(0,217,255,0.3)" result="color"/>
                        <feComposite in="color" in2="blur" operator="in" result="glow"/>
                        <feMerge>
                            <feMergeNode in="glow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>

                    {/* Glass Inner Highlight Filter */}
                    <filter id="glass-inner-light" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
                        <feSpecularLighting
                            in="blur"
                            surfaceScale="5"
                            specularConstant="0.75"
                            specularExponent="20"
                            result="spec"
                        >
                            <fePointLight x="450" y="200" z="400"/>
                        </feSpecularLighting>
                        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0"/>
                    </filter>

                    {/* ═══════════════════════════════════════════════════════════════
                        V6 ENHANCED LIQUID GLASS FILTERS
                        Multi-layer refraction with caustic effects
                    ═══════════════════════════════════════════════════════════════ */}

                    {/* V6: Premium Liquid Glass - Multi-layer turbulence */}
                    <filter id="liquid-glass-v6" x="-25%" y="-25%" width="150%" height="150%">
                        {/* First turbulence layer - broad distortion */}
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.004"
                            numOctaves="3"
                            seed="77"
                            result="noise1"
                        />
                        <feGaussianBlur in="noise1" stdDeviation="1.5" result="blur1"/>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="blur1"
                            scale="45"
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="displaced1"
                        />
                        {/* Second turbulence layer - fine detail */}
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.012"
                            numOctaves="2"
                            seed="123"
                            result="noise2"
                        />
                        <feGaussianBlur in="noise2" stdDeviation="0.8" result="blur2"/>
                        <feDisplacementMap
                            in="displaced1"
                            in2="blur2"
                            scale="20"
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="displaced2"
                        />
                        {/* Specular highlight for glass depth */}
                        <feSpecularLighting
                            in="blur1"
                            surfaceScale="3"
                            specularConstant="0.6"
                            specularExponent="25"
                            result="specular"
                        >
                            <fePointLight x="475" y="200" z="350"/>
                        </feSpecularLighting>
                        <feComposite in="displaced2" in2="specular" operator="arithmetic" k1="0" k2="1" k3="0.15" k4="0"/>
                    </filter>

                    {/* V6: Intense Bloom Filter - Strong glow for selected elements */}
                    <filter id="v6-bloom" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur"/>
                        <feFlood floodColor="#00D9FF" floodOpacity="0.55" result="color"/>
                        <feComposite in="color" in2="blur" operator="in" result="glow1"/>
                        <feGaussianBlur in="glow1" stdDeviation="6" result="glow2"/>
                        <feMerge>
                            <feMergeNode in="glow2"/>
                            <feMergeNode in="glow1"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>

                    {/* V6: Caustic Shimmer Filter - Animated glass refraction */}
                    <filter id="v6-caustic" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency="0.008"
                            numOctaves="3"
                            seed="42"
                            result="caustic"
                        >
                            <animate
                                attributeName="seed"
                                values="42;67;92;67;42"
                                dur="5s"
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="caustic"
                            scale="35"
                            xChannelSelector="R"
                            yChannelSelector="B"
                        />
                    </filter>

                    {/* ═══════════════════════════════════════════════════════════════
                        V6 GRADIENT DEFINITIONS
                    ═══════════════════════════════════════════════════════════════ */}

                    {/* Sector Specular Gradient - Top-down highlight */}
                    <linearGradient id="sector-specular-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)"/>
                        <stop offset="30%" stopColor="rgba(255,255,255,0.1)"/>
                        <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                    </linearGradient>

                    {/* Sector Glass Fill Gradient - Depth effect */}
                    <radialGradient id="sector-glass-gradient" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="rgba(0,217,255,0.15)"/>
                        <stop offset="50%" stopColor="rgba(10,10,31,0.3)"/>
                        <stop offset="100%" stopColor="rgba(10,10,31,0.4)"/>
                    </radialGradient>

                    {/* Hub Glass Gradient - Center hub depth */}
                    <radialGradient id="hub-glass-gradient" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
                        <stop offset="40%" stopColor="rgba(0,217,255,0.08)"/>
                        <stop offset="100%" stopColor="rgba(10,10,31,0.35)"/>
                    </radialGradient>

                    {/* Node Glass Gradient - Module nodes */}
                    <radialGradient id="node-glass-gradient" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
                        <stop offset="50%" stopColor="rgba(0,217,255,0.1)"/>
                        <stop offset="100%" stopColor="rgba(10,10,31,0.3)"/>
                    </radialGradient>

                    {/* Field Line Gradient - Neural connection from center to expanded module */}
                    <linearGradient id="field-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(0,217,255,0.1)"/>
                        <stop offset="30%" stopColor="rgba(0,217,255,0.5)"/>
                        <stop offset="70%" stopColor="rgba(0,217,255,0.5)"/>
                        <stop offset="100%" stopColor="rgba(0,217,255,0.8)"/>
                    </linearGradient>

                    {/* Chromatic Aberration Mask */}
                    <mask id="chromatic-mask">
                        <rect x="0" y="0" width="900" height="900" fill="white"/>
                        <circle cx="450" cy="450" r="400" fill="black" opacity="0.3"/>
                    </mask>
                </defs>

                {/* === V5 PARALLAX LAYER: BACKGROUND (2x depth) === */}
                <g
                    className="parallax-bg visualization-layer"
                    style={{
                        transform: `translate(${parallaxOffset.x * 3}px, ${parallaxOffset.y * 3}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {/* Neural Spectrum Arc */}
                    <g className={`neural-spectrum-arc ${activeViz === 'spectrum' ? 'active' : ''}`}>
                        <path className="spectrum-arc-path" d={generateSpectrumArc()} />
                    </g>

                    {/* Floating Constellation */}
                    <g className={`floating-constellation ${activeViz === 'constellation' ? 'active' : ''}`}>
                        {constellationNodes.map((node, i) => (<circle key={`const-${i}`} className="constellation-node" cx={node.x} cy={node.y} r={node.size} />))}
                        {constellationNodes.slice(0, -1).map((node, i) => (<line key={`const-line-${i}`} className="constellation-line" x1={node.x} y1={node.y} x2={constellationNodes[i + 1].x} y2={constellationNodes[i + 1].y} />))}
                    </g>

                    {/* Emotional Compass */}
                    <g className={`emotional-compass ${activeViz === 'compass' ? 'active' : ''}`}>
                        {compassSegments.map((seg, i) => (<g key={`compass-${i}`}><path className="compass-segment" d={seg.path} /><text className="compass-label" x={seg.labelX} y={seg.labelY} textAnchor="middle">{seg.label}</text></g>))}
                    </g>

                    {/* Architecture Bars */}
                    <g className={`architecture-bar-ring ${activeViz === 'bars' ? 'active' : ''}`}>
                        {archBars.map((bar, i) => (<rect key={`bar-${i}`} className="arch-bar" x={bar.x - 3} y={bar.y - bar.height} width="6" height={bar.height} style={{ '--bar-index': i }} transform={`rotate(${bar.angle}, ${bar.x}, ${bar.y})`} />))}
                    </g>

                    {/* Genre Segments */}
                    <g className={`genre-segments ${activeViz === 'genres' ? 'active' : ''}`}>
                        {genreSegments.map((seg, i) => (<path key={`genre-${i}`} className="genre-segment" d={seg.path} stroke={seg.color} />))}
                    </g>

                    {/* Rhythmic Pulse Ring */}
                    <g className={`rhythmic-pulse-ring ${activeViz === 'pulse' ? 'active' : ''}`} style={{ '--bpm-duration': `${bpmDuration}s` }}>
                        <circle cx={cx} cy={cy} r={100} fill="none" stroke="var(--neural-primary)" strokeWidth="1" opacity="0.2" strokeDasharray="2 6" />
                        <g className="pulse-dots-group">
                            {[0, 90, 180, 270].map((angle, i) => {
                                const rad = (angle - 90) * Math.PI / 180;
                                return <circle key={`pulse-${i}`} className="pulse-dot" cx={cx + 100 * Math.cos(rad)} cy={cy + 100 * Math.sin(rad)} r="4" />;
                            })}
                        </g>
                    </g>
                </g>

                {/* === CORE RADIAL STRUCTURE === */}

                {/* Connection lines from center to each node */}
                <g
                    className="parallax-mid connection-layer"
                    style={{
                        transform: `translate(${parallaxOffset.x * 1.5}px, ${parallaxOffset.y * 1.5}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {NEURAL_MODULES.map((mod) => {
                        const x = cx + radius * Math.cos((mod.angle - 90) * Math.PI / 180);
                        const y = cy + radius * Math.sin((mod.angle - 90) * Math.PI / 180);
                        const isActive = selectedModule === mod.key;
                        const isDimmed = expandedSector && expandedSector !== mod.key;
                        return (
                            <line
                                key={`conn-${mod.key}`}
                                className={`neural-connection ${isActive ? 'active' : ''}`}
                                x1={cx}
                                y1={cy}
                                x2={x}
                                y2={y}
                                style={{
                                    opacity: isDimmed ? 0.1 : undefined,
                                    transition: 'opacity 0.4s ease'
                                }}
                            />
                        );
                    })}

                    {/* Ring connecting all nodes */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={baseColor}
                        strokeWidth="1"
                        opacity={expandedSector ? 0.05 : 0.1}
                        strokeDasharray="4 8"
                        style={{ transition: 'opacity 0.4s ease' }}
                    />
                </g>

                {/* === V5 PARALLAX LAYER: FOREGROUND (0.5x depth) === */}
                <g
                    className="parallax-fg sector-layer"
                    style={{
                        transform: `translate(${parallaxOffset.x * 0.75}px, ${parallaxOffset.y * 0.75}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {/* V5 Expanded Sector Panels */}
                    {expandedSector && (
                        <ExpandedSectorPanel
                            module={NEURAL_MODULES.find(m => m.key === expandedSector)}
                            profile={profile}
                            cx={cx}
                            cy={cy}
                            isExpanded={true}
                            sectorPath={sectorPaths[expandedSector]?.expanded}
                            onClose={handleBackToCenter}
                        />
                    )}
                </g>

                {/* Module nodes with V5 liquid glass styling */}
                <g
                    className="parallax-mid"
                    style={{
                        transform: `translate(${parallaxOffset.x * 1.5}px, ${parallaxOffset.y * 1.5}px)`
                    }}
                >
                    {NEURAL_MODULES.map((mod) => {
                        const x = cx + radius * Math.cos((mod.angle - 90) * Math.PI / 180);
                        const y = cy + radius * Math.sin((mod.angle - 90) * Math.PI / 180);
                        const hasData = !!profile?.[mod.key]?.synthesis;
                        const isSelected = selectedModule === mod.key;
                        const isExpanded = expandedSector === mod.key;
                        const isDimmed = expandedSector && !isExpanded;
                        // V6: Larger nodes for better visibility
                        const nodeRadius = isSelected ? 38 : 30;

                        return (
                            <g
                                key={mod.key}
                                className={`neural-node-group liquid-glass-node ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''} ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => handleModuleClick(mod.key, x, y)}
                                style={{
                                    cursor: 'pointer',
                                    opacity: isDimmed ? 0.15 : 1,
                                    transition: 'opacity 0.4s var(--spring-curve, ease-out)'
                                }}
                            >
                                {/* Glass surface background */}
                                <circle
                                    className="node-glass-surface"
                                    cx={x}
                                    cy={y}
                                    r={nodeRadius + 4}
                                    fill="url(#node-glass-gradient)"
                                    stroke="var(--liquid-glass-border, rgba(255,255,255,0.12))"
                                    strokeWidth="1"
                                    filter={isExpanded ? 'url(#liquid-glass-hover)' : 'url(#liquid-glass-filter)'}
                                    opacity={hasData ? 0.8 : 0.4}
                                />

                                {/* Main node circle */}
                                <circle
                                    className="neural-node-circle"
                                    cx={x}
                                    cy={y}
                                    r={nodeRadius}
                                    fill={hasData ? baseColor : 'rgba(255,255,255,0.1)'}
                                    stroke={isSelected ? '#fff' : baseColor}
                                    strokeWidth={isSelected ? 2 : 1}
                                    filter={isSelected ? 'url(#edge-bloom-filter)' : 'none'}
                                />

                                {/* V6: Larger glyph to match bigger nodes */}
                                <foreignObject x={x - 16} y={y - 16} width="32" height="32" className="neural-node-glyph">
                                    <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <NeuralGlyph type={mod.glyph} size={28} />
                                    </div>
                                </foreignObject>

                                {/* Label */}
                                <text
                                    className="neural-node-label"
                                    x={x}
                                    y={y + nodeRadius + 14}
                                    style={{
                                        opacity: isDimmed ? 0.3 : 1,
                                        transition: 'opacity 0.4s ease'
                                    }}
                                >
                                    {mod.label}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* Ripple effect on click */}
                {rippleOrigin && (
                    <circle
                        className="ripple-effect"
                        cx={rippleOrigin.x}
                        cy={rippleOrigin.y}
                        r="30"
                        filter="url(#liquid-glass-ripple)"
                    />
                )}
            </svg>

            {/* Center hub (HTML overlay) with V5 liquid glass */}
            <div className={`neural-center-hub liquid-glass-hub ${selectedModule ? 'module-active' : ''} ${expandedSector ? 'sector-expanded' : ''}`}>
                {selectedModule && (<button className="neural-back-btn" onClick={handleBackToCenter}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Back to Profile</button>)}
                <div className="neural-emblem"><NeuralEmblem profile={profile} placement={placement} pulseDuration={pulseDuration} rotateDuration={rotateDuration} /></div>
                <div className="neural-center-identity"><h2 className="neural-center-title">{centerContent.title}</h2><div className="neural-center-creator">Neural Music Profile</div></div>
                <div className="neural-center-content">
                    <p className="neural-center-synthesis">{centerContent.synthesis}</p>
                    {centerContent.characteristics && Object.keys(centerContent.characteristics).length > 0 && (
                        <div className="neural-center-characteristics">
                            {Object.entries(centerContent.characteristics).slice(0, 6).map(([key, value]) => (
                                <div key={key} className="neural-char-item"><div className="neural-char-label">{key.replace(/_/g, ' ')}</div><div className="neural-char-value">{Array.isArray(value) ? value.slice(0, 2).join(', ') : typeof value === 'number' ? value.toFixed(2) : String(value)}</div></div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="neural-center-player"><NeuralPlayerMini audioUrl={audioUrl} audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} currentTime={currentTime} setCurrentTime={setCurrentTime} duration={duration} setDuration={setDuration} /></div>
            </div>

            {/* Mobile swipe hint */}
            <div className="mobile-swipe-hint">Tap a module to explore</div>

            {/* Floating chat button */}
            <button className={`neural-chat-fab ${showChat ? 'active' : ''}`} onClick={() => setShowChat(!showChat)}>{showChat ? '✕' : '💬'}</button>

            {/* Chat overlay */}
            {showChat && (
                <div className="neural-chat-overlay">
                    <div className="neural-chat-header"><h3>Chat with Auron</h3><button className="neural-chat-close" onClick={() => setShowChat(false)}>×</button></div>
                    <div className="neural-chat-messages">{messages.map((msg, i) => (<div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>{msg.content}</div>))}<div ref={messagesEndRef} /></div>
                    <div className="neural-chat-input-area"><input className="neural-chat-input" type="text" placeholder="Ask about your neural profile..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} /><button className="neural-chat-send" onClick={sendMessage} disabled={sending || !input.trim()}>{sending ? '...' : 'Send'}</button></div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// AUDIO SESSION MODAL - Session Analysis Mode
// ============================================================
function AudioSessionModal({ uploadId, synthesizedProfile, onClose, audioUrl }) {
    const [sessionData, setSessionData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(!synthesizedProfile);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});
    const [showChat, setShowChat] = useState(false);
    const messagesEndRef = useRef(null);

    // Neural Lab state
    const [selectedModule, setSelectedModule] = useState(null);
    const [rightPanelTab, setRightPanelTab] = useState('modules');
    const [mobileTab, setMobileTab] = useState('identity');

    // Profile data from synthesized response
    const profile = synthesizedProfile?.profile || {};
    const creativeIdentity = synthesizedProfile?.creative_identity || profile?.creative_identity_statement;
    const dspFacts = synthesizedProfile?.dsp_facts;

    useEffect(() => {
        if (!synthesizedProfile) {
            loadSessionData();
        } else {
            // Generate welcome message from synthesized profile
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
        const sonicTitle = soundDesc?.sonic_title || 'Your Track';
        return `Your sonic fingerprint has been synthesized. I see "${sonicTitle}" — explore the modules below to understand the architecture of your sound.

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

    const toggleModule = (moduleKey) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleKey]: !prev[moduleKey]
        }));
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);

        // Add user message immediately
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage
        }]);

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

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();

            // Add Auron's response
            setMessages(prev => [...prev, {
                role: 'auron',
                content: data.message || "I'm reflecting on what you've shared..."
            }]);

        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                role: 'auron',
                content: "I apologize, but I'm having trouble responding right now. The session is active, but the connection needs attention."
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

    // Module Card Component
    const ModuleCard = ({ title, moduleKey, children, fullWidth }) => (
        <div
            onClick={() => toggleModule(moduleKey)}
            style={{
                background: 'rgba(10, 10, 31, 0.8)',
                border: expandedModules[moduleKey] ? '1px solid rgba(0, 217, 255, 0.4)' : '1px solid rgba(0, 217, 255, 0.15)',
                borderRadius: '0',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                gridColumn: fullWidth ? '1 / -1' : 'auto',
                boxShadow: expandedModules[moduleKey] ? '0 0 20px rgba(0, 217, 255, 0.15)' : 'none'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedModules[moduleKey] ? '0.75rem' : 0
            }}>
                <div style={{
                    fontSize: '0.6875rem',
                    color: 'rgba(0, 217, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: '600'
                }}>
                    {title}
                </div>
                <div style={{ color: 'rgba(0, 217, 255, 0.6)', fontSize: '0.75rem' }}>
                    {expandedModules[moduleKey] ? '−' : '+'}
                </div>
            </div>
            {expandedModules[moduleKey] && (
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    {children}
                </div>
            )}
            {!expandedModules[moduleKey] && children && (
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginTop: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof children === 'string' ? children.substring(0, 50) + '...' : 'Click to expand'}
                </div>
            )}
        </div>
    );

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

    // Get sonic title from profile
    const sonicTitle = profile?.sound_description?.sonic_title || sessionData?.track_info?.filename || 'Your Track';
    const soundSynthesis = profile?.sound_description?.synthesis;

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
                justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{
                        fontSize: '0.6875rem',
                        color: 'rgba(0, 217, 255, 0.8)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginBottom: '0.25rem'
                    }}>
                        YOUR SONIC FINGERPRINT
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
                        borderRadius: '0',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Close
                </button>
            </div>

            {/* Neural Identity Map v2 - Unified Radial */}
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
    );
}
