// ============================================================
// V7 NEURAL HELIX - Canvas 2D Fallback Renderer
// Diagonal DNA double helix - matches WebGL V7 implementation
// Fullscreen cinematic mode with floating particles
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION (matches WebGL V7)
// ═══════════════════════════════════════════════════════════════

const CANVAS2D_CONFIG = {
    horizontalStretch: 1.8,     // +38% wider for fullscreen
    amplitude: 0.38,            // +36% taller oscillations
    frequency: 3.0,             // Fewer waves for smoother DNA curves
    segments: 100,
    nodeCount: 10,              // 10 nodes (sound_description moved to header)
    rungCount: 18,              // DNA rungs connecting strands
    // Diagonal offset (top-left to bottom-right flow)
    diagonalOffsetX: -0.4,      // Shift left more
    diagonalOffsetY: 0.25,      // Slightly higher start
    diagonalSlopeX: 0.8,        // Wider diagonal spread
    diagonalSlopeY: -0.5        // Steeper diagonal
};

// Node keys (sound_description moved to header)
const CANVAS2D_NODE_KEYS = [
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
    front: '#3FE3FF',      // Soft cyan (matches WebGL)
    back: '#0088cc',       // Brighter back strand
    selected: '#00FFFF',   // Bright cyan
    rung: '#1a8caa'        // Muted cyan for DNA rungs
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
    // Add slight vertical phase offset (0.05) for organic asymmetry
    const phaseOffset = 0.05;
    const baseY = CANVAS2D_CONFIG.amplitude * Math.sin(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI + phaseOffset);
    const baseZ = CANVAS2D_CONFIG.amplitude * Math.cos(t * CANVAS2D_CONFIG.frequency * Math.PI * 2 + Math.PI);

    // Add slight horizontal offset for visual separation
    const horizontalSeparation = 0.02;

    return {
        x: baseX + CANVAS2D_CONFIG.diagonalOffsetX + t * CANVAS2D_CONFIG.diagonalSlopeX + horizontalSeparation,
        y: baseY + CANVAS2D_CONFIG.diagonalOffsetY + t * CANVAS2D_CONFIG.diagonalSlopeY,
        z: baseZ * 0.9  // Slightly reduced depth for brightness difference
    };
}

// ═══════════════════════════════════════════════════════════════
// RUNG GENERATOR (DNA rungs connecting strands)
// ═══════════════════════════════════════════════════════════════

