// ============================================================
// V7 NEURAL HELIX - WebGL Renderer
// Pseudo-3D shader-based helix with bloom, rotation, particles
// ============================================================

// ═══════════════════════════════════════════════════════════════
// GLSL SHADER SOURCES
// ═══════════════════════════════════════════════════════════════

const HELIX_VERT = `
attribute vec3 a_position;
attribute float a_progress;
attribute float a_strand;

uniform float u_rotation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_depthScale;

varying float v_depth;
varying float v_progress;
varying float v_strand;

void main() {
    // Y-axis rotation
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec3 rotated = vec3(
        a_position.x * c - a_position.z * s,
        a_position.y,
        a_position.x * s + a_position.z * c
    );

    // Pseudo-perspective (closer = larger)
    float perspective = 1.0 / (1.0 + rotated.z * u_depthScale);
    vec2 screen = rotated.xy * perspective;

    // Aspect ratio correction
    float aspect = u_resolution.x / u_resolution.y;
    screen.x /= aspect;

    // Z for depth buffer (normalized 0-1)
    float zNorm = (rotated.z + 1.0) * 0.5;

    gl_Position = vec4(screen, zNorm, 1.0);

    v_depth = rotated.z;
    v_progress = a_progress;
    v_strand = a_strand;
}
`;

const HELIX_FRAG = `
precision mediump float;

uniform vec3 u_colorFront;
uniform vec3 u_colorBack;
uniform float u_glowIntensity;
uniform float u_time;

varying float v_depth;
varying float v_progress;
varying float v_strand;

void main() {
    // Depth-based color mixing (front = bright cyan, back = darker blue)
    float depthFactor = smoothstep(-1.0, 1.0, v_depth);
    vec3 baseColor = mix(u_colorBack, u_colorFront, depthFactor);

    // Strand-based color offset (subtle variation between strands)
    baseColor = mix(baseColor, baseColor * vec3(0.9, 1.0, 1.1), v_strand * 0.15);

    // Vertical edge fade (smooth at top/bottom)
    float edgeFade = smoothstep(0.0, 0.06, v_progress) * smoothstep(1.0, 0.94, v_progress);

    // Subtle traveling pulse along helix
    float pulse = sin((v_progress * 20.0) - u_time * 2.0) * 0.5 + 0.5;
    float pulseGlow = pulse * 0.15;

    // Alpha based on depth (back strands more transparent)
    float alpha = mix(0.2, 0.75, depthFactor) * edgeFade;

    // Add glow
    vec3 finalColor = baseColor + baseColor * (u_glowIntensity + pulseGlow);

    gl_FragColor = vec4(finalColor, alpha);
}
`;

const NODE_VERT = `
attribute vec3 a_position;
attribute float a_size;
attribute float a_selected;
attribute float a_hovered;
attribute float a_index;

uniform float u_rotation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_depthScale;
uniform float u_baseSize;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_index;

void main() {
    // Y-axis rotation
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec3 rotated = vec3(
        a_position.x * c - a_position.z * s,
        a_position.y,
        a_position.x * s + a_position.z * c
    );

    // Pseudo-perspective
    float perspective = 1.0 / (1.0 + rotated.z * u_depthScale);
    vec2 screen = rotated.xy * perspective;

    // Aspect ratio correction
    float aspect = u_resolution.x / u_resolution.y;
    screen.x /= aspect;

    // Depth-based size scaling (closer = larger)
    float depthSize = mix(0.5, 1.3, (rotated.z + 1.0) * 0.5);
    float finalSize = u_baseSize * a_size * depthSize * perspective;

    // Selection/hover size boost
    if (a_selected > 0.5) {
        finalSize *= 1.4;
    } else if (a_hovered > 0.5) {
        finalSize *= 1.2;
    }

    gl_PointSize = finalSize * min(u_resolution.x, u_resolution.y) * 0.06;

    // Z for depth buffer
    float zNorm = (rotated.z + 1.0) * 0.5;
    gl_Position = vec4(screen, zNorm, 1.0);

    v_depth = rotated.z;
    v_selected = a_selected;
    v_hovered = a_hovered;
    v_index = a_index;
}
`;

