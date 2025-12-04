// ============================================================
// V7 NEURAL HELIX - WebGL Renderer
// Fullscreen Cinematic Mode - Diagonal DNA double helix
// Soft drift + breathing + particles + bright glow
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const HELIX_CONFIG = {
    horizontalStretch: 1.3,
    amplitude: 0.28,
    frequency: 4.5,
    segments: 200,
    nodeCount: 11,
    // Diagonal offset (top-left to bottom-right flow)
    diagonalOffsetX: -0.3,
    diagonalOffsetY: 0.2,
    diagonalSlopeX: 0.6,
    diagonalSlopeY: -0.4
};

const NODE_KEYS = [
    'sound_description',
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
    'Sound Description',
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
    const baseY = HELIX_CONFIG.amplitude * Math.sin(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI);
    const baseZ = HELIX_CONFIG.amplitude * Math.cos(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI);

    return {
        x: baseX + HELIX_CONFIG.diagonalOffsetX + t * HELIX_CONFIG.diagonalSlopeX,
        y: baseY + HELIX_CONFIG.diagonalOffsetY + t * HELIX_CONFIG.diagonalSlopeY,
        z: baseZ
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

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    vec3 pos = a_position;

    // Apply drift animation
    pos.x += u_xDrift;
    pos.y += u_yDrift;

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

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    // Depth-based color (front cyan, back blue)
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);
    vec3 baseColor = mix(u_colorBack, u_colorFront, depthFactor);

    // Traveling luminous wave (brighter)
    float wave = sin((v_progress * 30.0) - u_waveOffset) * 0.5 + 0.5;
    float waveGlow = wave * 0.4;

    // Core glow (bright light tube effect)
    float coreGlow = 1.2;

    // Final color with bloom
    vec3 glowColor = baseColor * (1.0 + coreGlow + waveGlow);

    // Edge fade at helix ends
    float edgeFade = smoothstep(0.0, 0.05, v_progress) * smoothstep(1.0, 0.95, v_progress);

    float alpha = (0.8 + depthFactor * 0.2) * edgeFade;

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

uniform float u_time;
uniform float u_xDrift;
uniform float u_yDrift;
uniform float u_breathScale;
uniform float u_zoom;
uniform vec2 u_resolution;
uniform float u_baseSize;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_dimmed;
varying float v_index;

void main() {
    vec3 pos = a_position;

    // Apply drift animation
    pos.x += u_xDrift;
    pos.y += u_yDrift;

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

    // Node breathing effect (subtle pulsation)
    float nodePulse = 1.0 + sin(u_time * 2.0 + a_index * 0.5) * 0.05;
    finalSize *= nodePulse;

    // Selection/hover size boost
    if (a_selected > 0.5) {
        finalSize *= 1.5;
    } else if (a_hovered > 0.5) {
        finalSize *= 1.3;
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
}
`;

const NODE_FRAG = `
precision highp float;

uniform vec3 u_colorPrimary;
uniform vec3 u_colorSelected;
uniform float u_time;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_dimmed;
varying float v_index;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Core sphere
    float core = 1.0 - smoothstep(0.0, 0.25, dist);

    // Larger soft outer halo
    float halo = 1.0 - smoothstep(0.12, 0.5, dist);
    halo *= 0.6;

    if (core + halo < 0.01) discard;

    // Depth-based brightness
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);
    vec3 baseColor = u_colorPrimary * mix(0.5, 1.0, depthFactor);

    // Selection state
    if (v_selected > 0.5) {
        float pulse = sin(u_time * 4.0) * 0.3 + 0.7;
        baseColor = u_colorSelected * pulse;
        core *= 1.8;
        halo *= 2.5;
    } else if (v_hovered > 0.5) {
        baseColor *= 1.4;
        core *= 1.3;
        halo *= 1.5;
    }

    // Dimming when another node selected
    float dim = v_dimmed > 0.5 ? 0.4 : 1.0;

    vec3 color = baseColor * (core + halo) * dim;
    float alpha = (core + halo * 0.5) * dim * mix(0.6, 1.0, depthFactor);

    gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════
// PARTICLE SHADERS
// ═══════════════════════════════════════════════════════════════

const PARTICLE_VERT = `
attribute vec3 a_position;
attribute float a_size;
attribute float a_alpha;
attribute float a_phase;

uniform float u_time;
uniform float u_xDrift;
uniform float u_yDrift;
uniform vec2 u_resolution;

varying float v_alpha;

void main() {
    vec3 pos = a_position;

    // Follow helix drift at half rate
    pos.x += u_xDrift * 0.5;
    pos.y += u_yDrift * 0.5;

    // Subtle particle drift
    pos.x += sin(u_time * 0.3 + a_phase) * 0.02;
    pos.y += sin(u_time * 0.2 + a_phase * 1.5) * 0.02;

    float perspective = 1.0 / (1.0 + pos.z * 0.3);
    float aspect = u_resolution.x / u_resolution.y;

    gl_PointSize = a_size * perspective * min(u_resolution.x, u_resolution.y) * 0.008;
    gl_Position = vec4(
        pos.x * perspective / aspect,
        pos.y * perspective,
        pos.z * 0.5,
        1.0
    );

    // Twinkle effect
    float twinkle = 0.7 + sin(u_time * 2.0 + a_phase * 3.0) * 0.3;
    v_alpha = a_alpha * twinkle;
}
`;

const PARTICLE_FRAG = `
precision highp float;

varying float v_alpha;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    float circle = 1.0 - smoothstep(0.3, 0.5, dist);
    if (circle < 0.01) discard;
    gl_FragColor = vec4(0.0, 0.85, 1.0, v_alpha * circle);
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
    for (let i = 0; i < 11; i++) {
        const t = i / 10;
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

function generateParticles(count = 25) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: (Math.random() - 0.5) * 2.5,
            y: (Math.random() - 0.5) * 2.0,
            z: (Math.random() - 0.5) * 0.8,
            size: 1.5 + Math.random() * 3.0,
            alpha: 0.08 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2
        });
    }
    return particles;
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
    front: hexToGL('#00D9FF'),
    back: hexToGL('#002C55'),
    selected: hexToGL('#00FFFF')
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
            const hitRadius = 0.08;

            for (const node of nodes) {
                let x = node.x + animation.xDrift;
                let y = node.y + animation.yDrift;
                let z = node.z;

                x *= animation.breathScale * animation.zoom;
                y *= animation.breathScale * animation.zoom;
                z *= animation.breathScale * animation.zoom;

                const p = 1.0 / (1.0 + z * 0.3);
                const screenX = (x * p) / aspect;
                const screenY = y * p;

                const dist = Math.hypot(ndcX - screenX, ndcY - screenY);
                const adjustedRadius = hitRadius * p;

                if (dist < adjustedRadius && dist < minDist) {
                    minDist = dist;
                    closest = { ...node, screenX, screenY, dist };
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
    const particleProgram = createProgram(gl, PARTICLE_VERT, PARTICLE_FRAG);

    if (!helixProgram || !nodeProgram || !particleProgram) {
        console.error('Failed to create shader programs');
        return null;
    }

    // Generate geometry
    const helixGeometry = generateHelixGeometry();
    const nodePositions = calculateNodePositions();
    const particles = generateParticles(25);

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

        // Breathing scale
        breathScale: 1.0,
        breathSpeed: 0.1,
        breathAmplitude: 0.015,

        // Traveling wave
        waveOffset: 0,
        waveSpeed: 3.0,

        // Selection state
        zoom: 1.0,
        targetZoom: 1.0,
        motionScale: 1.0,
        targetMotionScale: 1.0,

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
        'u_colorFront', 'u_colorBack', 'u_waveOffset', 'u_glowIntensity'
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

    const nodeAttribs = getAttribLocations(gl, nodeProgram, [
        'a_position', 'a_size', 'a_selected', 'a_hovered', 'a_dimmed', 'a_index'
    ]);
    const nodeUniforms = getUniformLocations(gl, nodeProgram, [
        'u_time', 'u_xDrift', 'u_yDrift', 'u_breathScale', 'u_zoom', 'u_resolution', 'u_baseSize',
        'u_colorPrimary', 'u_colorSelected'
    ]);

    // ─────────────────────────────────────────────────────────────
    // PARTICLE BUFFERS
    // ─────────────────────────────────────────────────────────────

    const particleCount = particles.length;
    const particlePosData = new Float32Array(particleCount * 3);
    const particleSizeData = new Float32Array(particleCount);
    const particleAlphaData = new Float32Array(particleCount);
    const particlePhaseData = new Float32Array(particleCount);

    particles.forEach((p, i) => {
        particlePosData[i * 3] = p.x;
        particlePosData[i * 3 + 1] = p.y;
        particlePosData[i * 3 + 2] = p.z;
        particleSizeData[i] = p.size;
        particleAlphaData[i] = p.alpha;
        particlePhaseData[i] = p.phase;
    });

    const particlePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particlePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particlePosData, gl.STATIC_DRAW);

    const particleSizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSizeData, gl.STATIC_DRAW);

    const particleAlphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleAlphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleAlphaData, gl.STATIC_DRAW);

    const particlePhaseBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particlePhaseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particlePhaseData, gl.STATIC_DRAW);

    const particleAttribs = getAttribLocations(gl, particleProgram, [
        'a_position', 'a_size', 'a_alpha', 'a_phase'
    ]);
    const particleUniforms = getUniformLocations(gl, particleProgram, [
        'u_time', 'u_xDrift', 'u_yDrift', 'u_resolution'
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

        // Soft drift
        animation.xDrift = Math.sin(time * animation.xDriftSpeed) * animation.xDriftAmplitude * animation.motionScale;
        animation.yDrift = Math.sin(time * animation.yDriftSpeed + 2.0) * animation.yDriftAmplitude * animation.motionScale;

        // Breathing scale
        animation.breathScale = 1.0 + Math.sin(time * animation.breathSpeed) * animation.breathAmplitude * animation.motionScale;

        // Traveling wave
        animation.waveOffset = time * animation.waveSpeed * animation.motionScale;

        animation.time = time;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function renderParticles() {
        gl.useProgram(particleProgram);

        gl.uniform1f(particleUniforms.u_time, animation.time);
        gl.uniform1f(particleUniforms.u_xDrift, animation.xDrift);
        gl.uniform1f(particleUniforms.u_yDrift, animation.yDrift);
        gl.uniform2f(particleUniforms.u_resolution, canvas.width, canvas.height);

        bindVertexAttrib(gl, particleAttribs.a_position, particlePosBuffer, 3);
        bindVertexAttrib(gl, particleAttribs.a_size, particleSizeBuffer, 1);
        bindVertexAttrib(gl, particleAttribs.a_alpha, particleAlphaBuffer, 1);
        bindVertexAttrib(gl, particleAttribs.a_phase, particlePhaseBuffer, 1);

        gl.drawArrays(gl.POINTS, 0, particleCount);

        disableVertexAttribs(gl, particleAttribs);
    }

    function renderHelix() {
        gl.useProgram(helixProgram);

        gl.uniform1f(helixUniforms.u_time, animation.time);
        gl.uniform1f(helixUniforms.u_xDrift, animation.xDrift);
        gl.uniform1f(helixUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(helixUniforms.u_breathScale, animation.breathScale);
        gl.uniform1f(helixUniforms.u_zoom, animation.zoom);
        gl.uniform2f(helixUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform3fv(helixUniforms.u_colorFront, COLORS.front);
        gl.uniform3fv(helixUniforms.u_colorBack, COLORS.back);
        gl.uniform1f(helixUniforms.u_waveOffset, animation.waveOffset);
        gl.uniform1f(helixUniforms.u_glowIntensity, 0.4);

        bindVertexAttrib(gl, helixAttribs.a_position, helixPosBuffer, 3);
        bindVertexAttrib(gl, helixAttribs.a_progress, helixProgressBuffer, 1);
        bindVertexAttrib(gl, helixAttribs.a_strand, helixStrandBuffer, 1);

        const segmentsPerStrand = HELIX_CONFIG.segments + 1;
        gl.lineWidth(2.0);
        gl.drawArrays(gl.LINE_STRIP, 0, segmentsPerStrand);
        gl.drawArrays(gl.LINE_STRIP, segmentsPerStrand, segmentsPerStrand);

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
        gl.uniform1f(nodeUniforms.u_baseSize, 1.3);  // 30% larger
        gl.uniform3fv(nodeUniforms.u_colorPrimary, COLORS.front);
        gl.uniform3fv(nodeUniforms.u_colorSelected, COLORS.selected);

        bindVertexAttrib(gl, nodeAttribs.a_position, nodePosBuffer, 3);
        bindVertexAttrib(gl, nodeAttribs.a_size, nodeSizeBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_selected, nodeSelectedBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_hovered, nodeHoveredBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_dimmed, nodeDimmedBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_index, nodeIndexBuffer, 1);

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

        // Render particles (background)
        renderParticles();

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
                onHover(newHoveredIndex >= 0 ? nodePositions[newHoveredIndex].key : null);
            }
        }
    }

    function handleClick(e) {
        const hit = hitDetector.test(e.clientX, e.clientY);

        if (hit && onClick) {
            onClick(nodePositions[hit.index].key);
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
                // Selection: slow motion by 50%, zoom 5%
                animation.targetMotionScale = 0.5;
                animation.targetZoom = 1.05;
            } else {
                // Deselection: restore full speed
                animation.targetMotionScale = 1.0;
                animation.targetZoom = 1.0;
            }
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
                particlePosBuffer, particleSizeBuffer, particleAlphaBuffer, particlePhaseBuffer
            ];
            buffers.forEach(b => gl.deleteBuffer(b));

            // Delete programs
            [helixProgram, nodeProgram, particleProgram].forEach(program => {
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