function generateRungs() {
    const rungs = [];
    const rungCount = CANVAS2D_CONFIG.rungCount;  // 18 rungs

    for (let i = 0; i < rungCount; i++) {
        const t = (i + 0.5) / rungCount;  // Evenly distributed, offset by half
        const posA = strandA2D(t);
        const posB = strandB2D(t);
        rungs.push({ t, posA, posB });
    }
    return rungs;
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

    // Generate DNA rungs (connecting strands)
    const rungs = generateRungs();

    // Calculate node positions ON the helix curve (diagonal)
    const nodeCount = CANVAS2D_CONFIG.nodeCount;  // 10 nodes
    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
        const t = i / (nodeCount - 1);  // Distribute evenly across full helix
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

        // Multi-frequency breathing (matches WebGL)
        breathScale: 1.0,
        breathFrequencies: [0.08, 0.13, 0.21],
        breathWeights: [1.0, 0.4, 0.2],
        breathAmplitude: 0.04,  // ±4%

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

        // Apply parallax
        x += animation.parallaxX;
        y += animation.parallaxY;

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

        // #0088cc to #3FE3FF (matches new WebGL colors)
        const r = Math.round(0 + (63 - 0) * t);
        const g = Math.round(136 + (227 - 136) * t);
        const b = Math.round(204 + (255 - 204) * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function renderRungs() {
        rungs.forEach(rung => {
            const projA = project(rung.posA.x, rung.posA.y, rung.posA.z);
            const projB = project(rung.posB.x, rung.posB.y, rung.posB.z);

            // Average depth for color
            const avgDepth = (projA.depth + projB.depth) / 2;
            const depthFactor = (avgDepth + 0.3) / 0.6;

            // Create gradient along rung
            const gradient = ctx.createLinearGradient(projA.sx, projA.sy, projB.sx, projB.sy);
            gradient.addColorStop(0, 'rgba(26, 140, 170, 0)');
            gradient.addColorStop(0.2, 'rgba(26, 140, 170, 0.3)');
            gradient.addColorStop(0.5, 'rgba(26, 140, 170, 0.4)');
            gradient.addColorStop(0.8, 'rgba(26, 140, 170, 0.3)');
            gradient.addColorStop(1, 'rgba(26, 140, 170, 0)');

            ctx.beginPath();
            ctx.moveTo(projA.sx, projA.sy);
            ctx.lineTo(projB.sx, projB.sy);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.3 + depthFactor * 0.3;
            ctx.stroke();
        });

        ctx.globalAlpha = 1;
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

            // Base size with depth scaling
            let baseSize = 16 * node.scale;

            // Node breathing (6% over 2.5s - matches WebGL)
            const nodePulse = 1.0 + Math.sin(animation.time * 2.5 + node.index * 0.5) * 0.06;
            baseSize *= nodePulse;

            // Hover/selection scaling (matches WebGL: 18% hover, 50% selected)
            if (isSelected) baseSize *= 1.5;
            else if (isHovered) baseSize *= 1.18;

            // Depth-based alpha
            let alpha = 0.6 + (node.depth + 0.3) * 0.67;
            if (isDimmed) alpha *= 0.4;

            // ═══════════════════════════════════════════════════════
            // 3-LAYER NODE DESIGN (matches WebGL shader)
            // ═══════════════════════════════════════════════════════

            // Layer 3: Outer halo (drawn first, behind everything)
            if (!isDimmed) {
                const haloSize = baseSize * 2.2;
                const gradient = ctx.createRadialGradient(
                    node.sx, node.sy, baseSize * 0.5,
                    node.sx, node.sy, haloSize
                );
                gradient.addColorStop(0, 'rgba(0, 51, 102, 0.4)');  // Deep blue halo
                gradient.addColorStop(1, 'rgba(0, 51, 102, 0)');

                ctx.beginPath();
                ctx.arc(node.sx, node.sy, haloSize, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.globalAlpha = alpha * 0.4;
                ctx.fill();
            }

            // Layer 2: Inner ring
            const ringSize = baseSize * 1.3;
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, ringSize, 0, Math.PI * 2);

            if (isSelected) {
                // Ring ripple effect on selection
                const rippleTime = (animation.time * 0.8) % 1;
                const rippleRadius = baseSize * (0.8 + rippleTime * 0.6);
                const rippleAlpha = (1.0 - rippleTime) * 0.5;

                ctx.strokeStyle = CANVAS2D_COLORS.selected;
                ctx.lineWidth = 2;
                ctx.globalAlpha = rippleAlpha * alpha;
                ctx.stroke();
            }

            const innerRingColor = interpolateColor(node.depth);
            ctx.fillStyle = innerRingColor;
            ctx.globalAlpha = alpha * 0.65;
            ctx.fill();

            // Layer 1: Core (brightest, on top)
            const coreSize = baseSize * 0.7;
            ctx.shadowBlur = isSelected ? 40 : isHovered ? 25 : 15;
            ctx.shadowColor = isSelected ? CANVAS2D_COLORS.selected : CANVAS2D_COLORS.front;

            ctx.beginPath();
            ctx.arc(node.sx, node.sy, coreSize, 0, Math.PI * 2);

            if (isSelected) {
                const pulse = Math.sin(animation.time * 4) * 0.2 + 0.8;
                ctx.fillStyle = CANVAS2D_COLORS.selected;
                ctx.globalAlpha = alpha * pulse;
            } else if (isHovered) {
                ctx.fillStyle = CANVAS2D_COLORS.front;
                ctx.globalAlpha = Math.min(1, alpha * 1.3);
            } else {
                ctx.fillStyle = interpolateColor(node.depth);
                ctx.globalAlpha = alpha;
            }

            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

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

        // Soft drift (with motion scale)
        animation.xDrift = Math.sin(time * animation.xDriftSpeed) * animation.xDriftAmplitude * animation.motionScale;
        animation.yDrift = Math.sin(time * animation.yDriftSpeed + 2.0) * animation.yDriftAmplitude * animation.motionScale;

        // Multi-frequency organic breathing (matches WebGL)
        let breathSum = 0;
        let weightSum = 0;
        for (let i = 0; i < animation.breathFrequencies.length; i++) {
            breathSum += Math.sin(time * animation.breathFrequencies[i] * Math.PI * 2) * animation.breathWeights[i];
            weightSum += animation.breathWeights[i];
        }
        animation.breathScale = 1.0 + (breathSum / weightSum) * animation.breathAmplitude * animation.motionScale;

        // Traveling wave
        animation.waveOffset = time * animation.waveSpeed * animation.motionScale;

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
        renderRungs();
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
                if (newHoveredIndex >= 0) {
                    // Return full hover data with pixel coordinates (matches WebGL)
                    const node = nodePositions[newHoveredIndex];
                    const proj = project(node.x, node.y, node.z);
                    const rect = canvas.getBoundingClientRect();
                    onHover({
                        key: node.key,
                        label: node.label,
                        screenX: rect.left + proj.sx,
                        screenY: rect.top + proj.sy
                    });
                } else {
                    onHover(null);
                }
            }
        }
    }

    function handleClick(e) {
        const hit = hitTest(e.clientX, e.clientY);
        if (hit && onClick) {
            // Pass full click data including pixel coordinates for anchored panel
            const node = nodePositions[hit.index];
            const proj = project(node.x, node.y, node.z);
            const rect = canvas.getBoundingClientRect();
            onClick({
                key: node.key,
                screenX: rect.left + proj.sx,
                screenY: rect.top + proj.sy,
                index: hit.index
            });
        }
    }

    function handleMouseLeave() {
        if (state.hoveredIndex !== -1) {
            state.hoveredIndex = -1;
            canvas.style.cursor = 'default';

            if (onHover) {
                onHover(null);
            }
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
                // Slow motion by 50% on selection, zoom OUT to show context
                animation.targetMotionScale = 0.5;
                animation.targetZoom = 0.9;  // Zoom OUT (matches WebGL)
            } else {
                animation.targetMotionScale = 1.0;
                animation.targetZoom = 1.0;
            }
        },

        setParallax(normalizedX, normalizedY) {
            // normalizedX/Y are 0-1, center at 0.5
            // Convert to offset: ±0.06 for X, ±0.04 for Y
            animation.targetParallaxX = (normalizedX - 0.5) * 0.12;  // ±0.06
            animation.targetParallaxY = (normalizedY - 0.5) * 0.08;  // ±0.04
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
