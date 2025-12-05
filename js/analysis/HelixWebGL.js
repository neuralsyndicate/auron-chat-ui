// ============================================================
// V7 NEURAL HELIX - WebGL Renderer
// Fullscreen Cinematic Mode - Diagonal DNA double helix
// Soft drift + breathing + particles + bright glow
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const HELIX_CONFIG = {
    horizontalStretch: 1.8,     // +38% wider for fullscreen
    amplitude: 0.38,            // +36% taller oscillations
    frequency: 3.0,             // Fewer waves for smoother DNA curves
    segments: 200,
    nodeCount: 10,              // 10 nodes (sound_description moved to header)
    rungCount: 18,              // DNA rungs connecting strands
    // Diagonal offset (top-left to bottom-right flow)
    diagonalOffsetX: -0.4,      // Shift left more
    diagonalOffsetY: 0.25,      // Slightly higher start
    diagonalSlopeX: 0.8,        // Wider diagonal spread
    diagonalSlopeY: -0.5        // Steeper diagonal
};

// Node keys (sound_description moved to header)
const NODE_KEYS = [
    'genre_fusion',
    'neural_spectrum',
    'sound_palette',
    'tonal_identity',
    'rhythmic_dna',
    'timbre_dna',
    'emotional_fingerprint',
    'processing_signature',
    'sonic_architecture',
    'inspirational_triggers'
];

const NODE_LABELS = [
    'Genre Fusion',
    'Neural Spectrum',
    'Sound Palette',
    'Tonal DNA',
    'Rhythmic DNA',
    'Timbre DNA',
    'Emotional Fingerprint',
    'Processing Signature',
    'Sonic Architecture',
    'Inspirational Triggers'
];

// ═══════════════════════════════════════════════════════════════
// PARAMETRIC HELIX FUNCTIONS (DIAGONAL FLOW)
// ═══════════════════════════════════════════════════════════════

function strandA(t) {
    const baseX = (t - 0.5) * HELIX_CONFIG.horizontalStretch;
    const baseY = HELIX_CONFIG.amplitude * Math.sin(t * HELIX_CONFIG.frequency * Math.PI * 2);
    const baseZ = HELIX_CONFIG.amplitude * Math.cos(t * HELIX_CONFIG.frequency * Math.PI * 2);

    return {
        x: baseX + HELIX_CONFIG.diagonalOffsetX + t * HELIX_CONFIG.diagonalSlopeX,
        y: baseY + HELIX_CONFIG.diagonalOffsetY + t * HELIX_CONFIG.diagonalSlopeY,
        z: baseZ
    };
}

function strandB(t) {
    const baseX = (t - 0.5) * HELIX_CONFIG.horizontalStretch;
    // Add slight vertical phase offset (0.05) for organic asymmetry
    const phaseOffset = 0.05;
    const baseY = HELIX_CONFIG.amplitude * Math.sin(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI + phaseOffset);
    const baseZ = HELIX_CONFIG.amplitude * Math.cos(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI);

    // Add slight horizontal offset for visual separation
    const horizontalSeparation = 0.02;

    return {
        x: baseX + HELIX_CONFIG.diagonalOffsetX + t * HELIX_CONFIG.diagonalSlopeX + horizontalSeparation,
        y: baseY + HELIX_CONFIG.diagonalOffsetY + t * HELIX_CONFIG.diagonalSlopeY,
        z: baseZ * 0.9  // Slightly reduced depth for brightness difference
    };
}

// ═══════════════════════════════════════════════════════════════
// GLSL SHADER SOURCES
// ═══════════════════════════════════════════════════════════════

const HELIX_VERT = `
attribute vec3 a_position;
attribute float a_progress;
attribute float a_strand;

uniform float u_time;
uniform float u_xDrift;
uniform float u_yDrift;
uniform float u_breathScale;
uniform float u_zoom;
uniform vec2 u_resolution;
uniform vec2 u_parallax;

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    vec3 pos = a_position;

    // Apply drift animation
    pos.x += u_xDrift;
    pos.y += u_yDrift;

    // Apply parallax
    pos.x += u_parallax.x;
    pos.y += u_parallax.y;

    // Apply breathing scale
    pos *= u_breathScale;

    // Apply selection zoom
    pos *= u_zoom;

    // Perspective
    float perspective = 1.0 / (1.0 + pos.z * 0.3);
    float aspect = u_resolution.x / u_resolution.y;

    gl_Position = vec4(
        pos.x * perspective / aspect,
        pos.y * perspective,
        pos.z * 0.5,
        1.0
    );

    v_progress = a_progress;
    v_depth = pos.z;
    v_strand = a_strand;
}
`;