const NODE_FRAG = `
precision mediump float;

uniform vec3 u_colorPrimary;
uniform vec3 u_colorSelected;
uniform float u_time;
uniform float u_selectedIndex;

varying float v_depth;
varying float v_selected;
varying float v_hovered;
varying float v_index;

void main() {
    // Create circular shape from gl_PointCoord (0-1 across point)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Soft circular falloff
    float circle = 1.0 - smoothstep(0.35, 0.5, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);

    if (circle < 0.01) discard;

    // Depth-based brightness
    float depthFactor = smoothstep(-1.0, 1.0, v_depth);
    vec3 baseColor = u_colorPrimary * mix(0.35, 1.0, depthFactor);

    // Dim non-selected nodes when something is selected
    if (u_selectedIndex >= 0.0 && v_selected < 0.5) {
        baseColor *= 0.25;
        glow *= 0.3;
    }

    // Selection state: bright + pulsing glow
    if (v_selected > 0.5) {
        float pulse = 0.5 + 0.5 * sin(u_time * 4.0);
        baseColor = u_colorSelected;
        glow *= (1.8 + 0.4 * pulse);
    } else if (v_hovered > 0.5) {
        baseColor *= 1.4;
        glow *= 1.5;
    }

    // Final alpha with depth
    float alpha = circle * mix(0.4, 1.0, depthFactor);

    // Add glow halo (additive)
    vec3 finalColor = baseColor + baseColor * glow * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

const PARTICLE_VERT = `
attribute vec3 a_position;
attribute float a_size;
attribute float a_alpha;

uniform float u_rotation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_depthScale;

varying float v_alpha;
varying float v_depth;

void main() {
    // Y-axis rotation (same as helix)
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec3 rotated = vec3(
        a_position.x * c - a_position.z * s,
        a_position.y,
        a_position.x * s + a_position.z * c
    );

    float perspective = 1.0 / (1.0 + rotated.z * u_depthScale);
    vec2 screen = rotated.xy * perspective;

    float aspect = u_resolution.x / u_resolution.y;
    screen.x /= aspect;

    gl_PointSize = a_size * perspective * min(u_resolution.x, u_resolution.y) * 0.008;

    float zNorm = (rotated.z + 1.0) * 0.5;
    gl_Position = vec4(screen, zNorm, 1.0);

    v_alpha = a_alpha;
    v_depth = rotated.z;
}
`;

const PARTICLE_FRAG = `
precision mediump float;

uniform vec3 u_color;
uniform float u_time;

varying float v_alpha;
varying float v_depth;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    float circle = 1.0 - smoothstep(0.3, 0.5, dist);
    if (circle < 0.01) discard;

    float depthFactor = smoothstep(-1.0, 1.0, v_depth);
    float alpha = v_alpha * circle * mix(0.3, 1.0, depthFactor);

    gl_FragColor = vec4(u_color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════
// GEOMETRY GENERATION
// ═══════════════════════════════════════════════════════════════

const HELIX_CONFIG = {
    height: 2.0,
    radius: 0.32,
    frequency: 3,
    segments: 180
};

const NODE_CONFIG = [
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

function generateHelixGeometry(config = HELIX_CONFIG) {
    const { height, radius, frequency, segments } = config;
    const positions = [];
    const progress = [];
    const strands = [];

    for (let strand = 0; strand < 2; strand++) {
        const phase = strand * Math.PI;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = (t - 0.5) * height;
            const angle = t * frequency * Math.PI * 2 + phase;

            positions.push(
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
            );
            progress.push(t);
            strands.push(strand);
        }
    }

    return {
        positions: new Float32Array(positions),
        progress: new Float32Array(progress),
        strands: new Float32Array(strands),
        vertexCount: (segments + 1) * 2
    };
}

function calculateNodePositions(config = HELIX_CONFIG) {
    const { height, radius, frequency } = config;

    return NODE_CONFIG.map((node, i) => {
        const t = node.yPercent / 100;
        const y = (t - 0.5) * height;
        // Alternate nodes between strands for better distribution
        const strandPhase = (i % 2) * Math.PI;
        const angle = t * frequency * Math.PI * 2 + strandPhase;

        return {
            ...node,
            x: Math.cos(angle) * radius,
            y: y,
            z: Math.sin(angle) * radius,
            index: i
        };
    });
}

function generateParticles(count = 25) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: (Math.random() - 0.5) * 1.4,
            y: (Math.random() - 0.5) * 2.2,
            z: (Math.random() - 0.5) * 0.7,
            vx: (Math.random() - 0.5) * 0.0008,
            vy: (Math.random() - 0.5) * 0.0004,
            size: 1.5 + Math.random() * 2.5,
            alpha: 0.06 + Math.random() * 0.1,
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
        // Log first few lines of source for debugging
        const lines = source.split('\n').slice(0, 10).join('\n');
        console.error('Shader source (first 10 lines):', lines);
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

    // Store shader refs for cleanup
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
        const loc = gl.getAttribLocation(program, name);
        locations[name] = loc;
        if (loc === -1) {
            console.warn(`Attribute '${name}' not found in shader program (may be optimized out)`);
        }
    });
    return locations;
}

