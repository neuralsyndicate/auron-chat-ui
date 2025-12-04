// ============================================================
// V7 NEURAL HELIX - WebGL Renderer
// Horizontal DNA double helix with Apple VisionOS + AC Animus aesthetic
// NO rotation - soft breathing oscillation only
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const HELIX_CONFIG = {
    horizontalStretch: 1.3,    // ~65% viewport mapped to NDC
    amplitude: 0.28,           // Subtle Y/Z amplitude (0.25-0.35 range)
    frequency: 4.5,            // 4-5 complete twists
    segments: 200,             // Smooth curve
    nodeCount: 11
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
// PARAMETRIC HELIX FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function strandA(t) {
    return {
        x: (t - 0.5) * HELIX_CONFIG.horizontalStretch,
        y: HELIX_CONFIG.amplitude * Math.sin(t * HELIX_CONFIG.frequency * Math.PI * 2),
        z: HELIX_CONFIG.amplitude * Math.cos(t * HELIX_CONFIG.frequency * Math.PI * 2)
    };
}

function strandB(t) {
    // Phase shift by π for second strand
    return {
        x: (t - 0.5) * HELIX_CONFIG.horizontalStretch,
        y: HELIX_CONFIG.amplitude * Math.sin(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI),
        z: HELIX_CONFIG.amplitude * Math.cos(t * HELIX_CONFIG.frequency * Math.PI * 2 + Math.PI)
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
uniform float u_yDrift;
uniform float u_zDrift;
uniform float u_zoom;
uniform vec2 u_resolution;

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    vec3 pos = a_position;

    // Apply breathing drift
    pos.y += u_yDrift;
    pos.z += u_zDrift;

    // Apply zoom
    pos *= u_zoom;

    // Simple perspective (front brighter, back darker)
    float perspective = 1.0 / (1.0 + pos.z * 0.3);

    // Aspect ratio correction
    float aspect = u_resolution.x / u_resolution.y;

    gl_Position = vec4(pos.x * perspective / aspect, pos.y * perspective, pos.z * 0.5, 1.0);

    v_progress = a_progress;
    v_depth = pos.z;
    v_strand = a_strand;
}
`;

const HELIX_FRAG = `
precision highp float;

uniform vec3 u_colorFront;   // #00D9FF cyan
uniform vec3 u_colorBack;    // #002C55 deep blue
uniform float u_time;
uniform float u_glowIntensity;

varying float v_progress;
varying float v_depth;
varying float v_strand;

void main() {
    // Depth-based color (front cyan, back blue)
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);
    vec3 baseColor = mix(u_colorBack, u_colorFront, depthFactor);

    // Traveling energy pulse
    float pulse = sin((v_progress * 30.0) - u_time * 3.0) * 0.5 + 0.5;
    float pulseGlow = pulse * 0.25;

    // Core glow (light tube effect)
    float coreGlow = 0.8;

    // Final color with bloom-like glow
    vec3 glowColor = baseColor * (1.0 + coreGlow + pulseGlow);

    // Edge fade at helix ends
    float edgeFade = smoothstep(0.0, 0.05, v_progress) * smoothstep(1.0, 0.95, v_progress);

    float alpha = (0.7 + depthFactor * 0.3) * edgeFade;

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
uniform float u_yDrift;
uniform float u_zDrift;
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

    // Apply breathing drift
    pos.y += u_yDrift;
    pos.z += u_zDrift;

    // Apply zoom
    pos *= u_zoom;

    // Simple perspective
    float perspective = 1.0 / (1.0 + pos.z * 0.3);

    // Aspect ratio correction
    float aspect = u_resolution.x / u_resolution.y;

    // Depth-based size scaling (closer = larger)
    float depthSize = mix(0.6, 1.4, (pos.z + 0.3) / 0.6);
    float finalSize = u_baseSize * a_size * depthSize * perspective;

    // Selection/hover size boost
    if (a_selected > 0.5) {
        finalSize *= 1.5;
    } else if (a_hovered > 0.5) {
        finalSize *= 1.3;
    }

    gl_PointSize = finalSize * min(u_resolution.x, u_resolution.y) * 0.05;

    gl_Position = vec4(pos.x * perspective / aspect, pos.y * perspective, pos.z * 0.5, 1.0);

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
    // Create circular shape from gl_PointCoord (0-1 across point)
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Core sphere
    float core = 1.0 - smoothstep(0.0, 0.25, dist);

    // Soft outer halo
    float halo = 1.0 - smoothstep(0.15, 0.5, dist);
    halo *= 0.4;

    if (core + halo < 0.01) discard;

    // Depth-based brightness
    float depthFactor = smoothstep(-0.3, 0.3, v_depth);
    vec3 baseColor = u_colorPrimary * mix(0.5, 1.0, depthFactor);

    // Selection state
    float pulse = 0.0;
    if (v_selected > 0.5) {
        pulse = sin(u_time * 4.0) * 0.3 + 0.7;
        baseColor = u_colorSelected;
        core *= 1.5;
        halo *= 2.0;
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
        const t = i / 10;  // 0, 0.1, 0.2, ... 1.0
        // Alternate nodes between strands
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
        const loc = gl.getAttribLocation(program, name);
        locations[name] = loc;
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
    front: hexToGL('#00D9FF'),    // Neon cyan
    back: hexToGL('#002C55'),     // Deep blue
    selected: hexToGL('#00FFFF')  // Bright cyan
};

// ═══════════════════════════════════════════════════════════════
// HIT DETECTION
// ═══════════════════════════════════════════════════════════════

function createHitDetector(canvas, nodes, animation) {
    return {
        test(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();

            // Convert to NDC (-1 to 1)
            const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

            // Account for aspect ratio
            const aspect = rect.width / rect.height;

            let closest = null;
            let minDist = Infinity;
            const hitRadius = 0.06;  // Smaller, more precise

            for (const node of nodes) {
                // Apply current animation state
                let y = node.y + animation.yDrift;
                let z = node.z + animation.zDrift;

                // Perspective projection (must match shader)
                const p = 1.0 / (1.0 + z * 0.3);
                const screenX = (node.x * p / aspect) * animation.zoom;
                const screenY = (y * p) * animation.zoom;

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

    if (!helixProgram || !nodeProgram) {
        console.error('Failed to create shader programs');
        return null;
    }

    // Generate geometry
    const helixGeometry = generateHelixGeometry();
    const nodePositions = calculateNodePositions();

    // ─────────────────────────────────────────────────────────────
    // ANIMATION STATE (No rotation - breathing only)
    // ─────────────────────────────────────────────────────────────

    const animation = {
        // Breathing oscillation
        yDrift: 0,
        zDrift: 0,
        yDriftSpeed: 0.3,
        zDriftSpeed: 0.2,
        yDriftAmplitude: 0.008,
        zDriftAmplitude: 0.005,

        // Selection zoom
        zoom: 1.0,
        targetZoom: 1.0,
        zoomSpeed: 0.08,

        // Time
        time: 0
    };

    // Create hit detector with access to animation state
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
        'u_time', 'u_yDrift', 'u_zDrift', 'u_zoom', 'u_resolution',
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
        'u_time', 'u_yDrift', 'u_zDrift', 'u_zoom', 'u_resolution', 'u_baseSize',
        'u_colorPrimary', 'u_colorSelected'
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
        // Soft breathing
        animation.yDrift = Math.sin(time * animation.yDriftSpeed) * animation.yDriftAmplitude;
        animation.zDrift = Math.sin(time * animation.zDriftSpeed) * animation.zDriftAmplitude;

        // Smooth zoom transition
        animation.zoom += (animation.targetZoom - animation.zoom) * animation.zoomSpeed;

        animation.time = time;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function renderHelix() {
        gl.useProgram(helixProgram);

        // Set uniforms
        gl.uniform1f(helixUniforms.u_time, animation.time);
        gl.uniform1f(helixUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(helixUniforms.u_zDrift, animation.zDrift);
        gl.uniform1f(helixUniforms.u_zoom, animation.zoom);
        gl.uniform2f(helixUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform3fv(helixUniforms.u_colorFront, COLORS.front);
        gl.uniform3fv(helixUniforms.u_colorBack, COLORS.back);
        gl.uniform1f(helixUniforms.u_glowIntensity, 0.3);

        // Bind vertex attributes
        bindVertexAttrib(gl, helixAttribs.a_position, helixPosBuffer, 3);
        bindVertexAttrib(gl, helixAttribs.a_progress, helixProgressBuffer, 1);
        bindVertexAttrib(gl, helixAttribs.a_strand, helixStrandBuffer, 1);

        // Draw both strands as line strips
        const segmentsPerStrand = HELIX_CONFIG.segments + 1;
        gl.lineWidth(2.0);  // Thicker lines for glow effect
        gl.drawArrays(gl.LINE_STRIP, 0, segmentsPerStrand);
        gl.drawArrays(gl.LINE_STRIP, segmentsPerStrand, segmentsPerStrand);

        disableVertexAttribs(gl, helixAttribs);
    }

    function renderNodes() {
        gl.useProgram(nodeProgram);

        // Update selection/hover/dimmed state in buffers
        for (let i = 0; i < nodeCount; i++) {
            nodeSelectedData[i] = (i === state.selectedIndex) ? 1.0 : 0.0;
            nodeHoveredData[i] = (i === state.hoveredIndex) ? 1.0 : 0.0;
            // Dim other nodes when one is selected
            nodeDimmedData[i] = (state.selectedIndex >= 0 && i !== state.selectedIndex) ? 1.0 : 0.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeSelectedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeSelectedData);

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeHoveredBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeHoveredData);

        gl.bindBuffer(gl.ARRAY_BUFFER, nodeDimmedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeDimmedData);

        // Set uniforms
        gl.uniform1f(nodeUniforms.u_time, animation.time);
        gl.uniform1f(nodeUniforms.u_yDrift, animation.yDrift);
        gl.uniform1f(nodeUniforms.u_zDrift, animation.zDrift);
        gl.uniform1f(nodeUniforms.u_zoom, animation.zoom);
        gl.uniform2f(nodeUniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(nodeUniforms.u_baseSize, 1.0);
        gl.uniform3fv(nodeUniforms.u_colorPrimary, COLORS.front);
        gl.uniform3fv(nodeUniforms.u_colorSelected, COLORS.selected);

        // Bind vertex attributes
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

    let lastTime = 0;

    function render(timestamp) {
        if (!state.running) return;

        const time = timestamp * 0.001;
        lastTime = timestamp;

        // Update animation
        updateAnimation(time);

        // Clear with transparent background
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Enable blending for glow effect (additive)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);  // Additive blending for glow

        // Render helix strands
        renderHelix();

        // Switch to standard alpha blending for nodes
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
            // Zoom on selection
            animation.targetZoom = index >= 0 ? 1.06 : 1.0;
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
            gl.deleteBuffer(nodeDimmedBuffer);
            gl.deleteBuffer(nodeIndexBuffer);

            // Delete programs
            [helixProgram, nodeProgram].forEach(program => {
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

// Export for global access
window.HelixWebGL = {
    createRenderer: createHelixRenderer,
    NODE_KEYS: NODE_KEYS,
    NODE_LABELS: NODE_LABELS
};