const HELIX_FRAG = `
precision highp float;

uniform vec3 u_colorFront;
uniform vec3 u_colorBack;
uniform float u_time;
uniform float u_waveOffset;
uniform float u_glowIntensity;
uniform float u_depthShimmer;
uniform float u_alpha;
uniform float u_colorScale;

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    // Depth-based color (front cyan, back blue)
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);

    // Apply color scale for multi-pass rendering (outer passes are dimmer)
    vec3 baseColor = mix(u_colorBack, u_colorFront, depthFactor * u_colorScale);

    // Traveling luminous wave (brighter)
    float wave = sin((v_progress * 30.0) - u_waveOffset) * 0.5 + 0.5;
    float waveGlow = wave * 0.5;

    // Depth shimmer effect (modulate based on depth + time)
    float shimmer = sin(v_depth * 8.0 + u_time * 2.0) * 0.15 * u_depthShimmer;

    // Core glow (bright light tube effect)
    float coreGlow = 1.4;

    // Final color with bloom + shimmer
    vec3 glowColor = baseColor * (1.0 + coreGlow + waveGlow + shimmer);

    // Edge fade at helix ends
    float edgeFade = smoothstep(0.0, 0.05, v_progress) * smoothstep(1.0, 0.95, v_progress);

    float alpha = u_alpha * edgeFade;

    gl_FragColor = vec4(glowColor, alpha);
}
`;

const NODE_VERT = `
attribute vec3 a_position;
attribute float a_size;
attribute float a_selected;
attribute float a_hovered;
attribute float a_dimmed;
attribute float a_index;
attribute float a_visited;  // V7.5: visited state

uniform float u_time;
uniform float u_xDrift;
uniform float u_yDrift;
uniform float u_breathScale;
uniform float u_zoom;
uniform vec2 u_resolution;
uniform vec2 u_parallax;
uniform float u_baseSize;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_dimmed;
varying float v_index;
varying float v_visited;  // V7.5: visited state

void main() {
    vec3 pos = a_position;

    // Apply drift animation
    pos.x += u_xDrift;
    pos.y += u_yDrift;

    // Apply parallax
    pos.x += u_parallax.x;
    pos.y += u_parallax.y;

    // Apply breathing scale
    pos *= u_breathScale;

    // Apply selection zoom
    pos *= u_zoom;

    // Perspective
    float perspective = 1.0 / (1.0 + pos.z * 0.3);
    float aspect = u_resolution.x / u_resolution.y;

    // Depth-based size scaling
    float depthSize = mix(0.6, 1.4, (pos.z + 0.3) / 0.6);
    float finalSize = u_baseSize * a_size * depthSize * perspective;

    // Node breathing effect (±6% over 2.5 seconds, staggered by index)
    float nodePulse = 1.0 + sin(u_time * 2.5 + a_index * 0.7) * 0.06;
    finalSize *= nodePulse;

    // V7.5: Selection/hover size boost
    if (a_selected > 0.5) {
        finalSize *= 1.62;  // V7.5: +12% more (was 1.5)
    } else if (a_hovered > 0.5) {
        finalSize *= 1.18;  // 18% hover scale boost
    }

    // 30% larger nodes (0.065 vs 0.05)
    gl_PointSize = finalSize * min(u_resolution.x, u_resolution.y) * 0.065;

    gl_Position = vec4(
        pos.x * perspective / aspect,
        pos.y * perspective,
        pos.z * 0.5,
        1.0
    );

    v_depth = pos.z;
    v_selected = a_selected;
    v_hovered = a_hovered;
    v_dimmed = a_dimmed;
    v_index = a_index;
    v_visited = a_visited;  // V7.5
}
`;

