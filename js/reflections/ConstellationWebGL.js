// ============================================================
// MEMORY CONSTELLATION - WebGL 3D Orb Renderer
// Floating memory orbs representing past conversations
// ============================================================

// Memory Constellation v7 - Holographic Memory Bubbles

const ConstellationWebGL = (function() {
    'use strict';

    const { vec3, mat4, degToRad, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CONSTELLATION CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const CONFIG = {
        // Orb sizing
        minRadius: 0.12,
        maxRadius: 0.35,

        // Layout
        spreadRadius: 2.5,

        // Holographic Memory Orb Colors (RGBA)
        colors: {
            recent: [0.25, 0.55, 0.95, 0.65],     // Sapphire blue (< 7 days)
            moderate: [0.55, 0.35, 0.92, 0.6],    // Amethyst purple (7-30 days)
            older: [0.38, 0.48, 0.68, 0.5],       // Moonstone gray-blue (> 30 days)
            hover: [0.7, 0.9, 1.0, 0.85],         // Bright cyan on hover
            glow: [0.25, 0.55, 0.9, 0.3]          // Soft blue aura
        },

        // Camera
        camera: {
            distance: 5.0,
            minDistance: 2.5,
            maxDistance: 8.0,
            autoRotateSpeed: 0.05,
            dragSensitivity: 0.005
        },

        // Animation
        pulseSpeed: 1.5,
        hoverScale: 1.15
    };

    // ═══════════════════════════════════════════════════════════════
    // SHADER SOURCE
    // ═══════════════════════════════════════════════════════════════

    const SHADERS = {
        // ═══════════════════════════════════════════════════════════════
        // HOLOGRAPHIC MEMORY ORB SHADER
        // Features: Dark interior, energy rim glow, scan lines, clean Fresnel
        // ═══════════════════════════════════════════════════════════════
        orb: {
            vertex: `
                attribute vec3 aPosition;
                attribute vec3 aNormal;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform mat4 uModel;
                uniform float uScale;
                uniform float uTime;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPos;

                void main() {
                    // Subtle breathing animation
                    float breathe = 1.0 + sin(uTime * 0.8) * 0.008;
                    vec3 pos = aPosition * breathe;

                    vec4 worldPos = uModel * vec4(pos * uScale, 1.0);
                    vPosition = pos;
                    vWorldPos = worldPos.xyz;
                    vNormal = normalize(mat3(uModel) * aNormal);

                    gl_Position = uProjection * uView * worldPos;
                }
            `,
            fragment: `
                precision highp float;

                uniform vec4 uColor;
                uniform vec3 uCameraPos;
                uniform float uTime;
                uniform float uHover;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPos;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(uCameraPos - vWorldPos);
                    float NdotV = max(dot(normal, viewDir), 0.0);

                    // === FRESNEL (clean, no iridescence) ===
                    float fresnel = pow(1.0 - NdotV, 3.0);

                    // === ENERGY FIELD GLOW ===
                    float energyPulse = sin(uTime * 1.2) * 0.5 + 0.5;
                    vec3 energyColor1 = vec3(0.2, 0.6, 1.0);  // Cyan
                    vec3 energyColor2 = vec3(0.5, 0.3, 0.9);  // Purple
                    vec3 energyColor = mix(energyColor1, energyColor2, energyPulse);

                    // === HOLOGRAPHIC SCAN LINES ===
                    float scanY = vWorldPos.y * 40.0 + uTime * 3.0;
                    float scanline = smoothstep(0.4, 0.5, fract(scanY)) * 0.08;

                    // === CHROMATIC DISPERSION (subtle at edges) ===
                    float dispersion = fresnel * 0.06;
                    vec3 chromatic = vec3(dispersion, 0.0, -dispersion);

                    // === SPECULAR HIGHLIGHT ===
                    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
                    vec3 halfVec = normalize(lightDir + viewDir);
                    float spec = pow(max(dot(normal, halfVec), 0.0), 64.0);

                    // === DARK INTERIOR with rim glow ===
                    vec3 coreColor = vec3(0.02, 0.04, 0.08); // Very dark blue-black
                    vec3 rimGlow = energyColor * fresnel * 0.7;

                    // === COMBINE ===
                    vec3 color = coreColor;
                    color += rimGlow;
                    color += chromatic;
                    color += energyColor * scanline;
                    color += vec3(0.9, 0.95, 1.0) * spec * 0.5;

                    // === HOVER ENHANCEMENT ===
                    color += energyColor * fresnel * uHover * 0.4;
                    color += vec3(0.1, 0.2, 0.3) * uHover * 0.2;

                    // === ALPHA (transparent center, solid edge) ===
                    float alpha = 0.15 + fresnel * 0.6;
                    alpha += spec * 0.1;
                    alpha = mix(alpha, min(alpha + 0.2, 0.9), uHover);

                    gl_FragColor = vec4(color, alpha);
                }
            `
        },

        glow: {
            vertex: `
                attribute vec3 aPosition;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform vec3 uCenter;
                uniform float uRadius;

                varying vec2 vUV;

                void main() {
                    // Billboard quad facing camera
                    vec4 viewPos = uView * vec4(uCenter, 1.0);
                    viewPos.xy += aPosition.xy * uRadius * 2.5;
                    vUV = aPosition.xy + 0.5;
                    gl_Position = uProjection * viewPos;
                }
            `,
            fragment: `
                precision mediump float;

                uniform vec4 uColor;
                uniform float uHover;

                varying vec2 vUV;

                void main() {
                    vec2 center = vec2(0.5);
                    float dist = length(vUV - center) * 2.0;

                    // Soft radial gradient
                    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
                    glow = pow(glow, 2.0);

                    // Hover intensity
                    float intensity = 0.15 + uHover * 0.25;

                    gl_FragColor = vec4(uColor.rgb, glow * intensity);
                }
            `
        },

        particle: {
            vertex: `
                attribute vec3 aPosition;
                attribute float aAlpha;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform float uPointSize;

                varying float vAlpha;

                void main() {
                    vAlpha = aAlpha;
                    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
                    gl_PointSize = uPointSize * (1.0 / gl_Position.w);
                }
            `,
            fragment: `
                precision mediump float;

                uniform vec4 uColor;
                varying float vAlpha;

                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center) * 2.0;
                    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
                    gl_FragColor = vec4(uColor.rgb, alpha * vAlpha * uColor.a);
                }
            `
        },

        // ═══════════════════════════════════════════════════════════════
        // TEXT LABEL SHADER (Billboard)
        // ═══════════════════════════════════════════════════════════════
        textLabel: {
            vertex: `
                attribute vec2 aPosition;
                attribute vec2 aTexCoord;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform vec3 uCenter;
                uniform float uScale;
                uniform float uAspect;

                varying vec2 vTexCoord;

                void main() {
                    // Billboard: position in view space, always faces camera
                    vec4 viewCenter = uView * vec4(uCenter, 1.0);

                    // Offset in view space
                    vec2 offset = aPosition * uScale;
                    offset.x *= uAspect;
                    viewCenter.xy += offset;

                    gl_Position = uProjection * viewCenter;
                    vTexCoord = aTexCoord;
                }
            `,
            fragment: `
                precision mediump float;

                uniform sampler2D uTexture;
                uniform float uOpacity;
                uniform vec3 uGlowColor;

                varying vec2 vTexCoord;

                void main() {
                    vec4 texColor = texture2D(uTexture, vTexCoord);

                    // Text with subtle glow
                    float textAlpha = texColor.a;

                    // Glow effect
                    float glowAlpha = smoothstep(0.0, 0.4, textAlpha) * 0.2;
                    vec3 color = mix(uGlowColor, texColor.rgb, step(0.1, textAlpha));

                    float alpha = max(textAlpha, glowAlpha) * uOpacity;

                    if (alpha < 0.01) discard;

                    gl_FragColor = vec4(color, alpha);
                }
            `
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // SPHERE GEOMETRY
    // ═══════════════════════════════════════════════════════════════

    function createSphereGeometry(segments = 24, rings = 16) {
        const positions = [];
        const normals = [];
        const indices = [];

        for (let ring = 0; ring <= rings; ring++) {
            const theta = (ring / rings) * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let seg = 0; seg <= segments; seg++) {
                const phi = (seg / segments) * Math.PI * 2;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                positions.push(x, y, z);
                normals.push(x, y, z);
            }
        }

        for (let ring = 0; ring < rings; ring++) {
            for (let seg = 0; seg < segments; seg++) {
                const a = ring * (segments + 1) + seg;
                const b = a + segments + 1;

                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }

        return { positions, normals, indices };
    }

    // ═══════════════════════════════════════════════════════════════
    // QUAD GEOMETRY (for glow billboards)
    // ═══════════════════════════════════════════════════════════════

    function createQuadGeometry() {
        return {
            positions: [
                -0.5, -0.5, 0,
                 0.5, -0.5, 0,
                 0.5,  0.5, 0,
                -0.5,  0.5, 0
            ],
            indices: [0, 1, 2, 0, 2, 3]
        };
    }

    // Text label quad with UVs
    function createTextQuadGeometry() {
        return {
            positions: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
            texCoords: [0, 1, 1, 1, 1, 0, 0, 0],
            indices: [0, 1, 2, 0, 2, 3]
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // MEMORY CONTENT RENDERER
    // High-quality canvas-based content textures with DPI scaling
    // Renders title + excerpt inside orbs
    // ═══════════════════════════════════════════════════════════════

    class MemoryContentRenderer {
        constructor(gl) {
            this.gl = gl;
            this.cache = new Map();
            this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }

        createContent(conversation, id) {
            if (this.cache.has(id)) {
                return this.cache.get(id);
            }

            const gl = this.gl;
            const ctx = this.ctx;
            const dpr = this.dpr;

            // High-resolution canvas (256x256 base, scaled by DPI)
            const baseSize = 256;
            const size = baseSize * dpr;
            this.canvas.width = size;
            this.canvas.height = size;

            // Clear with transparent
            ctx.clearRect(0, 0, size, size);

            // Font settings
            const fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
            const titleSize = Math.round(16 * dpr);
            const excerptSize = Math.round(11 * dpr);
            const lineHeight = 1.4;
            const padding = 20 * dpr;
            const maxWidth = size - padding * 2;

            // Get title and excerpt
            const title = conversation.title || 'Memory';
            const excerpt = this.getExcerpt(conversation);

            // === DRAW TITLE ===
            ctx.font = `600 ${titleSize}px ${fontFamily}`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const titleY = size * 0.28;
            const titleLines = this.wrapText(ctx, title, maxWidth, 2);
            let currentY = titleY;

            for (const line of titleLines) {
                ctx.fillText(line, size / 2, currentY);
                currentY += titleSize * lineHeight;
            }

            // === DRAW EXCERPT ===
            if (excerpt) {
                ctx.font = `400 ${excerptSize}px ${fontFamily}`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

                const excerptY = currentY + 8 * dpr;
                const excerptLines = this.wrapText(ctx, excerpt, maxWidth * 0.95, 3);
                currentY = excerptY;

                for (const line of excerptLines) {
                    ctx.fillText(line, size / 2, currentY);
                    currentY += excerptSize * lineHeight;
                }
            }

            // === CREATE TEXTURE ===
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);

            // High-quality filtering with mipmaps
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            const contentData = {
                texture,
                width: size,
                height: size,
                aspectRatio: 1.0
            };

            this.cache.set(id, contentData);
            return contentData;
        }

        getExcerpt(conversation) {
            // Try to get preview/summary from conversation
            if (conversation.summary) return conversation.summary;
            if (conversation.preview) return conversation.preview;

            // Fallback: use message count info
            const count = conversation.message_count || 0;
            if (count > 0) {
                return `${count} exchange${count !== 1 ? 's' : ''} in this conversation`;
            }
            return '';
        }

        wrapText(ctx, text, maxWidth, maxLines) {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;

                    if (lines.length >= maxLines) {
                        // Truncate last line with ellipsis
                        let lastLine = lines[lines.length - 1];
                        while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 1) {
                            lastLine = lastLine.slice(0, -1);
                        }
                        lines[lines.length - 1] = lastLine + '...';
                        return lines;
                    }
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine && lines.length < maxLines) {
                lines.push(currentLine);
            }

            return lines;
        }

        destroy() {
            const gl = this.gl;
            for (const data of this.cache.values()) {
                gl.deleteTexture(data.texture);
            }
            this.cache.clear();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN RENDERER CLASS
    // ═══════════════════════════════════════════════════════════════

    class ConstellationRenderer {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.options = options;
            this.config = { ...CONFIG };

            // WebGL context
            this.gl = canvas.getContext('webgl', {
                alpha: true,
                antialias: true,
                premultipliedAlpha: false
            });

            if (!this.gl) {
                console.error('WebGL not supported');
                return;
            }

            // Time
            this.startTime = performance.now();
            this.time = 0;

            // Camera state
            this.cameraAngleX = 0;
            this.cameraAngleY = 0.3;
            this.cameraDistance = this.config.camera.distance;
            this.targetAngleX = 0;
            this.targetAngleY = 0.3;
            this.autoRotate = true;

            // Interaction state
            this.isDragging = false;
            this.lastMouseX = 0;
            this.lastMouseY = 0;
            this.hoveredOrb = null;

            // Orbs data
            this.orbs = [];

            // Running state
            this.running = false;
            this.rafId = null;

            // Initialize
            this.initializeGL();
            this.setupEventListeners();
            this.resize();
        }

        // ─────────────────────────────────────────────────────────────
        // INITIALIZATION
        // ─────────────────────────────────────────────────────────────

        initializeGL() {
            const gl = this.gl;

            // Compile shaders
            this.programs = {};
            for (const [name, source] of Object.entries(SHADERS)) {
                this.programs[name] = this.createProgram(source.vertex, source.fragment);
            }

            // Create geometry buffers
            const sphere = createSphereGeometry();
            this.sphereBuffers = {
                position: this.createBuffer(new Float32Array(sphere.positions)),
                normal: this.createBuffer(new Float32Array(sphere.normals)),
                index: this.createIndexBuffer(new Uint16Array(sphere.indices)),
                count: sphere.indices.length
            };

            const quad = createQuadGeometry();
            this.quadBuffers = {
                position: this.createBuffer(new Float32Array(quad.positions)),
                index: this.createIndexBuffer(new Uint16Array(quad.indices)),
                count: quad.indices.length
            };

            // Text quad buffers (for labels)
            const textQuad = createTextQuadGeometry();
            this.textQuadBuffers = {
                position: this.createBuffer(new Float32Array(textQuad.positions)),
                texCoord: this.createBuffer(new Float32Array(textQuad.texCoords)),
                index: this.createIndexBuffer(new Uint16Array(textQuad.indices)),
                count: textQuad.indices.length
            };

            // Memory content renderer (high-quality text inside orbs)
            this.contentRenderer = new MemoryContentRenderer(gl);

            // Create particle system
            this.initParticles(200);

            // Matrices
            this.projectionMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelMatrix = mat4.create();

            // GL state
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
        }

        createProgram(vertexSrc, fragmentSrc) {
            const gl = this.gl;

            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vertexSrc);
            gl.compileShader(vs);
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
                console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
            }

            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fragmentSrc);
            gl.compileShader(fs);
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
                console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
            }

            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Shader link error:', gl.getProgramInfoLog(program));
            }

            return program;
        }

        createBuffer(data) {
            const gl = this.gl;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return buffer;
        }

        createIndexBuffer(data) {
            const gl = this.gl;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return buffer;
        }

        initParticles(count) {
            const positions = [];
            const alphas = [];

            for (let i = 0; i < count; i++) {
                // Random position in sphere
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = this.config.spreadRadius * (0.5 + Math.random() * 1.0);

                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
                alphas.push(0.2 + Math.random() * 0.5);
            }

            this.particleBuffers = {
                position: this.createBuffer(new Float32Array(positions)),
                alpha: this.createBuffer(new Float32Array(alphas)),
                count: count
            };
        }

        // ─────────────────────────────────────────────────────────────
        // DATA MANAGEMENT
        // ─────────────────────────────────────────────────────────────

        setConversations(conversations) {
            this.orbs = this.positionOrbs(conversations);

            // Create content textures for each orb
            if (this.contentRenderer) {
                for (const orb of this.orbs) {
                    orb.content = this.contentRenderer.createContent(
                        orb.conversation,
                        orb.conversation.id
                    );
                }
            }
        }

        positionOrbs(conversations) {
            if (!conversations || conversations.length === 0) return [];

            return conversations.map((conv, i) => {
                const total = conversations.length;

                // Golden ratio spiral distribution
                const phi = Math.acos(1 - 2 * (i + 0.5) / total);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;

                // Randomized radius for organic feel
                const r = this.config.spreadRadius * (0.7 + Math.random() * 0.3);

                const position = [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                ];

                return {
                    conversation: conv,
                    position: position,
                    radius: this.getOrbRadius(conv.message_count || 1),
                    color: this.getOrbColor(conv.created_at),
                    hover: 0
                };
            });
        }

        getOrbRadius(messageCount) {
            const { minRadius, maxRadius } = this.config;
            const scale = Math.sqrt(messageCount) * 0.03;
            return Math.min(minRadius + scale, maxRadius);
        }

        getOrbColor(createdAt) {
            const { colors } = this.config;
            const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

            if (ageInDays < 7) return colors.recent;
            if (ageInDays < 30) return colors.moderate;
            return colors.older;
        }

        // ─────────────────────────────────────────────────────────────
        // CAMERA & INTERACTION
        // ─────────────────────────────────────────────────────────────

        setupEventListeners() {
            const canvas = this.canvas;

            canvas.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.autoRotate = false;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
            });

            window.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    const dx = e.clientX - this.lastMouseX;
                    const dy = e.clientY - this.lastMouseY;

                    this.targetAngleX += dx * this.config.camera.dragSensitivity;
                    this.targetAngleY += dy * this.config.camera.dragSensitivity;
                    this.targetAngleY = Math.max(-1.2, Math.min(1.2, this.targetAngleY));

                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;
                } else {
                    this.updateHover(e);
                }
            });

            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const { minDistance, maxDistance } = this.config.camera;
                this.cameraDistance += e.deltaY * 0.01;
                this.cameraDistance = Math.max(minDistance, Math.min(maxDistance, this.cameraDistance));
            });

            canvas.addEventListener('click', (e) => {
                if (this.hoveredOrb && this.options.onOrbClick) {
                    this.options.onOrbClick(this.hoveredOrb.conversation);
                }
            });

            // Touch support
            canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this.isDragging = true;
                    this.autoRotate = false;
                    this.lastMouseX = e.touches[0].clientX;
                    this.lastMouseY = e.touches[0].clientY;
                }
            });

            canvas.addEventListener('touchmove', (e) => {
                if (this.isDragging && e.touches.length === 1) {
                    const dx = e.touches[0].clientX - this.lastMouseX;
                    const dy = e.touches[0].clientY - this.lastMouseY;

                    this.targetAngleX += dx * this.config.camera.dragSensitivity;
                    this.targetAngleY += dy * this.config.camera.dragSensitivity;
                    this.targetAngleY = Math.max(-1.2, Math.min(1.2, this.targetAngleY));

                    this.lastMouseX = e.touches[0].clientX;
                    this.lastMouseY = e.touches[0].clientY;
                }
            });

            canvas.addEventListener('touchend', () => {
                this.isDragging = false;
            });
        }

        updateHover(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Simple ray casting
            const ray = this.screenToRay(x, y);
            let closest = null;
            let closestDist = Infinity;

            for (const orb of this.orbs) {
                const dist = this.rayOrbIntersect(ray, orb);
                if (dist !== null && dist < closestDist) {
                    closestDist = dist;
                    closest = orb;
                }
            }

            // Update hover state
            const prevHovered = this.hoveredOrb;
            this.hoveredOrb = closest;

            if (closest !== prevHovered) {
                this.canvas.style.cursor = closest ? 'pointer' : 'grab';

                if (this.options.onOrbHover) {
                    this.options.onOrbHover(closest ? closest.conversation : null);
                }
            }
        }

        screenToRay(x, y) {
            // Combine view and projection matrices
            const viewProjMatrix = mat4.create();
            mat4.multiply(viewProjMatrix, this.projectionMatrix, this.viewMatrix);

            // Invert combined matrix
            const invViewProj = mat4.create();
            mat4.invert(invViewProj, viewProjMatrix);

            // Use MatrixMath.unprojectRay which returns {origin: {x,y,z}, direction: {x,y,z}}
            return MatrixMath.unprojectRay(x, y, invViewProj);
        }

        rayOrbIntersect(ray, orb) {
            // Ray-sphere intersection using {x,y,z} objects
            const orbCenter = {
                x: orb.position[0],
                y: orb.position[1],
                z: orb.position[2]
            };

            const oc = vec3.subtract(ray.origin, orbCenter);
            const a = vec3.dot(ray.direction, ray.direction);
            const b = 2 * vec3.dot(oc, ray.direction);
            const c = vec3.dot(oc, oc) - orb.radius * orb.radius;
            const discriminant = b * b - 4 * a * c;

            if (discriminant < 0) return null;

            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            return t > 0 ? t : null;
        }

        // ─────────────────────────────────────────────────────────────
        // RENDERING
        // ─────────────────────────────────────────────────────────────

        resize() {
            const canvas = this.canvas;
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width * dpr;
            const height = rect.height * dpr;

            if (width === 0 || height === 0) {
                console.warn('Constellation: Canvas has zero dimensions!');
                return;
            }

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                this.gl.viewport(0, 0, width, height);

                // Update projection
                const aspect = width / height;
                mat4.perspective(this.projectionMatrix, degToRad(45), aspect, 0.1, 100);
            }
        }

        updateCamera(deltaTime) {
            // Auto rotate when not interacting
            if (this.autoRotate && !this.isDragging) {
                this.targetAngleX += this.config.camera.autoRotateSpeed * deltaTime;
            }

            // Smooth camera movement
            this.cameraAngleX = lerp(this.cameraAngleX, this.targetAngleX, 0.1);
            this.cameraAngleY = lerp(this.cameraAngleY, this.targetAngleY, 0.1);

            // Calculate camera position
            const camX = Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraDistance;
            const camY = Math.sin(this.cameraAngleY) * this.cameraDistance;
            const camZ = Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraDistance;

            // MatrixMath expects {x,y,z} objects, not arrays!
            this.cameraPosition = [camX, camY, camZ];
            const eye = { x: camX, y: camY, z: camZ };
            const center = { x: 0, y: 0, z: 0 };
            const up = { x: 0, y: 1, z: 0 };

            mat4.lookAt(this.viewMatrix, eye, center, up);
        }

        render() {
            const gl = this.gl;
            const now = performance.now();
            const deltaTime = (now - (this.lastTime || now)) / 1000;
            this.lastTime = now;
            this.time = (now - this.startTime) / 1000;

            this.resize();
            this.updateCamera(deltaTime);

            // Clear to transparent
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Update hover animations
            for (const orb of this.orbs) {
                const targetHover = orb === this.hoveredOrb ? 1 : 0;
                orb.hover = lerp(orb.hover, targetHover, 0.15);
            }

            // Draw particles (background)
            this.renderParticles();

            // Draw orb glows (additive, behind orbs)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
            this.renderGlows();

            // Draw content INSIDE orbs (before shells, no depth write)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.renderContent();

            // Draw holographic orb shells (with depth)
            gl.depthMask(true);
            this.renderOrbs();
        }

        renderOrbs() {
            const gl = this.gl;
            const program = this.programs.orb;

            if (!program) {
                console.error('No orb program!');
                return;
            }

            gl.useProgram(program);

            // Get attribute locations
            const posLoc = gl.getAttribLocation(program, 'aPosition');
            const normLoc = gl.getAttribLocation(program, 'aNormal');

            // Bind geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereBuffers.position);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereBuffers.normal);
            gl.enableVertexAttribArray(normLoc);
            gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereBuffers.index);

            // Set uniforms
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, this.projectionMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, this.viewMatrix);
            gl.uniform3fv(gl.getUniformLocation(program, 'uCameraPos'), this.cameraPosition);
            gl.uniform1f(gl.getUniformLocation(program, 'uTime'), this.time);

            // Draw orbs
            for (const orb of this.orbs) {
                // MatrixMath.mat4.translate takes (out, {x,y,z})
                const pos = { x: orb.position[0], y: orb.position[1], z: orb.position[2] };
                mat4.translate(this.modelMatrix, pos);

                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, this.modelMatrix);
                gl.uniform1f(gl.getUniformLocation(program, 'uScale'), orb.radius);
                gl.uniform1f(gl.getUniformLocation(program, 'uHover'), orb.hover);
                gl.uniform4fv(gl.getUniformLocation(program, 'uColor'), orb.color);

                gl.drawElements(gl.TRIANGLES, this.sphereBuffers.count, gl.UNSIGNED_SHORT, 0);
            }
        }

        renderGlows() {
            const gl = this.gl;
            const program = this.programs.glow;

            gl.useProgram(program);

            const posLoc = gl.getAttribLocation(program, 'aPosition');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffers.position);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadBuffers.index);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, this.projectionMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, this.viewMatrix);

            for (const orb of this.orbs) {
                gl.uniform3fv(gl.getUniformLocation(program, 'uCenter'), orb.position);
                gl.uniform1f(gl.getUniformLocation(program, 'uRadius'), orb.radius);
                gl.uniform1f(gl.getUniformLocation(program, 'uHover'), orb.hover);
                gl.uniform4fv(gl.getUniformLocation(program, 'uColor'), this.config.colors.glow);

                gl.drawElements(gl.TRIANGLES, this.quadBuffers.count, gl.UNSIGNED_SHORT, 0);
            }
        }

        renderParticles() {
            const gl = this.gl;
            const program = this.programs.particle;

            gl.useProgram(program);

            const posLoc = gl.getAttribLocation(program, 'aPosition');
            const alphaLoc = gl.getAttribLocation(program, 'aAlpha');

            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffers.position);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffers.alpha);
            gl.enableVertexAttribArray(alphaLoc);
            gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, this.projectionMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, this.viewMatrix);
            gl.uniform1f(gl.getUniformLocation(program, 'uPointSize'), 50);
            gl.uniform4fv(gl.getUniformLocation(program, 'uColor'), [0.3, 0.5, 0.8, 0.15]);

            gl.drawArrays(gl.POINTS, 0, this.particleBuffers.count);
        }

        renderContent() {
            const gl = this.gl;
            const program = this.programs.textLabel;

            if (!program) return;

            // Check if any orb is being hovered
            const hoveredOrbs = this.orbs.filter(orb => orb.hover > 0.1 && orb.content);
            if (hoveredOrbs.length === 0) return;

            gl.useProgram(program);

            // Get attribute locations
            const posLoc = gl.getAttribLocation(program, 'aPosition');
            const texLoc = gl.getAttribLocation(program, 'aTexCoord');

            // Bind geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textQuadBuffers.position);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.textQuadBuffers.texCoord);
            gl.enableVertexAttribArray(texLoc);
            gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.textQuadBuffers.index);

            // Set shared uniforms
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, this.projectionMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, this.viewMatrix);
            gl.uniform3fv(gl.getUniformLocation(program, 'uGlowColor'), [0.3, 0.6, 1.0]);

            // Draw content for hovered orbs (INSIDE the orb)
            for (const orb of hoveredOrbs) {
                // Position content AT orb center (inside the bubble)
                const contentCenter = orb.position;

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, orb.content.texture);
                gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

                gl.uniform3fv(gl.getUniformLocation(program, 'uCenter'), contentCenter);
                // Scale to fit inside orb (70% of diameter)
                gl.uniform1f(gl.getUniformLocation(program, 'uScale'), orb.radius * 1.4);
                gl.uniform1f(gl.getUniformLocation(program, 'uAspect'), orb.content.aspectRatio);
                gl.uniform1f(gl.getUniformLocation(program, 'uOpacity'), orb.hover);

                gl.drawElements(gl.TRIANGLES, this.textQuadBuffers.count, gl.UNSIGNED_SHORT, 0);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // LIFECYCLE
        // ─────────────────────────────────────────────────────────────

        start() {
            if (this.running) return;
            this.running = true;

            const loop = () => {
                if (!this.running) return;
                this.render();
                this.rafId = requestAnimationFrame(loop);
            };
            loop();
        }

        stop() {
            this.running = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }

        destroy() {
            this.stop();
            // Cleanup WebGL resources
            if (this.contentRenderer) {
                this.contentRenderer.destroy();
                this.contentRenderer = null;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        ConstellationRenderer,
        CONFIG
    };

})();
