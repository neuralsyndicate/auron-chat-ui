// ============================================================
// V7 NEURAL HELIX - Canvas 2D Fallback Renderer
// Horizontal DNA double helix - matches WebGL implementation
// NO rotation - soft breathing oscillation only
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION (matches WebGL)
// ═══════════════════════════════════════════════════════════════

const CANVAS2D_CONFIG = {
    horizontalStretch: 1.3,    // ~65% viewport mapped to NDC
    amplitude: 0.28,           // Subtle Y/Z amplitude
    frequency: 4.5,            // 4-5 complete twists
    segments: 100,             // Points per strand
    nodeCount: 11
};

const CANVAS2D_NODE_KEYS = [
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

const CANVAS2D_NODE_LABELS = [
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

const CANVAS2D_COLORS = {
    front: '#00D9FF',      // Neon cyan
    back: '#002C55',       // Deep blue
    selected: '#00FFFF'    // Bright cyan
};

// ═══════════════════════════════════════════════════════════════
// PARAMETRIC HELIX FUNCTIONS (matches WebGL)
// ═══════════════════════════════════════════════════════════════

function strandA2D(t) {
    return {
        x: (t - 0.5) * CANVAS2D_CONFIG.horizontalStretch,
        y: CANVAS2D_CONFIG.amplitude * Math.sin(t * CANVAS2D_CONFIG.frequency * Math.PI * 2),
        z: CANVAS2D_CONFIG.amplitude * Math.cos(t * CANVAS2D_CONFIG.frequency * Math.PI * 2)
    };
}

function strandB2D(t) {
    // Phase shift by π for second strand
    return {
        x: (t - 0.5) * CANVAS2D_CONFIG.horizontalStretch,
        y: CANVAS2D_CONFIG.amplitude * Math.sin(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI),
        z: CANVAS2D_CONFIG.amplitude * Math.cos(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI)
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════════

function createCanvas2DRenderer(canvas, callbacks = {}) {
    const { onHover, onClick } = callbacks;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.warn('Canvas 2D not supported');
        return null;
    }

    // Calculate node positions ON the helix curve (matches WebGL)
    const nodePositions = [];
    for (let i = 0; i < 11; i++) {
        const t = i / 10;  // 0, 0.1, 0.2, ... 1.0
        // Alternate nodes between strands
        const strand = i % 2 === 0 ? strandA2D : strandB2D;
        const pos = strand(t);
        nodePositions.push({
            key: CANVAS2D_NODE_KEYS[i],
            label: CANVAS2D_NODE_LABELS[i],
            t: t,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            index: i
        });
    }

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

    const state = {
        selectedIndex: -1,
        hoveredIndex: -1,
        rafId: null,
        running: false
    };

    // ─────────────────────────────────────────────────────────────
    // RESIZE
    // ─────────────────────────────────────────────────────────────

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    // ─────────────────────────────────────────────────────────────
    // COORDINATE TRANSFORMS (matches WebGL shader)
    // ─────────────────────────────────────────────────────────────

    function project(x, y, z) {
        // Apply breathing drift
        y += animation.yDrift;
        z += animation.zDrift;

        // Apply zoom
        x *= animation.zoom;
        y *= animation.zoom;
        z *= animation.zoom;

        // Perspective (matches WebGL)
        const p = 1.0 / (1.0 + z * 0.3);

        const rect = canvas.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const scale = Math.min(rect.width, rect.height) * 0.45;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        return {
            sx: cx + (x * p / aspect) * scale,
            sy: cy - (y * p) * scale,
            scale: p,
            depth: z
        };
    }

    // ─────────────────────────────────────────────────────────────
    // HIT DETECTION
    // ─────────────────────────────────────────────────────────────

    function hitTest(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;

        let closest = null;
        let minDist = 25; // Pixel hit radius

        for (const node of nodePositions) {
            const proj = project(node.x, node.y, node.z);
            const dist = Math.hypot(mx - proj.sx, my - proj.sy);
            const adjustedRadius = minDist * proj.scale;

            if (dist < adjustedRadius && (!closest || dist < closest.dist)) {
                closest = { ...node, ...proj, dist };
            }
        }

        return closest;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function interpolateColor(depth) {
        // Depth-based color (front cyan, back blue)
        const factor = (depth + 0.3) / 0.6;
        const t = Math.max(0, Math.min(1, factor));

        // #002C55 to #00D9FF
        const r = Math.round(0 + (0 - 0) * t);
        const g = Math.round(44 + (217 - 44) * t);
        const b = Math.round(85 + (255 - 85) * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function renderHelix() {
        const rect = canvas.getBoundingClientRect();

        // Draw strand A
        ctx.beginPath();
        ctx.lineWidth = 2;

        for (let i = 0; i <= CANVAS2D_CONFIG.segments; i++) {
            const t = i / CANVAS2D_CONFIG.segments;
            const pos = strandA2D(t);
            const proj = project(pos.x, pos.y, pos.z);

            // Depth-based color
            ctx.strokeStyle = interpolateColor(proj.depth);

            // Edge fade
            const edgeFade = Math.min(t / 0.05, (1 - t) / 0.05, 1);
            ctx.globalAlpha = (0.7 + (proj.depth + 0.3) * 0.5) * edgeFade;

            if (i === 0) {
                ctx.moveTo(proj.sx, proj.sy);
            } else {
                ctx.lineTo(proj.sx, proj.sy);
            }
        }
        ctx.stroke();

        // Draw strand B
        ctx.beginPath();

        for (let i = 0; i <= CANVAS2D_CONFIG.segments; i++) {
            const t = i / CANVAS2D_CONFIG.segments;
            const pos = strandB2D(t);
            const proj = project(pos.x, pos.y, pos.z);

            ctx.strokeStyle = interpolateColor(proj.depth);

            const edgeFade = Math.min(t / 0.05, (1 - t) / 0.05, 1);
            ctx.globalAlpha = (0.7 + (proj.depth + 0.3) * 0.5) * edgeFade;

            if (i === 0) {
                ctx.moveTo(proj.sx, proj.sy);
            } else {
                ctx.lineTo(proj.sx, proj.sy);
            }
        }
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = CANVAS2D_COLORS.front;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;

        // Glow pass for strand A
        ctx.beginPath();
        for (let i = 0; i <= CANVAS2D_CONFIG.segments; i++) {
            const t = i / CANVAS2D_CONFIG.segments;
            const pos = strandA2D(t);
            const proj = project(pos.x, pos.y, pos.z);

            if (i === 0) {
                ctx.moveTo(proj.sx, proj.sy);
            } else {
                ctx.lineTo(proj.sx, proj.sy);
            }
        }
        ctx.strokeStyle = CANVAS2D_COLORS.front;
        ctx.stroke();

        // Glow pass for strand B
        ctx.beginPath();
        for (let i = 0; i <= CANVAS2D_CONFIG.segments; i++) {
            const t = i / CANVAS2D_CONFIG.segments;
            const pos = strandB2D(t);
            const proj = project(pos.x, pos.y, pos.z);

            if (i === 0) {
                ctx.moveTo(proj.sx, proj.sy);
            } else {
                ctx.lineTo(proj.sx, proj.sy);
            }
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    function renderNodes() {
        // Sort nodes by depth (back to front)
        const sortedNodes = nodePositions.map(node => {
            const proj = project(node.x, node.y, node.z);
            return { ...node, ...proj };
        }).sort((a, b) => a.depth - b.depth);

        sortedNodes.forEach(node => {
            const isSelected = node.index === state.selectedIndex;
            const isHovered = node.index === state.hoveredIndex;
            const isDimmed = state.selectedIndex >= 0 && !isSelected;

            // Base size with depth scaling
            let size = 12 * node.scale;
            if (isSelected) size *= 1.5;
            else if (isHovered) size *= 1.3;

            // Depth-based alpha
            let alpha = 0.6 + (node.depth + 0.3) * 0.67;
            if (isDimmed) alpha *= 0.4;

            // Selection/hover glow
            if (isSelected || isHovered) {
                ctx.shadowBlur = isSelected ? 30 : 20;
                ctx.shadowColor = CANVAS2D_COLORS.selected;
            }

            // Draw node
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, size, 0, Math.PI * 2);

            if (isSelected) {
                // Pulsing glow for selected
                const pulse = Math.sin(animation.time * 4) * 0.2 + 0.8;
                ctx.fillStyle = CANVAS2D_COLORS.selected;
                ctx.globalAlpha = alpha * pulse;
            } else if (isHovered) {
                ctx.fillStyle = CANVAS2D_COLORS.front;
                ctx.globalAlpha = alpha * 1.3;
            } else {
                ctx.fillStyle = interpolateColor(node.depth);
                ctx.globalAlpha = alpha;
            }

            ctx.fill();

            // Draw halo
            if (!isDimmed) {
                ctx.beginPath();
                ctx.arc(node.sx, node.sy, size * 1.6, 0, Math.PI * 2);
                ctx.globalAlpha = alpha * 0.2;
                ctx.fill();
            }

            // Reset
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

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
    // MAIN RENDER LOOP
    // ─────────────────────────────────────────────────────────────

    function render(timestamp) {
        if (!state.running) return;

        const rect = canvas.getBoundingClientRect();
        const time = timestamp * 0.001;

        // Update animation
        updateAnimation(time);

        // Clear
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Render layers
        renderHelix();
        renderNodes();

        state.rafId = requestAnimationFrame(render);
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────

    function handleMouseMove(e) {
        const hit = hitTest(e.clientX, e.clientY);
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
        const hit = hitTest(e.clientX, e.clientY);
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

            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
        }
    };
}

// Export for global access
window.HelixCanvas2D = {
    createRenderer: createCanvas2DRenderer,
    NODE_KEYS: CANVAS2D_NODE_KEYS,
    NODE_LABELS: CANVAS2D_NODE_LABELS
};