const NODE_FRAG = `
precision highp float;

uniform vec3 u_colorPrimary;
uniform vec3 u_colorSelected;
uniform vec3 u_colorHalo;
uniform float u_time;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_dimmed;
varying float v_index;
varying float v_visited;  // V7.5

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // LAYER 1: Core circle (solid bright center)
    float core = 1.0 - smoothstep(0.0, 0.18, dist);

    // LAYER 2: Inner ring (65% opacity ring around core)
    float innerRing = smoothstep(0.15, 0.22, dist) * (1.0 - smoothstep(0.28, 0.35, dist));
    innerRing *= 0.65;

    // LAYER 3: Outer halo (soft radial gradient)
    float halo = 1.0 - smoothstep(0.25, 0.5, dist);
    halo = pow(halo, 2.0) * 0.4;

    if (core + innerRing + halo < 0.01) discard;

    // Depth-based brightness
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);

    // State-based intensity modifications
    float coreIntensity = 1.0;
    float ringIntensity = 1.0;
    float haloIntensity = 1.0;

    vec3 coreColor = u_colorPrimary * mix(0.6, 1.0, depthFactor);
    vec3 ringColor = u_colorPrimary * 0.8 * mix(0.6, 1.0, depthFactor);
    vec3 haloColor = u_colorHalo;

    if (v_selected > 0.5) {
        // V7.5: Selection - enhanced glow
        float selectionPulse = sin(u_time * 5.0) * 0.15 + 0.9;
        coreColor = u_colorSelected;
        coreIntensity = 1.8 * selectionPulse;  // V7.5: was 1.5

        // Ring ripple (expanding ring animation)
        float rippleTime = fract(u_time * 0.8);
        float rippleRadius = 0.2 + rippleTime * 0.35;  // V7.5: larger ripple
        float rippleRing = smoothstep(rippleRadius - 0.06, rippleRadius, dist) *
                          (1.0 - smoothstep(rippleRadius, rippleRadius + 0.1, dist));
        rippleRing *= (1.0 - rippleTime);  // Fade out as it expands

        haloIntensity = 3.2;  // V7.5: was 2.5
        ringIntensity = 1.8 + rippleRing * 2.5;  // V7.5: stronger ring

    } else if (v_hovered > 0.5) {
        // Hover: increased brightness
        coreIntensity = 1.3;
        ringIntensity = 1.3;
        haloIntensity = 1.8;
    }

    // Combine all three layers
    vec3 color = coreColor * core * coreIntensity;
    color += ringColor * innerRing * ringIntensity;
    color += haloColor * halo * haloIntensity;

    // V7.5: Visited state ring (subtle cyan outline when not selected)
    if (v_visited > 0.5 && v_selected < 0.5) {
        float visitedRing = smoothstep(0.32, 0.36, dist) * (1.0 - smoothstep(0.38, 0.42, dist));
        color += vec3(0.0, 0.6, 0.8) * visitedRing * 0.35;
    }

    // Dimming when another node is selected
    float dim = v_dimmed > 0.5 ? 0.35 : 1.0;
    color *= dim;

    float alpha = (core + innerRing * 0.7 + halo * 0.4) * dim;
    alpha *= mix(0.6, 1.0, depthFactor);

    gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════
// RUNG SHADERS (DNA rungs connecting strands)
// ═══════════════════════════════════════════════════════════════

const RUNG_VERT = `
attribute vec3 a_position;
attribute float a_progress;

uniform float u_time;
uniform float u_xDrift;
uniform float u_yDrift;
uniform float u_breathScale;
uniform float u_zoom;
uniform vec2 u_resolution;
uniform vec2 u_parallax;

varying float v_progress;
varying float v_depth;

void main() {
    vec3 pos = a_position;

    // Apply drift animation
    pos.x += u_xDrift;
    pos.y += u_yDrift;

    // Apply parallax
    pos.x += u_parallax.x;
    pos.y += u_parallax.y;

    // Apply breathing scale
    pos *= u_breathScale;

    // Apply selection zoom
    pos *= u_zoom;

    // Perspective
    float perspective = 1.0 / (1.0 + pos.z * 0.3);
    float aspect = u_resolution.x / u_resolution.y;

    gl_Position = vec4(
        pos.x * perspective / aspect,
        pos.y * perspective,
        pos.z * 0.5,
        1.0
    );

    v_progress = a_progress;
    v_depth = pos.z;
}
`;

const RUNG_FRAG = `
precision highp float;

uniform vec3 u_rungColor;
uniform float u_time;
uniform float u_alpha;

varying float v_progress;
varying float v_depth;

void main() {
    // Depth-based opacity
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);

    // Subtle pulse along progress
    float pulse = 0.7 + 0.3 * sin(v_progress * 36.0 + u_time * 2.0);

    vec3 color = u_rungColor * pulse * mix(0.5, 1.0, depthFactor);
    float alpha = u_alpha * mix(0.3, 0.6, depthFactor);

    gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════
