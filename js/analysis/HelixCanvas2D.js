// ============================================================
// V7 NEURAL HELIX - Canvas 2D Fallback Renderer
// Used when WebGL is not available or for mobile devices
// ============================================================

const CANVAS2D_CONFIG = {
    width: 2.0,       // Horizontal span (-1 to 1)
    radius: 0.32,     // Circular cross-section radius
    frequency: 3,     // Number of turns
    segments: 100,    // Points per strand
    depthScale: 0.25  // Perspective depth factor
};

const CANVAS2D_COLORS = {
    primary: '#00D9FF',
    secondary: '#0066FF',
    selected: '#00FFFF',
    particle: 'rgba(0, 217, 255, 0.08)'
};

const CANVAS2D_NODES = [
    { key: 'sound_description', label: 'Sound Description', xPercent: 8 },
    { key: 'genre_fusion', label: 'Genre Fusion', xPercent: 16 },
    { key: 'neural_spectrum', label: 'Neural Spectrum', xPercent: 24 },
    { key: 'sound_palette', label: 'Sound Palette', xPercent: 32 },
    { key: 'tonal_identity', label: 'Tonal DNA', xPercent: 40 },
    { key: 'rhythmic_dna', label: 'Rhythmic DNA', xPercent: 48 },
    { key: 'timbre_dna', label: 'Timbre DNA', xPercent: 56 },
    { key: 'emotional_fingerprint', label: 'Emotional Fingerprint', xPercent: 64 },
    { key: 'processing_signature', label: 'Processing Signature', xPercent: 72 },
    { key: 'sonic_architecture', label: 'Sonic Architecture', xPercent: 80 },
    { key: 'inspirational_triggers', label: 'Inspirational Triggers', xPercent: 88 }
];