// Helper to safely enable and bind vertex attribute
function bindVertexAttrib(gl, location, buffer, size, type = gl.FLOAT) {
    if (location === -1) return; // Skip if attribute was optimized out
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, type, false, 0, 0);
}

// Helper to disable all used attributes to prevent state leakage
function disableVertexAttribs(gl, attribs) {
    Object.values(attribs).forEach(loc => {
        if (loc !== -1) gl.disableVertexAttribArray(loc);
    });
}

// ═══════════════════════════════════════════════════════════════
// HIT DETECTION
// ═══════════════════════════════════════════════════════════════

function createHitDetector(canvas, nodes, depthScale) {
    return {
        test(clientX, clientY, rotation) {
            const rect = canvas.getBoundingClientRect();
            const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
            const aspect = rect.width / rect.height;

            let closest = null;
            let minDist = 0.12; // Hit radius in NDC

            for (const node of nodes) {
                // Apply same rotation as shader
                const c = Math.cos(rotation);
                const s = Math.sin(rotation);
                const rx = node.x * c - node.z * s;
                const rz = node.x * s + node.z * c;

                // Pseudo-perspective (must match shader)
                const p = 1 / (1 + rz * depthScale);
                const sx = (rx * p) / aspect;
                const sy = node.y * p;

                const dist = Math.hypot(ndcX - sx, ndcY - sy);

                // Larger hit area for front nodes
                const adjustedRadius = minDist * p;

                if (dist < adjustedRadius) {
                    // Prefer front nodes (higher z after rotation = closer)
                    if (!closest || rz > closest.rz) {
                        closest = { ...node, rz, dist };
                    }
                }
            }
            return closest;
        }
    };
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
    primary: hexToGL('#00D9FF'),
    secondary: hexToGL('#0066FF'),
    selected: hexToGL('#00FFFF'),
    particle: hexToGL('#00D9FF')
};

// ═══════════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════════