// GEOMETRY GENERATION
// ═══════════════════════════════════════════════════════════════

function generateHelixGeometry() {
    const { segments } = HELIX_CONFIG;
    const positions = [];
    const progress = [];
    const strands = [];

    // Strand A
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pos = strandA(t);
        positions.push(pos.x, pos.y, pos.z);
        progress.push(t);
        strands.push(0);
    }

    // Strand B
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pos = strandB(t);
        positions.push(pos.x, pos.y, pos.z);
        progress.push(t);
        strands.push(1);
    }

    return {
        positions: new Float32Array(positions),
        progress: new Float32Array(progress),
        strands: new Float32Array(strands),
        vertexCount: (segments + 1) * 2
    };
}

function calculateNodePositions() {
    const nodes = [];
    const nodeCount = HELIX_CONFIG.nodeCount;  // 10 nodes
    for (let i = 0; i < nodeCount; i++) {
        const t = i / (nodeCount - 1);  // Distribute evenly across full helix
        const strand = i % 2 === 0 ? strandA : strandB;
        const pos = strand(t);
        nodes.push({
            key: NODE_KEYS[i],
            label: NODE_LABELS[i],
            t: t,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            index: i
        });
    }
    return nodes;
}

function generateRungGeometry() {
    const rungCount = HELIX_CONFIG.rungCount;  // 18 rungs
    const positions = [];
    const progress = [];

    for (let i = 0; i < rungCount; i++) {
        const t = (i + 0.5) / rungCount;  // Evenly distributed, offset by half
        const posA = strandA(t);
        const posB = strandB(t);

        // Each rung needs 2 vertices (start and end points)
        positions.push(posA.x, posA.y, posA.z);
        positions.push(posB.x, posB.y, posB.z);
        progress.push(t, t);
    }

    return {
        positions: new Float32Array(positions),
        progress: new Float32Array(progress),
        vertexCount: rungCount * 2
    };
}

// ═══════════════════════════════════════════════════════════════
// WEBGL UTILITIES
// ═══════════════════════════════════════════════════════════════

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        console.error(`${typeName} shader compile error:`, info || '(no info available)');
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertSource, fragSource) {
    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSource);

    if (!vertShader || !fragShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    program.vertShader = vertShader;
    program.fragShader = fragShader;

    return program;
}

function getUniformLocations(gl, program, names) {
    const locations = {};
    names.forEach(name => {
        locations[name] = gl.getUniformLocation(program, name);
    });
    return locations;
}

function getAttribLocations(gl, program, names) {
    const locations = {};
    names.forEach(name => {
        locations[name] = gl.getAttribLocation(program, name);
    });
    return locations;
}

function bindVertexAttrib(gl, location, buffer, size, type = gl.FLOAT) {
    if (location === -1) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, type, false, 0, 0);
}

function disableVertexAttribs(gl, attribs) {
    Object.values(attribs).forEach(loc => {
        if (loc !== -1) gl.disableVertexAttribArray(loc);
    });
}

// ═══════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

function hexToGL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

const COLORS = {
    front: hexToGL('#3FE3FF'),    // Soft cyan (primary helix)
    back: hexToGL('#0088cc'),     // Brighter back strand
    selected: hexToGL('#00FFFF'),
    halo: [0.0, 0.2, 0.4],        // Deep blue halo rgba(0, 50, 100)
    rung: hexToGL('#1a8caa')      // Muted cyan for DNA rungs
};

// ═══════════════════════════════════════════════════════════════
// HIT DETECTION
// ═══════════════════════════════════════════════════════════════

