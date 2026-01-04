// ============================================================
// MEMORY CONSTELLATION - WebGL 3D Orb Renderer
// Floating memory orbs representing past conversations
// ============================================================

console.log('=== CONSTELLATION v5 LOADED ===');

const ConstellationWebGL = (function() {
    'use strict';

    const { vec3, mat4, degToRad, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CONSTELLATION CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const CONFIG = {
        // Orb sizing - TESTING: Made huge for visibility
        minRadius: 0.3,
        maxRadius: 0.8,

        // Layout
        spreadRadius: 2.5,

        // Colors (RGBA) - TESTING: Made fully opaque and bright
        colors: {
            recent: [1.0, 0.2, 0.2, 1.0],         // BRIGHT RED for testing
            moderate: [0.2, 1.0, 0.2, 1.0],       // BRIGHT GREEN for testing
            older: [0.2, 0.2, 1.0, 1.0],          // BRIGHT BLUE for testing
            hover: [1.0, 1.0, 0.0, 1.0],          // YELLOW on hover
            glow: [1.0, 1.0, 1.0, 0.5]            // White glow
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
        orb: {
            vertex: `
                attribute vec3 aPosition;
                attribute vec3 aNormal;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform mat4 uModel;
                uniform float uScale;

                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    vec4 worldPos = uModel * vec4(aPosition * uScale, 1.0);
                    vPosition = worldPos.xyz;
                    vNormal = mat3(uModel) * aNormal;
                    gl_Position = uProjection * uView * worldPos;
                }
            `,
            fragment: `
                precision mediump float;

                uniform vec4 uColor;
                uniform vec3 uCameraPos;
                uniform float uTime;
                uniform float uHover;

                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(uCameraPos - vPosition);

                    // Fresnel effect for glass-like edge glow
                    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

                    // Inner glow gradient
                    float innerGlow = 0.6 + 0.4 * max(dot(normal, viewDir), 0.0);

                    // Pulse animation
                    float pulse = 0.9 + 0.1 * sin(uTime * 2.0);

                    // Hover brightness boost
                    float hoverBoost = 1.0 + uHover * 0.4;

                    // Combine effects
                    vec3 color = uColor.rgb * innerGlow * pulse * hoverBoost;
                    color += vec3(0.3, 0.6, 1.0) * fresnel * 0.5;

                    float alpha = uColor.a * (0.7 + fresnel * 0.3);

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
            console.log('Constellation: Setting conversations:', conversations?.length);
            this.orbs = this.positionOrbs(conversations);
            console.log('Constellation: Created orbs:', this.orbs.length, this.orbs.slice(0, 2));
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
            // Unproject screen coordinates to ray
            const invProj = mat4.create();
            mat4.invert(invProj, this.projectionMatrix);

            const invView = mat4.create();
            mat4.invert(invView, this.viewMatrix);

            // Near plane point
            const nearPoint = [x, y, -1, 1];
            const worldNear = [];
            mat4.transformVec4(worldNear, invProj, nearPoint);
            worldNear[0] /= worldNear[3];
            worldNear[1] /= worldNear[3];
            worldNear[2] /= worldNear[3];
            mat4.transformVec4(worldNear, invView, [...worldNear.slice(0, 3), 1]);

            // Far plane point
            const farPoint = [x, y, 1, 1];
            const worldFar = [];
            mat4.transformVec4(worldFar, invProj, farPoint);
            worldFar[0] /= worldFar[3];
            worldFar[1] /= worldFar[3];
            worldFar[2] /= worldFar[3];
            mat4.transformVec4(worldFar, invView, [...worldFar.slice(0, 3), 1]);

            const origin = worldNear.slice(0, 3);
            const direction = vec3.normalize([], vec3.subtract([], worldFar.slice(0, 3), origin));

            return { origin, direction };
        }

        rayOrbIntersect(ray, orb) {
            // Ray-sphere intersection
            const oc = vec3.subtract([], ray.origin, orb.position);
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

            if (!this._resizeLogged) {
                console.log('Constellation resize:', { width, height, orbCount: this.orbs.length });
                this._resizeLogged = true;
            }

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

            // Log once
            if (!this._renderLogOnce) {
                console.log('Constellation render():', {
                    orbs: this.orbs.length,
                    cameraPos: this.cameraPosition,
                    glError: gl.getError()
                });
                this._renderLogOnce = true;
            }

            // Clear - BRIGHT MAGENTA to prove WebGL works
            gl.clearColor(1.0, 0.0, 1.0, 1.0);
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

            // Draw orbs
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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

            // Check attribute locations
            const posLoc = gl.getAttribLocation(program, 'aPosition');
            const normLoc = gl.getAttribLocation(program, 'aNormal');

            if (!this._loggedOnce) {
                console.log('Orb shader attribs:', { posLoc, normLoc });
                console.log('Matrices:', {
                    proj: this.projectionMatrix?.slice(0, 4),
                    view: this.viewMatrix?.slice(0, 4),
                    camPos: this.cameraPosition
                });
                this._loggedOnce = true;
            }

            if (posLoc === -1 || normLoc === -1) {
                console.error('Invalid attribute locations!');
                return;
            }

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

            // Draw ONE test orb at origin first
            mat4.identity(this.modelMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, this.modelMatrix);
            gl.uniform1f(gl.getUniformLocation(program, 'uScale'), 1.0); // Big sphere
            gl.uniform1f(gl.getUniformLocation(program, 'uHover'), 0);
            gl.uniform4fv(gl.getUniformLocation(program, 'uColor'), [1, 1, 1, 1]); // White

            gl.drawElements(gl.TRIANGLES, this.sphereBuffers.count, gl.UNSIGNED_SHORT, 0);

            // Now draw actual orbs
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
            // Cleanup WebGL resources if needed
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
