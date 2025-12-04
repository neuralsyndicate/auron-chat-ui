// ============================================================
// V7 NEURAL HELIX - Canvas 2D Fallback Renderer
// Diagonal DNA double helix - matches WebGL V7 implementation
// Fullscreen cinematic mode with floating particles
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION (matches WebGL V7)
// ═══════════════════════════════════════════════════════════════

const CANVAS2D_CONFIG = {
    horizontalStretch: 1.3,
    amplitude: 0.28,
    frequency: 4.5,
    segments: 100,
    nodeCount: 11,
    // Diagonal offset (top-left to bottom-right flow)
    diagonalOffsetX: -0.3,
    diagonalOffsetY: 0.2,
    diagonalSlopeX: 0.6,
    diagonalSlopeY: -0.4
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
    selected: '#00FFFF',   // Bright cyan
    particle: 'rgba(0, 217, 255, 0.15)'
};

// ═══════════════════════════════════════════════════════════════
// PARAMETRIC HELIX FUNCTIONS (diagonal flow)
// ═══════════════════════════════════════════════════════════════

function strandA2D(t) {
    const baseX = (t - 0.5) * CANVAS2D_CONFIG.horizontalStretch;
    const baseY = CANVAS2D_CONFIG.amplitude * Math.sin(t * CANVAS2D_CONFIG.frequency * Math.PI * 2);
    const baseZ = CANVAS2D_CONFIG.amplitude * Math.cos(t * CANVAS2D_CONFIG.frequency * Math.PI * 2);

    // Apply diagonal transformation
    return {
        x: baseX + CANVAS2D_CONFIG.diagonalOffsetX + t * CANVAS2D_CONFIG.diagonalSlopeX,
        y: baseY + CANVAS2D_CONFIG.diagonalOffsetY + t * CANVAS2D_CONFIG.diagonalSlopeY,
        z: baseZ
    };
}