function createHitDetector(canvas, nodes, animation) {
    return {
        test(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();

            const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

            const aspect = rect.width / rect.height;

            let closest = null;
            let minDist = Infinity;
            const hitRadius = 0.1;  // Slightly larger hit radius for better UX

            for (const node of nodes) {
                let x = node.x + animation.xDrift;
                let y = node.y + animation.yDrift;
                let z = node.z;

                x *= animation.breathScale * animation.zoom;
                y *= animation.breathScale * animation.zoom;
                z *= animation.breathScale * animation.zoom;

                const p = 1.0 / (1.0 + z * 0.3);
                const ndcNodeX = (x * p) / aspect;
                const ndcNodeY = y * p;

                const dist = Math.hypot(ndcX - ndcNodeX, ndcY - ndcNodeY);
                const adjustedRadius = hitRadius * p;

                if (dist < adjustedRadius && dist < minDist) {
                    minDist = dist;

                    // Convert NDC to pixel coordinates for tooltip positioning
                    const pixelX = ((ndcNodeX + 1) / 2) * rect.width;
                    const pixelY = ((1 - ndcNodeY) / 2) * rect.height;

                    closest = {
                        ...node,
                        ndcX: ndcNodeX,
                        ndcY: ndcNodeY,
                        screenX: rect.left + pixelX,  // Absolute pixel X
                        screenY: rect.top + pixelY,   // Absolute pixel Y
                        dist
                    };
                }
            }

            return closest;
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════════

function createHelixRenderer(canvas, callbacks = {}) {
    const { onHover, onClick } = callbacks;

    const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        console.warn('WebGL not supported');
        return null;
    }

    // Create shader programs
    const helixProgram = createProgram(gl, HELIX_VERT, HELIX_FRAG);
    const nodeProgram = createProgram(gl, NODE_VERT, NODE_FRAG);
    const rungProgram = createProgram(gl, RUNG_VERT, RUNG_FRAG);

    if (!helixProgram || !nodeProgram || !rungProgram) {
        console.error('Failed to create shader programs');
        return null;
    }

    // Generate geometry
    const helixGeometry = generateHelixGeometry();
    const nodePositions = calculateNodePositions();
    const rungGeometry = generateRungGeometry();  // 18 DNA rungs

    // ─────────────────────────────────────────────────────────────
    // ANIMATION STATE
    // ─────────────────────────────────────────────────────────────

    const animation = {
        // Soft drift (constant motion)
        xDrift: 0,
        yDrift: 0,
        xDriftSpeed: 0.2,
        yDriftSpeed: 0.15,
        xDriftAmplitude: 0.02,
        yDriftAmplitude: 0.02,

        // Multi-frequency organic breathing (6-8 second cycle)
        breathScale: 1.0,
        breathFrequencies: [0.08, 0.13, 0.21],  // Layered sine waves
        breathWeights: [1.0, 0.4, 0.2],
        breathAmplitude: 0.04,  // ±4% scale oscillation

        // Depth shimmer
        depthShimmer: 0,
        depthShimmerIntensity: 0.3,

        // Traveling wave
        waveOffset: 0,
        waveSpeed: 3.0,

        // Selection state
        zoom: 1.0,
        targetZoom: 1.0,
        motionScale: 1.0,
        targetMotionScale: 1.0,

        // Parallax (cursor-based)
        parallaxX: 0,
        parallaxY: 0,
        targetParallaxX: 0,
        targetParallaxY: 0,

        time: 0
    };

    const hitDetector = createHitDetector(canvas, nodePositions, animation);

    // ─────────────────────────────────────────────────────────────
    // HELIX BUFFERS
    // ─────────────────────────────────────────────────────────────

    const helixPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, helixPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, helixGeometry.positions, gl.STATIC_DRAW);

    const helixProgressBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, helixProgressBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, helixGeometry.progress, gl.STATIC_DRAW);

    const helixStrandBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, helixStrandBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, helixGeometry.strands, gl.STATIC_DRAW);

    const helixAttribs = getAttribLocations(gl, helixProgram, ['a_position', 'a_progress', 'a_strand']);
    const helixUniforms = getUniformLocations(gl, helixProgram, [
        'u_time', 'u_xDrift', 'u_yDrift', 'u_breathScale', 'u_zoom', 'u_resolution',
        'u_parallax', 'u_colorFront', 'u_colorBack', 'u_waveOffset', 'u_glowIntensity',
        'u_depthShimmer', 'u_alpha', 'u_colorScale'
    ]);

    // ─────────────────────────────────────────────────────────────
    // NODE BUFFERS
    // ─────────────────────────────────────────────────────────────

    const nodeCount = nodePositions.length;
    const nodePosData = new Float32Array(nodeCount * 3);
    const nodeSizeData = new Float32Array(nodeCount);
    const nodeSelectedData = new Float32Array(nodeCount);
    const nodeHoveredData = new Float32Array(nodeCount);
    const nodeDimmedData = new Float32Array(nodeCount);
    const nodeIndexData = new Float32Array(nodeCount);
    const nodeVisitedData = new Float32Array(nodeCount);  // V7.5

    nodePositions.forEach((node, i) => {
        nodePosData[i * 3] = node.x;
        nodePosData[i * 3 + 1] = node.y;
        nodePosData[i * 3 + 2] = node.z;
        nodeSizeData[i] = 1.0;
        nodeIndexData[i] = i;
    });

    const nodePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodePosData, gl.STATIC_DRAW);

    const nodeSizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeSizeData, gl.STATIC_DRAW);

    const nodeSelectedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeSelectedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeSelectedData, gl.DYNAMIC_DRAW);

    const nodeHoveredBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeHoveredBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeHoveredData, gl.DYNAMIC_DRAW);

    const nodeDimmedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeDimmedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeDimmedData, gl.DYNAMIC_DRAW);

    const nodeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeIndexData, gl.STATIC_DRAW);

    // V7.5: Visited state buffer
    const nodeVisitedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeVisitedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeVisitedData, gl.DYNAMIC_DRAW);

    const nodeAttribs = getAttribLocations(gl, nodeProgram, [
        'a_position', 'a_size', 'a_selected', 'a_hovered', 'a_dimmed', 'a_index', 'a_visited'
    ]);
    const nodeUniforms = getUniformLocations(gl, nodeProgram, [
        'u_time', 'u_xDrift', 'u_yDrift', 'u_breathScale', 'u_zoom', 'u_resolution',
        'u_parallax', 'u_baseSize', 'u_colorPrimary', 'u_colorSelected', 'u_colorHalo'
    ]);

    // ─────────────────────────────────────────────────────────────
    // RUNG BUFFERS (DNA rungs connecting strands)
    // ─────────────────────────────────────────────────────────────

    const rungPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rungPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rungGeometry.positions, gl.STATIC_DRAW);

    const rungProgressBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rungProgressBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rungGeometry.progress, gl.STATIC_DRAW);

    const rungAttribs = getAttribLocations(gl, rungProgram, ['a_position', 'a_progress']);
    const rungUniforms = getUniformLocations(gl, rungProgram, [
        'u_time', 'u_xDrift', 'u_yDrift', 'u_breathScale', 'u_zoom',
        'u_resolution', 'u_parallax', 'u_rungColor', 'u_alpha'
    ]);

    // ─────────────────────────────────────────────────────────────
    // RENDER STATE
    // ─────────────────────────────────────────────────────────────

    const state = {
        selectedIndex: -1,
        hoveredIndex: -1,
        rafId: null,
        running: false
    };

    // ─────────────────────────────────────────────────────────────
    // RESIZE HANDLER
    // ─────────────────────────────────────────────────────────────

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();

    // ─────────────────────────────────────────────────────────────
    // UPDATE ANIMATION
    // ─────────────────────────────────────────────────────────────

    function updateAnimation(time) {
        // Smooth transitions
        animation.zoom += (animation.targetZoom - animation.zoom) * 0.08;
        animation.motionScale += (animation.targetMotionScale - animation.motionScale) * 0.05;

        // Smooth parallax interpolation
        animation.parallaxX += (animation.targetParallaxX - animation.parallaxX) * 0.1;
        animation.parallaxY += (animation.targetParallaxY - animation.parallaxY) * 0.1;

        // Soft drift
        animation.xDrift = Math.sin(time * animation.xDriftSpeed) * animation.xDriftAmplitude * animation.motionScale;
        animation.yDrift = Math.sin(time * animation.yDriftSpeed + 2.0) * animation.yDriftAmplitude * animation.motionScale;

        // Multi-frequency organic breathing (6-8 second cycle)
        let breathTotal = 0;
        animation.breathFrequencies.forEach((freq, i) => {
            breathTotal += Math.sin(time * freq + i * 0.5) * animation.breathWeights[i];
        });
        breathTotal /= 1.6;  // Normalize weights
        animation.breathScale = 1.0 + breathTotal * animation.breathAmplitude * animation.motionScale;

        // Depth shimmer modulation (slow wave)
        animation.depthShimmer = 0.5 + Math.sin(time * 0.3) * 0.5;

        // Traveling wave
        animation.waveOffset = time * animation.waveSpeed * animation.motionScale;

        animation.time = time;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function renderRungs() {
        gl.useProgram(rungProgram);

        gl.uniform1f(rungUniforms.u_time, animation.time);
        gl.uniform1f(rungUniforms.u_xDrift, animation.xDrift);
        gl.uniform1f(rungUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(rungUniforms.u_breathScale, animation.breathScale);
        gl.uniform1f(rungUniforms.u_zoom, animation.zoom);
        gl.uniform2f(rungUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform2f(rungUniforms.u_parallax, animation.parallaxX, animation.parallaxY);
        gl.uniform3fv(rungUniforms.u_rungColor, COLORS.rung);
        gl.uniform1f(rungUniforms.u_alpha, 0.4);

        bindVertexAttrib(gl, rungAttribs.a_position, rungPosBuffer, 3);
        bindVertexAttrib(gl, rungAttribs.a_progress, rungProgressBuffer, 1);

        gl.drawArrays(gl.LINES, 0, rungGeometry.vertexCount);

        disableVertexAttribs(gl, rungAttribs);
    }

    function renderHelix() {
        gl.useProgram(helixProgram);

        // Set common uniforms
        gl.uniform1f(helixUniforms.u_time, animation.time);
        gl.uniform1f(helixUniforms.u_xDrift, animation.xDrift);
        gl.uniform1f(helixUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(helixUniforms.u_breathScale, animation.breathScale);
        gl.uniform1f(helixUniforms.u_zoom, animation.zoom);
        gl.uniform2f(helixUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform2f(helixUniforms.u_parallax, animation.parallaxX, animation.parallaxY);
        gl.uniform3fv(helixUniforms.u_colorFront, COLORS.front);
        gl.uniform3fv(helixUniforms.u_colorBack, COLORS.back);
        gl.uniform1f(helixUniforms.u_waveOffset, animation.waveOffset);
        gl.uniform1f(helixUniforms.u_glowIntensity, 0.4);
        gl.uniform1f(helixUniforms.u_depthShimmer, animation.depthShimmer);

        bindVertexAttrib(gl, helixAttribs.a_position, helixPosBuffer, 3);
        bindVertexAttrib(gl, helixAttribs.a_progress, helixProgressBuffer, 1);
        bindVertexAttrib(gl, helixAttribs.a_strand, helixStrandBuffer, 1);

        const segmentsPerStrand = HELIX_CONFIG.segments + 1;

        // Multi-pass rendering for thick tube-like glow effect
        const passes = [
            { width: 6.0, alpha: 0.15, colorScale: 0.3 },   // Outer halo (deep blue)
            { width: 4.0, alpha: 0.35, colorScale: 0.6 },   // Mid glow
            { width: 2.5, alpha: 0.9, colorScale: 1.0 },    // Core (bright cyan)
        ];

        passes.forEach(pass => {
            gl.lineWidth(pass.width);
            gl.uniform1f(helixUniforms.u_alpha, pass.alpha);
            gl.uniform1f(helixUniforms.u_colorScale, pass.colorScale);

            // Draw both strands
            gl.drawArrays(gl.LINE_STRIP, 0, segmentsPerStrand);
            gl.drawArrays(gl.LINE_STRIP, segmentsPerStrand, segmentsPerStrand);
        });

        disableVertexAttribs(gl, helixAttribs);
    }

    function renderNodes() {
        gl.useProgram(nodeProgram);

        for (let i = 0; i < nodeCount; i++) {
            nodeSelectedData[i] = (i === state.selectedIndex) ? 1.0 : 0.0;
            nodeHoveredData[i] = (i === state.hoveredIndex) ? 1.0 : 0.0;
            nodeDimmedData[i] = (state.selectedIndex >= 0 && i !== state.selectedIndex) ? 1.0 : 0.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeSelectedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeSelectedData);

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeHoveredBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeHoveredData);

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeDimmedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeDimmedData);

        gl.uniform1f(nodeUniforms.u_time, animation.time);
        gl.uniform1f(nodeUniforms.u_xDrift, animation.xDrift);
        gl.uniform1f(nodeUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(nodeUniforms.u_breathScale, animation.breathScale);
        gl.uniform1f(nodeUniforms.u_zoom, animation.zoom);
        gl.uniform2f(nodeUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform2f(nodeUniforms.u_parallax, animation.parallaxX, animation.parallaxY);
        gl.uniform1f(nodeUniforms.u_baseSize, 1.3);  // 30% larger
        gl.uniform3fv(nodeUniforms.u_colorPrimary, COLORS.front);
        gl.uniform3fv(nodeUniforms.u_colorSelected, COLORS.selected);
        gl.uniform3fv(nodeUniforms.u_colorHalo, COLORS.halo);

        bindVertexAttrib(gl, nodeAttribs.a_position, nodePosBuffer, 3);
        bindVertexAttrib(gl, nodeAttribs.a_size, nodeSizeBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_selected, nodeSelectedBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_hovered, nodeHoveredBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_dimmed, nodeDimmedBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_index, nodeIndexBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_visited, nodeVisitedBuffer, 1);

        gl.drawArrays(gl.POINTS, 0, nodeCount);

        disableVertexAttribs(gl, nodeAttribs);
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN RENDER LOOP
    // ─────────────────────────────────────────────────────────────

    function render(timestamp) {
        if (!state.running) return;

        const time = timestamp * 0.001;

        updateAnimation(time);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Enable additive blending for glow
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // Render DNA rungs (behind strands)
        renderRungs();

        // Render helix strands
        renderHelix();

        // Render nodes
        renderNodes();

        state.rafId = requestAnimationFrame(render);
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────

    function handleMouseMove(e) {
        const hit = hitDetector.test(e.clientX, e.clientY);
        const newHoveredIndex = hit ? hit.index : -1;

        if (newHoveredIndex !== state.hoveredIndex) {
            state.hoveredIndex = newHoveredIndex;
            canvas.style.cursor = newHoveredIndex >= 0 ? 'pointer' : 'default';

            if (onHover) {
                // Pass full hover data including pixel coordinates for tooltip positioning
                onHover(hit ? {
                    key: hit.key,
                    label: hit.label,
                    screenX: hit.screenX,
                    screenY: hit.screenY,
                    index: hit.index
                } : null);
            }
        }
    }

    function handleClick(e) {
        const hit = hitDetector.test(e.clientX, e.clientY);

        if (hit && onClick) {
            // Pass full click data including pixel coordinates for anchored panel
            onClick({
                key: hit.key,
                screenX: hit.screenX,
                screenY: hit.screenY,
                index: hit.index
            });
        }
    }

    function handleMouseLeave() {
        state.hoveredIndex = -1;
        canvas.style.cursor = 'default';

        if (onHover) {
            onHover(null);
        }
    }

    function handleResize() {
        resize();
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    return {
        start() {
            state.running = true;
            state.rafId = requestAnimationFrame(render);
        },

        stop() {
            state.running = false;
            if (state.rafId) {
                cancelAnimationFrame(state.rafId);
                state.rafId = null;
            }
        },

        setSelectedIndex(index) {
            state.selectedIndex = index;

            if (index >= 0) {
                // V7.5: Slow motion by 60% (was 50%), zoom OUT 10%
                animation.targetMotionScale = 0.4;
                animation.targetZoom = 0.9;
            } else {
                // Deselection: restore full speed
                animation.targetMotionScale = 1.0;
                animation.targetZoom = 1.0;
            }
        },

        setParallax(normalizedX, normalizedY) {
            // V7.5: Increased parallax amplitude (+15%)
            animation.targetParallaxX = (normalizedX - 0.5) * 0.14;  // was 0.12
            animation.targetParallaxY = (normalizedY - 0.5) * 0.10;  // was 0.08
        },

        // V7.5: Update visited state for nodes
        setVisitedNodes(visitedSet) {
            for (let i = 0; i < nodeCount; i++) {
                const key = nodePositions[i].key;
                nodeVisitedData[i] = visitedSet.has(key) ? 1.0 : 0.0;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, nodeVisitedBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeVisitedData);
        },

        getNodePositions() {
            return nodePositions;
        },

        getNodeByKey(key) {
            return nodePositions.find(n => n.key === key);
        },

        destroy() {
            this.stop();

            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);

            // Delete buffers
            const buffers = [
                helixPosBuffer, helixProgressBuffer, helixStrandBuffer,
                nodePosBuffer, nodeSizeBuffer, nodeSelectedBuffer,
                nodeHoveredBuffer, nodeDimmedBuffer, nodeIndexBuffer,
                nodeVisitedBuffer,  // V7.5
                rungPosBuffer, rungProgressBuffer
            ];
            buffers.forEach(b => gl.deleteBuffer(b));

            // Delete programs
            [helixProgram, nodeProgram, rungProgram].forEach(program => {
                if (program) {
                    if (program.vertShader) {
                        gl.detachShader(program, program.vertShader);
                        gl.deleteShader(program.vertShader);
                    }
                    if (program.fragShader) {
                        gl.detachShader(program, program.fragShader);
                        gl.deleteShader(program.fragShader);
                    }
                    gl.deleteProgram(program);
                }
            });
        }
    };
}

// Export
window.HelixWebGL = {
    createRenderer: createHelixRenderer,
    NODE_KEYS: NODE_KEYS,
    NODE_LABELS: NODE_LABELS
};