function createCanvas2DRenderer(canvas, callbacks = {}) {
    const { onHover, onClick } = callbacks;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.warn('Canvas 2D not supported');
        return null;
    }

    const config = CANVAS2D_CONFIG;

    // Calculate node positions (horizontal: spine on X axis)
    const nodePositions = CANVAS2D_NODES.map((node, i) => {
        const t = node.xPercent / 100;
        // Horizontal: spine position along X axis
        const x = (t - 0.5) * config.width;
        const strandPhase = (i % 2) * Math.PI;
        const angle = t * config.frequency * Math.PI * 2 + strandPhase;

        return {
            ...node,
            x: x,                           // Spine position (horizontal)
            y: Math.cos(angle) * config.radius,  // Circular Y component
            z: Math.sin(angle) * config.radius,  // Circular Z component
            index: i
        };
    });

    // Generate particles (horizontal: wider on X, narrower on Y)
    const particles = Array.from({ length: 15 }, () => ({
        x: (Math.random() - 0.5) * 2.2,  // Wider spread along horizontal spine
        y: (Math.random() - 0.5) * 1.4,  // Narrower spread for circular component
        z: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        alpha: 0.05 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2
    }));

    // State
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
    // RESIZE
    // ─────────────────────────────────────────────────────────────

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
    }

    resize();

    // ─────────────────────────────────────────────────────────────
    // COORDINATE TRANSFORMS
    // ─────────────────────────────────────────────────────────────

    function project(x, y, z, rotation) {
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        const rx = x * c - z * s;
        const rz = x * s + z * c;

        const p = 1 / (1 + rz * config.depthScale);
        const rect = canvas.getBoundingClientRect();
        const scale = Math.min(rect.width, rect.height) * 0.4;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        return {
            sx: cx + rx * p * scale,
            sy: cy - y * p * scale,
            scale: p,
            depth: rz
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
        let minDist = 30; // Pixel hit radius

        for (const node of nodePositions) {
            const proj = project(node.x, node.y, node.z, state.rotation);
            const dist = Math.hypot(mx - proj.sx, my - proj.sy);

            // Prefer front nodes
            if (dist < minDist * proj.scale) {
                if (!closest || proj.depth > closest.depth) {
                    closest = { ...node, ...proj, dist };
                }
            }
        }

        return closest;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    function renderParticles() {
        const rect = canvas.getBoundingClientRect();

        particles.forEach(p => {
            // Update position
            p.x += Math.sin(state.time * 0.5 + p.phase) * 0.001;
            p.y += Math.cos(state.time * 0.3 + p.phase) * 0.0008;

            // Wrap (horizontal: wrap on X, clamp Y)
            if (Math.abs(p.x) > 1.1) p.x *= -0.9;
            if (Math.abs(p.y) > 0.8) p.y *= 0.95;

            const proj = project(p.x, p.y, p.z, state.rotation);
            const size = p.size * proj.scale;
            const alpha = p.alpha * (proj.depth + 1) * 0.5;

            ctx.beginPath();
            ctx.arc(proj.sx, proj.sy, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`;
            ctx.fill();
        });
    }

    function renderHelix() {
        const rect = canvas.getBoundingClientRect();

        // Draw both strands (horizontal: spine on X axis)
        for (let strand = 0; strand < 2; strand++) {
            const phase = strand * Math.PI;
            const color = strand === 0 ? CANVAS2D_COLORS.primary : CANVAS2D_COLORS.secondary;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            for (let i = 0; i <= config.segments; i++) {
                const t = i / config.segments;
                // Horizontal: spine runs along X axis
                const x = (t - 0.5) * config.width;
                const angle = t * config.frequency * Math.PI * 2 + phase;
                const y = Math.cos(angle) * config.radius;  // Circular Y
                const z = Math.sin(angle) * config.radius;  // Circular Z

                const proj = project(x, y, z, state.rotation);

                // Depth-based alpha
                ctx.globalAlpha = 0.3 + (proj.depth + 1) * 0.35;

                if (i === 0) {
                    ctx.moveTo(proj.sx, proj.sy);
                } else {
                    ctx.lineTo(proj.sx, proj.sy);
                }
            }

            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Add glow effect using shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = CANVAS2D_COLORS.primary;

        for (let strand = 0; strand < 2; strand++) {
            const phase = strand * Math.PI;

            ctx.beginPath();
            ctx.strokeStyle = strand === 0 ? CANVAS2D_COLORS.primary : CANVAS2D_COLORS.secondary;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;

            for (let i = 0; i <= config.segments; i++) {
                const t = i / config.segments;
                // Horizontal: spine runs along X axis
                const x = (t - 0.5) * config.width;
                const angle = t * config.frequency * Math.PI * 2 + phase;
                const y = Math.cos(angle) * config.radius;  // Circular Y
                const z = Math.sin(angle) * config.radius;  // Circular Z

                const proj = project(x, y, z, state.rotation);

                if (i === 0) {
                    ctx.moveTo(proj.sx, proj.sy);
                } else {
                    ctx.lineTo(proj.sx, proj.sy);
                }
            }

            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    function renderNodes() {
        // Sort nodes by depth (back to front)
        const sortedNodes = nodePositions.map(node => {
            const proj = project(node.x, node.y, node.z, state.rotation);
            return { ...node, ...proj };
        }).sort((a, b) => a.depth - b.depth);

        sortedNodes.forEach(node => {
            const isSelected = node.index === state.selectedIndex;
            const isHovered = node.index === state.hoveredIndex;
            const isDimmed = state.selectedIndex >= 0 && !isSelected;

            // Base size with depth scaling
            let size = 10 * node.scale;
            if (isSelected) size *= 1.4;
            else if (isHovered) size *= 1.2;

            // Depth-based alpha
            let alpha = 0.4 + (node.depth + 1) * 0.3;
            if (isDimmed) alpha *= 0.3;

            // Glow
            if (isSelected || isHovered) {
                ctx.shadowBlur = isSelected ? 25 : 15;
                ctx.shadowColor = CANVAS2D_COLORS.selected;
            }

            // Draw node
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, size, 0, Math.PI * 2);

            if (isSelected) {
                // Pulsing glow for selected
                const pulse = Math.sin(state.time * 4) * 0.2 + 0.8;
                ctx.fillStyle = CANVAS2D_COLORS.selected;
                ctx.globalAlpha = alpha * pulse;
            } else if (isHovered) {
                ctx.fillStyle = CANVAS2D_COLORS.primary;
                ctx.globalAlpha = alpha * 1.3;
            } else {
                ctx.fillStyle = CANVAS2D_COLORS.primary;
                ctx.globalAlpha = alpha;
            }

            ctx.fill();

            // Reset
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN RENDER LOOP
    // ─────────────────────────────────────────────────────────────

    function render(timestamp) {
        if (!state.running) return;

        const rect = canvas.getBoundingClientRect();

        // Smooth rotation speed transition
        state.rotationSpeed += (state.targetRotationSpeed - state.rotationSpeed) * 0.05;
        state.rotation += state.rotationSpeed;
        state.time = timestamp * 0.001;

        // Clear
        ctx.clearRect(0, 0, rect.width, rect.height);

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
        const hit = hitTest(e.clientX, e.clientY);
        const newHoveredIndex = hit ? hit.index : -1;

        if (newHoveredIndex !== state.hoveredIndex) {
            state.hoveredIndex = newHoveredIndex;
            state.targetRotationSpeed = newHoveredIndex >= 0 ? 0.001 :
                                        state.selectedIndex >= 0 ? 0.002 : 0.005;

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
    NODE_CONFIG: CANVAS2D_NODES
};
