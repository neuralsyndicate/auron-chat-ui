// ============================================================
// V8 NEURAL HELIX - Main WebGL Renderer
// Cinematic 3D DNA experience with matrix-based camera
// ============================================================

const HelixWebGLV8 = (function() {
    'use strict';

    const { vec3, mat4, degToRad, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // HELIX CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const HELIX_CONFIG = {
        // Helix geometry
        length: 2.0,          // Total length
        radius: 0.32,         // Strand radius
        frequency: 3,         // Number of turns
        segments: 120,        // Points per strand

        // Node positions (11 modules along helix)
        nodes: [
            { key: 'sound_description', label: 'Sound Description', progress: 0.08 },
            { key: 'genre_fusion', label: 'Genre Fusion', progress: 0.16 },
            { key: 'neural_spectrum', label: 'Neural Spectrum', progress: 0.24 },
            { key: 'sound_palette', label: 'Sound Palette', progress: 0.32 },
            { key: 'tonal_identity', label: 'Tonal DNA', progress: 0.40 },
            { key: 'rhythmic_dna', label: 'Rhythmic DNA', progress: 0.48 },
            { key: 'timbre_dna', label: 'Timbre DNA', progress: 0.56 },
            { key: 'emotional_fingerprint', label: 'Emotional Fingerprint', progress: 0.64 },
            { key: 'processing_signature', label: 'Processing Signature', progress: 0.72 },
            { key: 'sonic_architecture', label: 'Sonic Architecture', progress: 0.80 },
            { key: 'inspirational_triggers', label: 'Inspirational Triggers', progress: 0.88 }
        ],

        // Node rendering
        nodeSize: 0.04,
        nodeHitRadius: 0.08,

        // Colors
        colors: {
            primary: [0, 0.85, 1],       // Cyan
            secondary: [0, 0.4, 1],      // Blue
            selected: [0, 1, 1],         // Bright cyan
            background: [0, 0, 0]
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // MAIN RENDERER CLASS
    // ═══════════════════════════════════════════════════════════════

    class HelixRendererV8 {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.options = options;
            this.config = { ...HELIX_CONFIG };

            // Profile data
            this.profile = options.profile || {};

            // Initialize WebGL
            this.gl = canvas.getContext('webgl', {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: false
            });

            if (!this.gl) {
                console.error('WebGL not supported');
                return;
            }

            // Time tracking
            this.startTime = performance.now();
            this.lastTime = this.startTime;
            this.time = 0;
            this.deltaTime = 0;

            // Running state
            this.running = false;
            this.rafId = null;

            // Initialize all systems
            this.initializeSystems();
            this.createGeometry();
            this.setupEventListeners();

            // Resize handling
            this.resize();
        }

        // ─────────────────────────────────────────────────────────────
        // INITIALIZATION
        // ─────────────────────────────────────────────────────────────

        initializeSystems() {
            const gl = this.gl;

            // Compile shaders
            this.programs = ShaderProgramsV8.createAllPrograms(gl);

            // Camera system
            this.camera = new CameraSystem.Camera();

            // State manager
            this.stateManager = new V8StateManager.StateManager();
            this.stateManager.initializeNodes(this.config.nodes.map(n => n.key));

            // Setup callbacks
            this.stateManager.on('onSelect', (key, index, data) => {
                if (this.options.onNodeSelect) {
                    this.options.onNodeSelect(key, data);
                }
            });

            // Render pipeline
            this.pipeline = new RenderPipeline.Pipeline(
                gl,
                this.canvas.width,
                this.canvas.height,
                this.programs
            );

            // Text renderer
            this.textRenderer = new TextRenderer.TextRenderer(gl);

            // Holographic card
            this.holoCard = new HolographicCard.HolographicCard(
                gl,
                this.programs.card,
                this.textRenderer
            );

            // Calculate node 3D positions
            this.nodePositions = this.calculateNodePositions();

            // Particle systems
            this.particleManager = new ParticleSystemsV8.ParticleSystemManager(
                gl,
                this.nodePositions
            );

            // Model matrix for helix (slight tilt)
            this.modelMatrix = mat4.create();
            mat4.identity(this.modelMatrix);
        }

        calculateNodePositions() {
            const { length, radius, frequency } = this.config;
            const positions = [];

            this.config.nodes.forEach((node, i) => {
                const t = node.progress;
                const x = (t - 0.5) * length;
                const strandPhase = (i % 2) * Math.PI;
                const angle = t * frequency * Math.PI * 2 + strandPhase;

                positions.push({
                    key: node.key,
                    label: node.label,
                    progress: t,
                    x: x,
                    y: Math.cos(angle) * radius,
                    z: Math.sin(angle) * radius,
                    index: i
                });
            });

            return positions;
        }

        // ─────────────────────────────────────────────────────────────
        // GEOMETRY CREATION
        // ─────────────────────────────────────────────────────────────

        createGeometry() {
            this.createHelixGeometry();
            this.createNodeGeometry();
        }

        createHelixGeometry() {
            const gl = this.gl;
            const { length, radius, frequency, segments } = this.config;

            // Generate vertices for both strands
            const vertices = [];

            for (let strand = 0; strand < 2; strand++) {
                const phase = strand * Math.PI;

                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const x = (t - 0.5) * length;
                    const angle = t * frequency * Math.PI * 2 + phase;
                    const y = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;

                    // Position, progress, strand
                    vertices.push(x, y, z, t, strand);
                }
            }

            this.helixVertices = new Float32Array(vertices);
            this.helixVertexCount = (segments + 1) * 2;

            this.helixBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.helixBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.helixVertices, gl.STATIC_DRAW);
        }

        createNodeGeometry() {
            const gl = this.gl;

            // Quad for billboard node
            const vertices = new Float32Array([
                // Position    // TexCoord
                -1, -1, 0,     0, 0,
                 1, -1, 0,     1, 0,
                -1,  1, 0,     0, 1,
                 1,  1, 0,     1, 1
            ]);

            this.nodeBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        }

        // ─────────────────────────────────────────────────────────────
        // EVENT HANDLING
        // ─────────────────────────────────────────────────────────────

        setupEventListeners() {
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('click', this.handleClick.bind(this));
            this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
            window.addEventListener('resize', this.handleResize.bind(this));
        }

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hit = this.hitTest(x, y);

            if (hit) {
                this.canvas.style.cursor = 'pointer';
                const cameraState = this.stateManager.handleHover(hit.key, hit.index, hit);
                this.camera.handleHover(hit);

                if (this.options.onHover) {
                    this.options.onHover(hit.key);
                }
            } else {
                this.canvas.style.cursor = 'default';
                this.stateManager.handleHover(null, -1, null);
                this.camera.handleHover(null);

                if (this.options.onHover) {
                    this.options.onHover(null);
                }
            }
        }

        handleClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hit = this.hitTest(x, y);

            if (hit) {
                // Get screen position for ripple
                const screenPos = this.projectToScreen(hit);

                // Get module data from profile
                const moduleData = this.getModuleData(hit.key);

                const result = this.stateManager.handleSelect(
                    hit.key,
                    hit.index,
                    { ...hit, ...moduleData },
                    hit,
                    screenPos
                );

                if (result.cameraState) {
                    this.camera.handleSelect(result.targetNode);
                }

                // Trigger particle effects
                this.particleManager.triggerSelectionEffect(
                    hit.index,
                    hit.progress,
                    performance.now()
                );

                // Show holographic card
                this.holoCard.show(
                    { ...hit, ...moduleData },
                    hit
                );

            } else if (this.stateManager.isSelected()) {
                // Click outside - deselect
                const result = this.stateManager.handleDeselect();
                this.camera.deselect();
                this.holoCard.hide();
            }
        }

        handleMouseLeave() {
            this.stateManager.handleHover(null, -1, null);
            this.camera.handleHover(null);
            this.canvas.style.cursor = 'default';

            if (this.options.onHover) {
                this.options.onHover(null);
            }
        }

        handleResize() {
            this.resize();
        }

        // ─────────────────────────────────────────────────────────────
        // HIT TESTING
        // ─────────────────────────────────────────────────────────────

        hitTest(screenX, screenY) {
            const ray = this.camera.screenToRay(
                screenX, screenY,
                this.canvas.clientWidth,
                this.canvas.clientHeight
            );

            let closest = null;
            let closestDist = Infinity;

            this.nodePositions.forEach(node => {
                const center = vec3.create(node.x, node.y, node.z);
                const dist = this.camera.rayIntersectsSphere(
                    ray,
                    center,
                    this.config.nodeHitRadius
                );

                if (dist !== null && dist < closestDist) {
                    closestDist = dist;
                    closest = node;
                }
            });

            return closest;
        }

        projectToScreen(node) {
            const mvp = this.camera.getViewProjectionMatrix();
            const ndc = MatrixMath.projectToNDC(
                { x: node.x, y: node.y, z: node.z },
                mvp
            );

            return {
                x: (ndc.x + 1) * 0.5 * this.canvas.clientWidth,
                y: (1 - ndc.y) * 0.5 * this.canvas.clientHeight
            };
        }

        getModuleData(key) {
            if (!this.profile || !this.profile.modules) {
                return { title: key, description: '' };
            }

            const module = this.profile.modules[key];
            if (!module) {
                return { title: key, description: '' };
            }

            return {
                label: module.label || key,
                title: module.title || module.label || key,
                description: module.description || module.summary || ''
            };
        }

        // ─────────────────────────────────────────────────────────────
        // RESIZE
        // ─────────────────────────────────────────────────────────────

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = this.canvas.getBoundingClientRect();

            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;

            this.camera.resize(rect.width, rect.height);
            this.pipeline.resize(this.canvas.width, this.canvas.height);
        }

        // ─────────────────────────────────────────────────────────────
        // RENDER LOOP
        // ─────────────────────────────────────────────────────────────

        start() {
            if (this.running) return;

            this.running = true;
            this.lastTime = performance.now();
            this.render();
        }

        stop() {
            this.running = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }

        render() {
            if (!this.running) return;

            const now = performance.now();
            this.deltaTime = (now - this.lastTime) / 1000;
            this.lastTime = now;
            this.time = (now - this.startTime) / 1000;

            // Update systems
            this.camera.update(this.deltaTime);
            this.stateManager.update(this.deltaTime, now);
            this.particleManager.update(this.time, this.deltaTime, now);
            this.holoCard.update(this.deltaTime, this.time);

            // Begin scene pass
            this.pipeline.beginScenePass();

            // Render scene
            this.renderHelix();
            this.renderNodes();
            this.renderParticles();
            this.renderCard();

            // End scene pass
            this.pipeline.endScenePass();

            // Post-processing (bloom)
            this.pipeline.executeBloomPipeline();

            // Request next frame
            this.rafId = requestAnimationFrame(() => this.render());
        }

        // ─────────────────────────────────────────────────────────────
        // RENDER COMPONENTS
        // ─────────────────────────────────────────────────────────────

        renderHelix() {
            const gl = this.gl;
            const program = this.programs.helix;

            if (!program) return;

            gl.useProgram(program);

            // Setup vertex attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.helixBuffer);

            const posLoc = program.attributes.a_position;
            const progLoc = program.attributes.a_progress;
            const strandLoc = program.attributes.a_strand;

            if (posLoc >= 0) {
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);
            }
            if (progLoc >= 0) {
                gl.enableVertexAttribArray(progLoc);
                gl.vertexAttribPointer(progLoc, 1, gl.FLOAT, false, 20, 12);
            }
            if (strandLoc >= 0) {
                gl.enableVertexAttribArray(strandLoc);
                gl.vertexAttribPointer(strandLoc, 1, gl.FLOAT, false, 20, 16);
            }

            // Set uniforms
            const mvp = mat4.create();
            mat4.multiply(mvp, this.camera.getViewProjectionMatrix(), this.modelMatrix);

            gl.uniformMatrix4fv(program.uniforms.u_mvp, false, mvp);
            gl.uniformMatrix4fv(program.uniforms.u_model, false, this.modelMatrix);
            gl.uniform1f(program.uniforms.u_time, this.time);

            // Colors
            gl.uniform3fv(program.uniforms.u_colorFront, this.config.colors.primary);
            gl.uniform3fv(program.uniforms.u_colorBack, this.config.colors.secondary);
            gl.uniform1f(program.uniforms.u_alpha, 0.8);

            // Glow pulse
            const pulse = this.particleManager.getGlowPulse();
            gl.uniform1f(program.uniforms.u_pulsePosition, pulse.position);
            gl.uniform1f(program.uniforms.u_pulseIntensity, pulse.intensity);
            gl.uniform1f(program.uniforms.u_pulseWidth, this.particleManager.getGlowPulseWidth());

            // Background dim
            const effects = this.stateManager.getShaderUniforms();
            gl.uniform1f(program.uniforms.u_backgroundDim, effects.backgroundDim);

            // Draw strands
            const segmentsPerStrand = this.config.segments + 1;

            // Strand 0
            gl.drawArrays(gl.LINE_STRIP, 0, segmentsPerStrand);

            // Strand 1
            gl.drawArrays(gl.LINE_STRIP, segmentsPerStrand, segmentsPerStrand);

            // Cleanup
            if (posLoc >= 0) gl.disableVertexAttribArray(posLoc);
            if (progLoc >= 0) gl.disableVertexAttribArray(progLoc);
            if (strandLoc >= 0) gl.disableVertexAttribArray(strandLoc);
        }

        renderNodes() {
            const gl = this.gl;
            const program = this.programs.node;

            if (!program) return;

            gl.useProgram(program);

            // Setup vertex attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);

            const posLoc = program.attributes.a_position;
            const uvLoc = program.attributes.a_texCoord;

            if (posLoc >= 0) {
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);
            }
            if (uvLoc >= 0) {
                gl.enableVertexAttribArray(uvLoc);
                gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 20, 12);
            }

            // Common uniforms
            const mvp = this.camera.getViewProjectionMatrix();
            gl.uniformMatrix4fv(program.uniforms.u_mvp, false, mvp);
            gl.uniform1f(program.uniforms.u_time, this.time);

            // Draw each node
            this.nodePositions.forEach(node => {
                const state = this.stateManager.getNodeShaderUniforms(node.key);

                gl.uniform3f(program.uniforms.u_nodeCenter, node.x, node.y, node.z);
                gl.uniform1f(program.uniforms.u_scale, this.config.nodeSize * state.scale);
                gl.uniform3fv(program.uniforms.u_color, this.config.colors.primary);
                gl.uniform1f(program.uniforms.u_alpha, state.alpha);
                gl.uniform1f(program.uniforms.u_isSelected, state.isSelected);
                gl.uniform1f(program.uniforms.u_isHovered, state.isHovered);
                gl.uniform1f(program.uniforms.u_isDimmed, state.isDimmed);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            });

            // Cleanup
            if (posLoc >= 0) gl.disableVertexAttribArray(posLoc);
            if (uvLoc >= 0) gl.disableVertexAttribArray(uvLoc);
        }

        renderParticles() {
            const gl = this.gl;
            const program = this.programs.particle;

            if (!program) return;

            const particleCount = this.particleManager.getTotalCount();
            if (particleCount === 0) return;

            gl.useProgram(program);

            // Setup vertex attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleManager.getCombinedBuffer());

            const posLoc = program.attributes.a_position;
            const sizeLoc = program.attributes.a_size;
            const alphaLoc = program.attributes.a_alpha;
            const typeLoc = program.attributes.a_type;

            if (posLoc >= 0) {
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 24, 0);
            }
            if (sizeLoc >= 0) {
                gl.enableVertexAttribArray(sizeLoc);
                gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 24, 12);
            }
            if (alphaLoc >= 0) {
                gl.enableVertexAttribArray(alphaLoc);
                gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 24, 16);
            }
            if (typeLoc >= 0) {
                gl.enableVertexAttribArray(typeLoc);
                gl.vertexAttribPointer(typeLoc, 1, gl.FLOAT, false, 24, 20);
            }

            // Uniforms
            gl.uniformMatrix4fv(program.uniforms.u_mvp, false, this.camera.getViewProjectionMatrix());
            gl.uniform1f(program.uniforms.u_time, this.time);
            gl.uniform1f(program.uniforms.u_pointScale, Math.min(this.canvas.height, 1000));
            gl.uniform3fv(program.uniforms.u_colorAmbient, [0, 0.85, 1]);
            gl.uniform3fv(program.uniforms.u_colorStreak, [0.8, 0.95, 1]);
            gl.uniform3fv(program.uniforms.u_colorSpark, [1, 0.95, 0.7]);

            // Enable blending for particles
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            // Draw points
            gl.drawArrays(gl.POINTS, 0, particleCount);

            // Restore blend mode
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            // Cleanup
            if (posLoc >= 0) gl.disableVertexAttribArray(posLoc);
            if (sizeLoc >= 0) gl.disableVertexAttribArray(sizeLoc);
            if (alphaLoc >= 0) gl.disableVertexAttribArray(alphaLoc);
            if (typeLoc >= 0) gl.disableVertexAttribArray(typeLoc);
        }

        renderCard() {
            if (!this.holoCard.isVisible()) return;

            this.holoCard.render(
                this.camera.getViewProjectionMatrix(),
                this.time
            );
        }

        // ─────────────────────────────────────────────────────────────
        // PUBLIC API
        // ─────────────────────────────────────────────────────────────

        setProfile(profile) {
            this.profile = profile;
        }

        selectNode(key) {
            const node = this.nodePositions.find(n => n.key === key);
            if (node) {
                const moduleData = this.getModuleData(key);
                const screenPos = this.projectToScreen(node);

                const result = this.stateManager.handleSelect(
                    key,
                    node.index,
                    { ...node, ...moduleData },
                    node,
                    screenPos
                );

                if (result.cameraState) {
                    this.camera.handleSelect(result.targetNode);
                }

                this.holoCard.show({ ...node, ...moduleData }, node);
            }
        }

        deselectNode() {
            this.stateManager.handleDeselect();
            this.camera.deselect();
            this.holoCard.hide();
        }

        getSelectedNodeKey() {
            return this.stateManager.getSelectedNodeKey();
        }

        getNodePositions() {
            return this.nodePositions;
        }

        // ─────────────────────────────────────────────────────────────
        // CLEANUP
        // ─────────────────────────────────────────────────────────────

        destroy() {
            this.stop();

            const gl = this.gl;

            // Cleanup geometry
            if (this.helixBuffer) gl.deleteBuffer(this.helixBuffer);
            if (this.nodeBuffer) gl.deleteBuffer(this.nodeBuffer);

            // Cleanup systems
            if (this.pipeline) this.pipeline.destroy();
            if (this.particleManager) this.particleManager.destroy();
            if (this.textRenderer) this.textRenderer.destroy();
            if (this.holoCard) this.holoCard.destroy();

            // Remove event listeners
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
            window.removeEventListener('resize', this.handleResize);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // FEATURE DETECTION
    // ═══════════════════════════════════════════════════════════════

    function isSupported() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        HelixRenderer: HelixRendererV8,
        CONFIG: HELIX_CONFIG,
        isSupported
    };

})();

// Export for global access
window.HelixWebGLV8 = HelixWebGLV8;