function strandB2D(t) {
    const baseX = (t - 0.5) * CANVAS2D_CONFIG.horizontalStretch;
    const baseY = CANVAS2D_CONFIG.amplitude * Math.sin(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI);
    const baseZ = CANVAS2D_CONFIG.amplitude * Math.cos(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI);

    // Apply diagonal transformation
    return {
        x: baseX + CANVAS2D_CONFIG.diagonalOffsetX + t * CANVAS2D_CONFIG.diagonalSlopeX,
        y: baseY + CANVAS2D_CONFIG.diagonalOffsetY + t * CANVAS2D_CONFIG.diagonalSlopeY,
        z: baseZ
    };
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE GENERATOR
// ═══════════════════════════════════════════════════════════════

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
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════════

function createCanvas2DRenderer(canvas, callbacks = {}) {
    const { onHover, onClick } = callbacks;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.warn('Canvas 2D not supported');
        return null;
    }

    // Generate particles
    const particles = generateParticles(25);

    // Calculate node positions ON the helix curve (diagonal)
    const nodePositions = [];
    for (let i = 0; i < 11; i++) {
        const t = i / 10;
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
    // ANIMATION STATE (matches WebGL V7)
    // ─────────────────────────────────────────────────────────────

    const animation = {
        // Soft drift (x/y offset)
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
    // COORDINATE TRANSFORMS
    // ─────────────────────────────────────────────────────────────

    function project(x, y, z) {
        // Apply drift
        x += animation.xDrift;
        y += animation.yDrift;

        // Apply breathing scale
        x *= animation.breathScale;
        y *= animation.breathScale;
        z *= animation.breathScale;

        // Apply zoom
        x *= animation.zoom;
        y *= animation.zoom;
        z *= animation.zoom;

        // Perspective
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
        let minDist = 30; // Larger hit radius for bigger nodes

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
        const factor = (depth + 0.3) / 0.6;
        const t = Math.max(0, Math.min(1, factor));

        // #002C55 to #00D9FF
        const r = Math.round(0);
        const g = Math.round(44 + (217 - 44) * t);
        const b = Math.round(85 + (255 - 85) * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function renderParticles() {
        particles.forEach(p => {
            // Apply half drift to particles
            const px = p.x + animation.xDrift * 0.5;
            const py = p.y + animation.yDrift * 0.5;
            const proj = project(px, py, p.z);

            // Twinkle effect
            const twinkle = 0.5 + 0.5 * Math.sin(animation.time * 2.0 + p.phase);
            const alpha = p.alpha * twinkle;

            // Draw particle
            ctx.beginPath();
            ctx.arc(proj.sx, proj.sy, p.size * proj.scale * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`;
            ctx.fill();
        });
    }

    function renderHelix() {
        const rect = canvas.getBoundingClientRect();

        // Draw strand A with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = CANVAS2D_COLORS.front;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        for (let i = 0; i <= CANVAS2D_CONFIG.segments; i++) {
            const t = i / CANVAS2D_CONFIG.segments;
            const pos = strandA2D(t);
            const proj = project(pos.x, pos.y, pos.z);

            // Traveling wave brightness
            const wave = Math.sin((t * 30.0) - animation.waveOffset) * 0.5 + 0.5;
            const waveGlow = wave * 0.4;

            ctx.strokeStyle = interpolateColor(proj.depth);
            const edgeFade = Math.min(t / 0.05, (1 - t) / 0.05, 1);
            ctx.globalAlpha = (0.8 + (proj.depth + 0.3) * 0.2 + waveGlow) * edgeFade;

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

            const wave = Math.sin((t * 30.0) - animation.waveOffset) * 0.5 + 0.5;
            const waveGlow = wave * 0.4;

            ctx.strokeStyle = interpolateColor(proj.depth);
            const edgeFade = Math.min(t / 0.05, (1 - t) / 0.05, 1);
            ctx.globalAlpha = (0.8 + (proj.depth + 0.3) * 0.2 + waveGlow) * edgeFade;

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

            // Larger base size (30% bigger) with depth scaling
            let size = 16 * node.scale;

            // Node breathing
            const nodePulse = 1.0 + Math.sin(animation.time * 2.0 + node.index * 0.5) * 0.05;
            size *= nodePulse;

            if (isSelected) size *= 1.5;
            else if (isHovered) size *= 1.3;

            // Depth-based alpha
            let alpha = 0.6 + (node.depth + 0.3) * 0.67;
            if (isDimmed) alpha *= 0.4;

            // Selection/hover glow
            if (isSelected || isHovered) {
                ctx.shadowBlur = isSelected ? 40 : 25;
                ctx.shadowColor = CANVAS2D_COLORS.selected;
            }

            // Draw node
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, size, 0, Math.PI * 2);

            if (isSelected) {
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

            // Draw larger halo
            if (!isDimmed) {
                ctx.beginPath();
                ctx.arc(node.sx, node.sy, size * 1.8, 0, Math.PI * 2);
                ctx.globalAlpha = alpha * 0.25;
                ctx.fill();
            }

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE ANIMATION
    // ─────────────────────────────────────────────────────────────

    function updateAnimation(time) {
        // Soft drift (with motion scale)
        animation.xDrift = Math.sin(time * animation.xDriftSpeed) * animation.xDriftAmplitude * animation.motionScale;
        animation.yDrift = Math.sin(time * animation.yDriftSpeed + 2.0) * animation.yDriftAmplitude * animation.motionScale;

        // Breathing scale
        animation.breathScale = 1.0 + Math.sin(time * animation.breathSpeed) * animation.breathAmplitude * animation.motionScale;

        // Traveling wave
        animation.waveOffset = time * animation.waveSpeed * animation.motionScale;

        // Smooth transitions
        animation.zoom += (animation.targetZoom - animation.zoom) * 0.08;
        animation.motionScale += (animation.targetMotionScale - animation.motionScale) * 0.05;

        animation.time = time;
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN RENDER LOOP
    // ─────────────────────────────────────────────────────────────

    function render(timestamp) {
        if (!state.running) return;

        const rect = canvas.getBoundingClientRect();
        const time = timestamp * 0.001;

        updateAnimation(time);

        // Clear
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Render layers (back to front)
        renderParticles();
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
            if (index >= 0) {
                // Slow motion by 50% on selection
                animation.targetMotionScale = 0.5;
                animation.targetZoom = 1.05;
            } else {
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
        }
    };
}

// Export for global access
window.HelixCanvas2D = {
    createRenderer: createCanvas2DRenderer,
    NODE_KEYS: CANVAS2D_NODE_KEYS,
    NODE_LABELS: CANVAS2D_NODE_LABELS
};