function createHelixRenderer(canvas, callbacks = {}) {
    const { onHover, onClick } = callbacks;

    // Get WebGL context
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

    // Create hit detector
    const depthScale = 0.25;
    const hitDetector = createHitDetector(canvas, nodePositions, depthScale);

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
        'u_rotation', 'u_time', 'u_resolution', 'u_depthScale',
        'u_colorFront', 'u_colorBack', 'u_glowIntensity'
    ]);

    // ─────────────────────────────────────────────────────────────
    // NODE BUFFERS
    // ─────────────────────────────────────────────────────────────

    const nodeCount = nodePositions.length;
    const nodePosData = new Float32Array(nodeCount * 3);
    const nodeSizeData = new Float32Array(nodeCount);
    const nodeSelectedData = new Float32Array(nodeCount);
    const nodeHoveredData = new Float32Array(nodeCount);
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

    const nodeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeIndexData, gl.STATIC_DRAW);

    const nodeAttribs = getAttribLocations(gl, nodeProgram, [
        'a_position', 'a_size', 'a_selected', 'a_hovered', 'a_index'
    ]);
    const nodeUniforms = getUniformLocations(gl, nodeProgram, [
        'u_rotation', 'u_time', 'u_resolution', 'u_depthScale', 'u_baseSize',
        'u_colorPrimary', 'u_colorSelected', 'u_selectedIndex'
    ]);

    // ─────────────────────────────────────────────────────────────
    // PARTICLE BUFFERS
    // ─────────────────────────────────────────────────────────────

    const particleCount = particles.length;
    const particlePosData = new Float32Array(particleCount * 3);
    const particleSizeData = new Float32Array(particleCount);
    const particleAlphaData = new Float32Array(particleCount);

    const particlePosBuffer = gl.createBuffer();
    const particleSizeBuffer = gl.createBuffer();
    const particleAlphaBuffer = gl.createBuffer();

    const particleAttribs = getAttribLocations(gl, particleProgram, ['a_position', 'a_size', 'a_alpha']);
    const particleUniforms = getUniformLocations(gl, particleProgram, [
        'u_rotation', 'u_time', 'u_resolution', 'u_depthScale', 'u_color'
    ]);

    // ─────────────────────────────────────────────────────────────
    // ANIMATION STATE
    // ─────────────────────────────────────────────────────────────

    const state = {
        rotation: 0,
        rotationSpeed: 0.005,
        targetRotationSpeed: 0.005,
        time: 0,
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
    // UPDATE PARTICLES
    // ─────────────────────────────────────────────────────────────

    function updateParticles(dt) {
        const selectedNode = state.selectedIndex >= 0 ? nodePositions[state.selectedIndex] : null;

        particles.forEach((p, i) => {
            // Gentle attraction toward selected node
            if (selectedNode) {
                p.vx += (selectedNode.x - p.x) * 0.00003;
                p.vy += (selectedNode.y - p.y) * 0.00002;
            }

            // Organic drift
            p.x += p.vx + Math.sin(state.time * 0.5 + p.phase + p.y * 2) * 0.0002;
            p.y += p.vy + Math.cos(state.time * 0.3 + p.phase) * 0.00015;
            p.z += Math.sin(state.time * 0.4 + p.phase * 2) * 0.0001;

            // Damping
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Wrap around bounds
            if (p.y > 1.1) p.y = -1.1;
            if (p.y < -1.1) p.y = 1.1;
            if (Math.abs(p.x) > 0.8) p.x *= 0.95;
            if (Math.abs(p.z) > 0.5) p.z *= 0.95;

            // Update buffer data
            particlePosData[i * 3] = p.x;
            particlePosData[i * 3 + 1] = p.y;
            particlePosData[i * 3 + 2] = p.z;
            particleSizeData[i] = p.size;
            particleAlphaData[i] = p.alpha;
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, particlePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particlePosData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleSizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleSizeData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleAlphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleAlphaData, gl.DYNAMIC_DRAW);
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function renderHelix() {
        gl.useProgram(helixProgram);

        // Set uniforms
        gl.uniform1f(helixUniforms.u_rotation, state.rotation);
        gl.uniform1f(helixUniforms.u_time, state.time);
        gl.uniform2f(helixUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(helixUniforms.u_depthScale, depthScale);
        gl.uniform3fv(helixUniforms.u_colorFront, COLORS.primary);
        gl.uniform3fv(helixUniforms.u_colorBack, COLORS.secondary);
        gl.uniform1f(helixUniforms.u_glowIntensity, 0.2);

        // Bind vertex attributes safely
        bindVertexAttrib(gl, helixAttribs.a_position, helixPosBuffer, 3);
        bindVertexAttrib(gl, helixAttribs.a_progress, helixProgressBuffer, 1);
        bindVertexAttrib(gl, helixAttribs.a_strand, helixStrandBuffer, 1);

        // Draw both strands as line strips
        const segmentsPerStrand = HELIX_CONFIG.segments + 1;
        gl.drawArrays(gl.LINE_STRIP, 0, segmentsPerStrand);
        gl.drawArrays(gl.LINE_STRIP, segmentsPerStrand, segmentsPerStrand);

        // Disable attributes to prevent state leakage
        disableVertexAttribs(gl, helixAttribs);
    }

    function renderNodes() {
        gl.useProgram(nodeProgram);

        // Update selection/hover state in buffers
        for (let i = 0; i < nodeCount; i++) {
            nodeSelectedData[i] = (i === state.selectedIndex) ? 1.0 : 0.0;
            nodeHoveredData[i] = (i === state.hoveredIndex) ? 1.0 : 0.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeSelectedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeSelectedData);

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeHoveredBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeHoveredData);

        // Set uniforms
        gl.uniform1f(nodeUniforms.u_rotation, state.rotation);
        gl.uniform1f(nodeUniforms.u_time, state.time);
        gl.uniform2f(nodeUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(nodeUniforms.u_depthScale, depthScale);
        gl.uniform1f(nodeUniforms.u_baseSize, 1.0);
        gl.uniform3fv(nodeUniforms.u_colorPrimary, COLORS.primary);
        gl.uniform3fv(nodeUniforms.u_colorSelected, COLORS.selected);
        gl.uniform1f(nodeUniforms.u_selectedIndex, state.selectedIndex);

        // Bind vertex attributes safely
        bindVertexAttrib(gl, nodeAttribs.a_position, nodePosBuffer, 3);
        bindVertexAttrib(gl, nodeAttribs.a_size, nodeSizeBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_selected, nodeSelectedBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_hovered, nodeHoveredBuffer, 1);
        bindVertexAttrib(gl, nodeAttribs.a_index, nodeIndexBuffer, 1);

        gl.drawArrays(gl.POINTS, 0, nodeCount);

        // Disable attributes to prevent state leakage
        disableVertexAttribs(gl, nodeAttribs);
    }

    function renderParticles() {
        gl.useProgram(particleProgram);

        gl.uniform1f(particleUniforms.u_rotation, state.rotation);
        gl.uniform1f(particleUniforms.u_time, state.time);
        gl.uniform2f(particleUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(particleUniforms.u_depthScale, depthScale);
        gl.uniform3fv(particleUniforms.u_color, COLORS.particle);

        // Bind vertex attributes safely
        bindVertexAttrib(gl, particleAttribs.a_position, particlePosBuffer, 3);
        bindVertexAttrib(gl, particleAttribs.a_size, particleSizeBuffer, 1);
        bindVertexAttrib(gl, particleAttribs.a_alpha, particleAlphaBuffer, 1);

        gl.drawArrays(gl.POINTS, 0, particleCount);

        // Disable attributes to prevent state leakage
        disableVertexAttribs(gl, particleAttribs);
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN RENDER LOOP
    // ─────────────────────────────────────────────────────────────

    let lastTime = 0;

    function render(timestamp) {
        if (!state.running) return;

        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        // Smooth rotation speed transition
        state.rotationSpeed += (state.targetRotationSpeed - state.rotationSpeed) * 0.05;
        state.rotation += state.rotationSpeed;
        state.time = timestamp * 0.001;

        // Update particles
        updateParticles(dt);

        // Clear with transparent background
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Enable depth testing for correct ordering
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Render layers
        renderParticles();
        renderHelix();
        renderNodes();

        state.rafId = requestAnimationFrame(render);
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────

    function handleMouseMove(e) {
        const hit = hitDetector.test(e.clientX, e.clientY, state.rotation);
        const newHoveredIndex = hit ? hit.index : -1;

        if (newHoveredIndex !== state.hoveredIndex) {
            state.hoveredIndex = newHoveredIndex;

            // Slow rotation on hover
            state.targetRotationSpeed = newHoveredIndex >= 0 ? 0.001 :
                                        state.selectedIndex >= 0 ? 0.002 : 0.005;

            canvas.style.cursor = newHoveredIndex >= 0 ? 'pointer' : 'default';

            if (onHover) {
                onHover(newHoveredIndex >= 0 ? nodePositions[newHoveredIndex].key : null);
            }
        }
    }

    function handleClick(e) {
        const hit = hitDetector.test(e.clientX, e.clientY, state.rotation);

        if (hit && onClick) {
            onClick(nodePositions[hit.index].key);
        }
    }

    function handleMouseLeave() {
        state.hoveredIndex = -1;
        state.targetRotationSpeed = state.selectedIndex >= 0 ? 0.002 : 0.005;
        canvas.style.cursor = 'default';

        if (onHover) {
            onHover(null);
        }
    }

    function handleResize() {
        resize();
    }

    // Attach event listeners
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
            lastTime = performance.now();
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
            state.targetRotationSpeed = index >= 0 ? 0.002 : 0.005;
        },

        getNodePositions() {
            return nodePositions;
        },

        getNodeByKey(key) {
            return nodePositions.find(n => n.key === key);
        },

        destroy() {
            this.stop();

            // Remove event listeners
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);

            // Delete buffers
            gl.deleteBuffer(helixPosBuffer);
            gl.deleteBuffer(helixProgressBuffer);
            gl.deleteBuffer(helixStrandBuffer);
            gl.deleteBuffer(nodePosBuffer);
            gl.deleteBuffer(nodeSizeBuffer);
            gl.deleteBuffer(nodeSelectedBuffer);
            gl.deleteBuffer(nodeHoveredBuffer);
            gl.deleteBuffer(nodeIndexBuffer);
            gl.deleteBuffer(particlePosBuffer);
            gl.deleteBuffer(particleSizeBuffer);
            gl.deleteBuffer(particleAlphaBuffer);

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

            // Note: We intentionally do NOT call loseContext() here
            // as it permanently destroys the context and prevents reuse
        }
    };
}

// Export for global access (UMD pattern)
window.HelixWebGL = {
    createRenderer: createHelixRenderer,
    NODE_CONFIG: NODE_CONFIG
};
