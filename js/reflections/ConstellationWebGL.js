// ============================================================
// MEMORY CONSTELLATION - WebGL 3D Orb Renderer
// Premium 2025-quality holographic memory bubbles
// ============================================================

// Memory Constellation v8 - Next-Gen Holographic Memory Orbs
// Features: Icosphere geometry, PBR glass shader, environment mapping, bloom post-processing

const ConstellationWebGL = (function() {
    'use strict';

    const { vec3, mat4, degToRad, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CONSTELLATION CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const CONFIG = {
        // Orb sizing
        minRadius: 0.15,
        maxRadius: 0.4,

        // Layout - Timeline spiral
        centerRadius: 0.5,      // Recent conversations near center
        maxSpiralRadius: 3.0,   // Older conversations spiral outward
        spiralTurns: 2.5,       // Number of spiral rotations

        // Premium Holographic Colors (RGBA)
        colors: {
            recent: [0.3, 0.65, 1.0, 0.7],        // Bright azure (< 7 days)
            moderate: [0.6, 0.4, 0.95, 0.65],     // Vivid amethyst (7-30 days)
            older: [0.45, 0.55, 0.75, 0.55],      // Cool silver-blue (> 30 days)
            hover: [0.8, 0.95, 1.0, 0.9],         // Brilliant white-cyan on hover
            glow: [0.3, 0.6, 0.95, 0.35],         // Soft blue aura
            energy: [0.2, 0.7, 1.0, 1.0]          // Energy pulse color
        },

        // Camera
        camera: {
            distance: 5.5,
            minDistance: 2.5,
            maxDistance: 10.0,
            autoRotateSpeed: 0.03,
            dragSensitivity: 0.005
        },

        // Animation
        pulseSpeed: 1.2,
        hoverScale: 1.12,

        // Quality settings
        icosphereDetail: 4,     // 5,120 triangles (smooth)
        bloomIntensity: 0.5,
        bloomThreshold: 0.3
    };

    // ═══════════════════════════════════════════════════════════════
    // SHADER SOURCE
    // ═══════════════════════════════════════════════════════════════

    const SHADERS = {
        // ═══════════════════════════════════════════════════════════════
        // PREMIUM PBR GLASS ORB SHADER
        // Features: Physically-based rendering, environment mapping,
        //           Fresnel-Schlick approximation, subsurface glow,
        //           soft scanlines, specular highlights
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
                uniform vec3 uCameraPos;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPos;
                varying vec3 vViewDir;
                varying float vFresnel;

                void main() {
                    // Subtle breathing animation (premium feel)
                    float breathe = 1.0 + sin(uTime * 0.6) * 0.004;
                    vec3 pos = aPosition * breathe;

                    vec4 worldPos = uModel * vec4(pos * uScale, 1.0);
                    vPosition = pos;
                    vWorldPos = worldPos.xyz;
                    vNormal = normalize(mat3(uModel) * aNormal);

                    // Pre-calculate view direction
                    vViewDir = normalize(uCameraPos - worldPos.xyz);

                    // Pre-calculate Fresnel for fragment shader (performance)
                    float NdotV = max(dot(vNormal, vViewDir), 0.0);
                    vFresnel = pow(1.0 - NdotV, 4.0);

                    gl_Position = uProjection * uView * worldPos;
                }
            `,
            fragment: `
                precision highp float;

                uniform vec4 uColor;
                uniform vec3 uCameraPos;
                uniform float uTime;
                uniform float uHover;
                uniform samplerCube uEnvMap;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPos;
                varying vec3 vViewDir;
                varying float vFresnel;

                // Fresnel-Schlick approximation (PBR standard)
                vec3 fresnelSchlick(float cosTheta, vec3 F0) {
                    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
                }

                void main() {
                    vec3 N = normalize(vNormal);
                    vec3 V = normalize(vViewDir);
                    float NdotV = max(dot(N, V), 0.0);

                    // === ENVIRONMENT REFLECTION (premium quality) ===
                    vec3 reflectDir = reflect(-V, N);
                    vec3 envReflection = textureCube(uEnvMap, reflectDir).rgb * 0.4;

                    // === SIMULATED REFRACTION (glass IOR ~1.45) ===
                    vec3 refractDir = refract(-V, N, 1.0 / 1.45);
                    vec3 envRefraction = textureCube(uEnvMap, refractDir).rgb * 0.25;

                    // === FRESNEL-BASED GLASS ===
                    vec3 F0 = vec3(0.04); // Glass IOR
                    vec3 fresnel = fresnelSchlick(NdotV, F0);

                    // === ENERGY COLORS (bright pulsing cyan-purple) ===
                    float pulse = sin(uTime * 0.8) * 0.5 + 0.5;
                    vec3 energyCyan = vec3(0.25, 0.75, 1.0);
                    vec3 energyPurple = vec3(0.65, 0.35, 0.95);
                    vec3 energyColor = mix(energyCyan, energyPurple, pulse);

                    // === HOLOGRAPHIC SCAN LINES (subtle, premium) ===
                    float scanY = vWorldPos.y * 50.0 + uTime * 2.0;
                    float scanline = smoothstep(0.45, 0.55, fract(scanY)) * 0.035;

                    // === SUBSURFACE ENERGY GLOW ===
                    float subsurface = pow(max(dot(-N, V), 0.0), 2.0) * 0.15;

                    // === MULTI-LIGHT SPECULAR ===
                    // Primary light (top-right)
                    vec3 lightDir1 = normalize(vec3(0.6, 1.0, 0.5));
                    vec3 H1 = normalize(lightDir1 + V);
                    float spec1 = pow(max(dot(N, H1), 0.0), 128.0);

                    // Secondary light (left-back)
                    vec3 lightDir2 = normalize(vec3(-0.5, 0.3, -0.8));
                    vec3 H2 = normalize(lightDir2 + V);
                    float spec2 = pow(max(dot(N, H2), 0.0), 64.0) * 0.3;

                    // === BUILD FINAL COLOR ===
                    // Blue-tinted core with shimmer
                    vec3 color = vec3(0.03, 0.06, 0.12);

                    // Add environment (mix refraction/reflection by Fresnel)
                    color += mix(envRefraction, envReflection, fresnel.r);

                    // Add rim glow (energy at edges)
                    color += energyColor * vFresnel * 0.75;

                    // Add subtle scanlines
                    color += energyColor * scanline;

                    // Add subsurface glow
                    color += energyColor * subsurface;

                    // Add specular highlights
                    color += vec3(1.0, 0.98, 0.95) * spec1 * 0.55;
                    color += vec3(0.8, 0.85, 1.0) * spec2;

                    // === HOVER ENHANCEMENT ===
                    float hoverGlow = uHover * 0.35;
                    color += energyColor * vFresnel * hoverGlow;
                    color += vec3(0.1, 0.15, 0.25) * uHover * 0.2;
                    color *= 1.0 + uHover * 0.1;

                    // === ALPHA (glass transparency) ===
                    float alpha = 0.25 + vFresnel * 0.5 + spec1 * 0.12;
                    alpha = mix(alpha, min(alpha + 0.2, 0.92), uHover);

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
        },

        // ═══════════════════════════════════════════════════════════════
        // BLOOM POST-PROCESSING SHADERS
        // ═══════════════════════════════════════════════════════════════
        bloomExtract: {
            vertex: `
                attribute vec2 aPosition;
                varying vec2 vUV;
                void main() {
                    vUV = aPosition * 0.5 + 0.5;
                    gl_Position = vec4(aPosition, 0.0, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform sampler2D uScene;
                uniform float uThreshold;
                varying vec2 vUV;

                void main() {
                    vec4 color = texture2D(uScene, vUV);
                    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

                    // Extract only bright parts (energy glow areas)
                    if (brightness > uThreshold) {
                        gl_FragColor = color * (brightness - uThreshold);
                    } else {
                        gl_FragColor = vec4(0.0);
                    }
                }
            `
        },
        bloomBlur: {
            vertex: `
                attribute vec2 aPosition;
                varying vec2 vUV;
                void main() {
                    vUV = aPosition * 0.5 + 0.5;
                    gl_Position = vec4(aPosition, 0.0, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform sampler2D uTexture;
                uniform vec2 uDirection;
                uniform vec2 uResolution;
                varying vec2 vUV;

                void main() {
                    vec2 texelSize = 1.0 / uResolution;
                    vec4 result = vec4(0.0);

                    // 9-tap Gaussian blur (optimized weights)
                    float weights[5];
                    weights[0] = 0.227027;
                    weights[1] = 0.1945946;
                    weights[2] = 0.1216216;
                    weights[3] = 0.054054;
                    weights[4] = 0.016216;

                    result += texture2D(uTexture, vUV) * weights[0];

                    for (int i = 1; i < 5; i++) {
                        vec2 offset = uDirection * texelSize * float(i) * 1.5;
                        result += texture2D(uTexture, vUV + offset) * weights[i];
                        result += texture2D(uTexture, vUV - offset) * weights[i];
                    }

                    gl_FragColor = result;
                }
            `
        },
        bloomComposite: {
            vertex: `
                attribute vec2 aPosition;
                varying vec2 vUV;
                void main() {
                    vUV = aPosition * 0.5 + 0.5;
                    gl_Position = vec4(aPosition, 0.0, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform sampler2D uScene;
                uniform sampler2D uBloom;
                uniform float uIntensity;
                varying vec2 vUV;

                void main() {
                    vec4 scene = texture2D(uScene, vUV);
                    vec4 bloom = texture2D(uBloom, vUV);
                    gl_FragColor = scene + bloom * uIntensity;
                }
            `
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // ICOSPHERE GEOMETRY (Premium quality - evenly distributed triangles)
    // Detail 4 = 5,120 triangles (ultra smooth, no faceting)
    // ═══════════════════════════════════════════════════════════════

    function createIcosphereGeometry(detail = 4) {
        // Golden ratio
        const t = (1 + Math.sqrt(5)) / 2;

        // Initial icosahedron vertices (12 vertices)
        let vertices = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
        ];

        // Normalize initial vertices to unit sphere
        vertices = vertices.map(v => {
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            return [v[0]/len, v[1]/len, v[2]/len];
        });

        // Initial icosahedron faces (20 faces)
        let faces = [
            [0,11,5], [0,5,1], [0,1,7], [0,7,10], [0,10,11],
            [1,5,9], [5,11,4], [11,10,2], [10,7,6], [7,1,8],
            [3,9,4], [3,4,2], [3,2,6], [3,6,8], [3,8,9],
            [4,9,5], [2,4,11], [6,2,10], [8,6,7], [9,8,1]
        ];

        // Vertex cache for subdivision (avoid duplicates)
        const midpointCache = new Map();

        function getMidpoint(v1Idx, v2Idx) {
            const key = v1Idx < v2Idx ? `${v1Idx}_${v2Idx}` : `${v2Idx}_${v1Idx}`;
            if (midpointCache.has(key)) {
                return midpointCache.get(key);
            }

            const v1 = vertices[v1Idx];
            const v2 = vertices[v2Idx];

            // Midpoint
            let mid = [
                (v1[0] + v2[0]) / 2,
                (v1[1] + v2[1]) / 2,
                (v1[2] + v2[2]) / 2
            ];

            // Normalize to sphere surface
            const len = Math.sqrt(mid[0]*mid[0] + mid[1]*mid[1] + mid[2]*mid[2]);
            mid = [mid[0]/len, mid[1]/len, mid[2]/len];

            const idx = vertices.length;
            vertices.push(mid);
            midpointCache.set(key, idx);
            return idx;
        }

        // Subdivide 'detail' times
        for (let d = 0; d < detail; d++) {
            const newFaces = [];
            midpointCache.clear();

            for (const face of faces) {
                const a = face[0];
                const b = face[1];
                const c = face[2];

                // Get midpoints
                const ab = getMidpoint(a, b);
                const bc = getMidpoint(b, c);
                const ca = getMidpoint(c, a);

                // Create 4 new faces
                newFaces.push([a, ab, ca]);
                newFaces.push([b, bc, ab]);
                newFaces.push([c, ca, bc]);
                newFaces.push([ab, bc, ca]);
            }

            faces = newFaces;
        }

        // Convert to flat arrays
        const positions = [];
        const normals = [];
        const indices = [];

        for (const v of vertices) {
            positions.push(v[0], v[1], v[2]);
            // For a unit sphere, position === normal
            normals.push(v[0], v[1], v[2]);
        }

        for (const face of faces) {
            indices.push(face[0], face[1], face[2]);
        }

        console.log(`Icosphere: ${vertices.length} vertices, ${faces.length} triangles`);

        return { positions, normals, indices };
    }

    // Legacy fallback (kept for reference)
    function createSphereGeometry(segments = 24, rings = 16) {
        return createIcosphereGeometry(CONFIG.icosphereDetail);
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

    // Full-screen quad for post-processing
    function createFullscreenQuadGeometry() {
        return {
            positions: [-1, -1, 1, -1, 1, 1, -1, 1],
            indices: [0, 1, 2, 0, 2, 3]
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // ENVIRONMENT CUBEMAP (Procedural starfield for reflections)
    // ═══════════════════════════════════════════════════════════════

    function createEnvironmentCubemap(gl) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Generate face textures
        const faceImages = [];

        for (let face = 0; face < 6; face++) {
            // Deep space gradient background
            const gradient = ctx.createRadialGradient(
                size/2, size/2, 0,
                size/2, size/2, size * 0.8
            );
            gradient.addColorStop(0, '#0a1525');   // Dark blue center
            gradient.addColorStop(0.5, '#050a15'); // Darker mid
            gradient.addColorStop(1, '#020306');   // Nearly black edge

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // Add nebula-like color variations
            const nebulaGradient = ctx.createRadialGradient(
                size * (0.3 + Math.random() * 0.4),
                size * (0.3 + Math.random() * 0.4),
                0,
                size * 0.5, size * 0.5, size * 0.6
            );
            nebulaGradient.addColorStop(0, 'rgba(60, 100, 180, 0.08)');
            nebulaGradient.addColorStop(0.5, 'rgba(100, 60, 150, 0.04)');
            nebulaGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = nebulaGradient;
            ctx.fillRect(0, 0, size, size);

            // Add stars
            const starCount = 40 + Math.floor(Math.random() * 30);
            for (let s = 0; s < starCount; s++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const brightness = 0.25 + Math.random() * 0.75;
                const starSize = 0.3 + Math.random() * 1.2;

                // Star glow
                const starGradient = ctx.createRadialGradient(x, y, 0, x, y, starSize * 3);
                starGradient.addColorStop(0, `rgba(200, 220, 255, ${brightness})`);
                starGradient.addColorStop(0.3, `rgba(180, 200, 255, ${brightness * 0.3})`);
                starGradient.addColorStop(1, 'transparent');

                ctx.fillStyle = starGradient;
                ctx.beginPath();
                ctx.arc(x, y, starSize * 3, 0, Math.PI * 2);
                ctx.fill();

                // Star core
                ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                ctx.beginPath();
                ctx.arc(x, y, starSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add a few brighter stars with color variation
            for (let s = 0; s < 5; s++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const hue = Math.random() > 0.5 ? 200 + Math.random() * 40 : 20 + Math.random() * 30;
                ctx.fillStyle = `hsla(${hue}, 60%, 80%, 0.6)`;
                ctx.beginPath();
                ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
                ctx.fill();
            }

            faceImages.push(ctx.getImageData(0, 0, size, size));
        }

        // Create WebGL cubemap texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        const targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];

        for (let i = 0; i < 6; i++) {
            gl.texImage2D(targets[i], 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(faceImages[i].data.buffer));
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        console.log('Created environment cubemap (256x256 per face)');
        return texture;
    }

    // ═══════════════════════════════════════════════════════════════
    // FRAMEBUFFER HELPER (for bloom post-processing)
    // ═══════════════════════════════════════════════════════════════

    function createFramebuffer(gl, width, height) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Add depth buffer
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { framebuffer, texture, depthBuffer, width, height };
    }

    // ═══════════════════════════════════════════════════════════════
    // MEMORY CONTENT RENDERER
    // High-quality canvas-based content textures with DPI scaling
    // Supports: Preview mode (title + count) and Full mode (first Q&A)
    // ═══════════════════════════════════════════════════════════════

    class MemoryContentRenderer {
        constructor(gl) {
            this.gl = gl;
            this.cache = new Map();
            this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
        }

        // Create preview content (shown by default - title + message count)
        createPreviewContent(conversation, id) {
            if (this.cache.has(id) && this.cache.get(id).isLoaded) {
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

            ctx.clearRect(0, 0, size, size);

            const title = conversation.title || 'Memory';
            const count = conversation.message_count || 0;

            // === DRAW TITLE (centered, prominent) ===
            const titleSize = Math.round(14 * dpr);
            ctx.font = `600 ${titleSize}px ${this.fontFamily}`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const maxWidth = size * 0.85;
            let y = size * 0.32;
            const titleLines = this.wrapText(ctx, title, maxWidth, 2);

            for (const line of titleLines) {
                ctx.fillText(line, size / 2, y);
                y += titleSize * 1.35;
            }

            // === DRAW MESSAGE COUNT ===
            const countSize = Math.round(10 * dpr);
            ctx.font = `400 ${countSize}px ${this.fontFamily}`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillText(`${count} exchange${count !== 1 ? 's' : ''}`, size / 2, y + 8 * dpr);

            return this.createTexture(id, false);
        }

        // Create full content (shown after loading - first Q&A exchange)
        createFullContent(conversation, id, fullData) {
            const gl = this.gl;
            const ctx = this.ctx;
            const dpr = this.dpr;

            const baseSize = 256;
            const size = baseSize * dpr;
            this.canvas.width = size;
            this.canvas.height = size;

            ctx.clearRect(0, 0, size, size);

            // Get first user message and Auron response
            const messages = fullData?.messages || [];
            const userMsg = messages.find(m => m.role === 'user');
            const auronMsg = messages.find(m => m.role === 'auron' || m.role === 'assistant');

            let y = size * 0.18;

            // === USER QUESTION (dimmer, italic, quoted) ===
            if (userMsg) {
                const userSize = Math.round(9 * dpr);
                ctx.font = `italic 400 ${userSize}px ${this.fontFamily}`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const userText = this.truncate(userMsg.content, 60);
                const lines = this.wrapText(ctx, `"${userText}"`, size * 0.88, 2);

                for (const line of lines) {
                    ctx.fillText(line, size / 2, y);
                    y += userSize * 1.35;
                }

                y += 6 * dpr;
            }

            // === AURON RESPONSE (brighter, bolder) ===
            if (auronMsg) {
                const auronSize = Math.round(11 * dpr);
                ctx.font = `500 ${auronSize}px ${this.fontFamily}`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                // Try to get dialogue.guidance first, then content
                let text = auronMsg.dialogue?.guidance || auronMsg.content || '';
                text = this.truncate(text, 80);
                const lines = this.wrapText(ctx, text, size * 0.9, 3);

                for (const line of lines) {
                    ctx.fillText(line, size / 2, y);
                    y += auronSize * 1.4;
                }
            }

            // Delete old texture if exists
            if (this.cache.has(id)) {
                gl.deleteTexture(this.cache.get(id).texture);
            }

            return this.createTexture(id, true);
        }

        createTexture(id, isLoaded) {
            const gl = this.gl;
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
                width: this.canvas.width,
                height: this.canvas.height,
                aspectRatio: 1.0,
                isLoaded
            };

            this.cache.set(id, contentData);
            return contentData;
        }

        truncate(text, maxLength) {
            if (!text) return '';
            text = text.replace(/\n/g, ' ').trim();
            if (text.length <= maxLength) return text;
            return text.slice(0, maxLength - 3).trim() + '...';
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

            // Create high-quality icosphere geometry (5,120 triangles)
            const sphere = createIcosphereGeometry(this.config.icosphereDetail);
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

            // Fullscreen quad for post-processing
            const fsQuad = createFullscreenQuadGeometry();
            this.fullscreenQuadBuffers = {
                position: this.createBuffer(new Float32Array(fsQuad.positions)),
                index: this.createIndexBuffer(new Uint16Array(fsQuad.indices)),
                count: fsQuad.indices.length
            };

            // Create environment cubemap for reflections
            this.envMap = createEnvironmentCubemap(gl);

            // Memory content renderer (high-quality text inside orbs)
            this.contentRenderer = new MemoryContentRenderer(gl);

            // Create particle system
            this.initParticles(200);

            // Matrices
            this.projectionMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelMatrix = mat4.create();

            // Bloom framebuffers (initialized in resize)
            this.bloomEnabled = true;
            this.bloomFramebuffers = null;

            // GL state
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
        }

        initBloomFramebuffers(width, height) {
            const gl = this.gl;

            // Clean up old framebuffers
            if (this.bloomFramebuffers) {
                gl.deleteFramebuffer(this.bloomFramebuffers.scene.framebuffer);
                gl.deleteTexture(this.bloomFramebuffers.scene.texture);
                gl.deleteRenderbuffer(this.bloomFramebuffers.scene.depthBuffer);
                gl.deleteFramebuffer(this.bloomFramebuffers.blur1.framebuffer);
                gl.deleteTexture(this.bloomFramebuffers.blur1.texture);
                gl.deleteFramebuffer(this.bloomFramebuffers.blur2.framebuffer);
                gl.deleteTexture(this.bloomFramebuffers.blur2.texture);
            }

            // Half resolution for bloom (performance)
            const bloomWidth = Math.floor(width / 2);
            const bloomHeight = Math.floor(height / 2);

            this.bloomFramebuffers = {
                scene: createFramebuffer(gl, width, height),
                blur1: createFramebuffer(gl, bloomWidth, bloomHeight),
                blur2: createFramebuffer(gl, bloomWidth, bloomHeight)
            };
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

            // Create preview content textures for each orb (title + count)
            if (this.contentRenderer) {
                for (const orb of this.orbs) {
                    orb.content = this.contentRenderer.createPreviewContent(
                        orb.conversation,
                        orb.conversation.id
                    );
                    orb.contentState = 'preview';  // preview | loading | loaded
                    orb.fullData = null;
                    orb.visibleSince = null;
                }
            }
        }

        // Update orb content when full data is loaded
        updateOrbContent(orbId, fullData) {
            const orb = this.orbs.find(o => o.conversation.id === orbId);
            if (orb && this.contentRenderer) {
                orb.content = this.contentRenderer.createFullContent(
                    orb.conversation,
                    orb.conversation.id,
                    fullData
                );
                orb.contentState = 'loaded';
                orb.fullData = fullData;
            }
        }

        // Get orbs that are visible and need loading
        getOrbsToLoad() {
            const now = performance.now();
            const toLoad = [];

            for (const orb of this.orbs) {
                if (orb.contentState !== 'preview') continue;

                // Check if orb is facing camera (simple visibility check)
                const screenPos = this.getOrbScreenPosition(orb);
                const isVisible = screenPos &&
                    screenPos.z > 0 &&
                    Math.abs(screenPos.x) < 1.3 &&
                    Math.abs(screenPos.y) < 1.3;

                if (isVisible) {
                    if (!orb.visibleSince) orb.visibleSince = now;

                    // Debounce: load after 200ms visibility
                    if (now - orb.visibleSince > 200) {
                        orb.contentState = 'loading';
                        toLoad.push(orb.conversation);
                    }
                } else {
                    orb.visibleSince = null;
                }
            }

            return toLoad;
        }

        positionOrbs(conversations) {
            if (!conversations || conversations.length === 0) return [];

            // Sort by updated_at (most recent first) for timeline spiral
            const sorted = [...conversations].sort((a, b) =>
                new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
            );

            const { centerRadius, maxSpiralRadius, spiralTurns } = this.config;

            return sorted.map((conv, i) => {
                const total = sorted.length;
                const progress = i / Math.max(total - 1, 1);  // 0 = center (recent), 1 = edge (older)

                // Archimedean spiral: recent at center, older spiral outward
                const radius = centerRadius + (maxSpiralRadius - centerRadius) * Math.pow(progress, 0.7);
                const theta = progress * spiralTurns * Math.PI * 2;

                // Slight Z variation for depth (sine wave pattern)
                const zVariation = Math.sin(progress * Math.PI * 2) * 0.35;

                // Small random offset for organic feel
                const jitterX = (Math.random() - 0.5) * 0.15;
                const jitterY = (Math.random() - 0.5) * 0.15;

                const position = [
                    radius * Math.cos(theta) + jitterX,
                    radius * Math.sin(theta) + jitterY,
                    zVariation
                ];

                return {
                    conversation: conv,
                    position: position,
                    radius: this.getOrbRadius(conv.message_count || 1),
                    color: this.getOrbColor(conv.created_at),
                    hover: 0,
                    sortIndex: i  // Track position for reference
                };
            });
        }

        getOrbRadius(messageCount) {
            const { minRadius, maxRadius } = this.config;
            const scale = Math.sqrt(messageCount) * 0.025;
            return Math.min(minRadius + scale, maxRadius);
        }

        getOrbColor(createdAt) {
            const { colors } = this.config;
            const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

            if (ageInDays < 7) return colors.recent;
            if (ageInDays < 30) return colors.moderate;
            return colors.older;
        }

        // Get orb's screen position (for hover card positioning)
        getOrbScreenPosition(orb) {
            if (!orb) return null;

            // Transform orb position to clip space
            const pos = { x: orb.position[0], y: orb.position[1], z: orb.position[2] };

            // Apply view matrix
            const viewPos = [
                this.viewMatrix[0] * pos.x + this.viewMatrix[4] * pos.y + this.viewMatrix[8] * pos.z + this.viewMatrix[12],
                this.viewMatrix[1] * pos.x + this.viewMatrix[5] * pos.y + this.viewMatrix[9] * pos.z + this.viewMatrix[13],
                this.viewMatrix[2] * pos.x + this.viewMatrix[6] * pos.y + this.viewMatrix[10] * pos.z + this.viewMatrix[14],
                this.viewMatrix[3] * pos.x + this.viewMatrix[7] * pos.y + this.viewMatrix[11] * pos.z + this.viewMatrix[15]
            ];

            // Apply projection matrix
            const clipPos = [
                this.projectionMatrix[0] * viewPos[0] + this.projectionMatrix[4] * viewPos[1] + this.projectionMatrix[8] * viewPos[2] + this.projectionMatrix[12] * viewPos[3],
                this.projectionMatrix[1] * viewPos[0] + this.projectionMatrix[5] * viewPos[1] + this.projectionMatrix[9] * viewPos[2] + this.projectionMatrix[13] * viewPos[3],
                this.projectionMatrix[2] * viewPos[0] + this.projectionMatrix[6] * viewPos[1] + this.projectionMatrix[10] * viewPos[2] + this.projectionMatrix[14] * viewPos[3],
                this.projectionMatrix[3] * viewPos[0] + this.projectionMatrix[7] * viewPos[1] + this.projectionMatrix[11] * viewPos[2] + this.projectionMatrix[15] * viewPos[3]
            ];

            // Perspective divide
            if (Math.abs(clipPos[3]) < 0.001) return null;

            const ndcX = clipPos[0] / clipPos[3];
            const ndcY = clipPos[1] / clipPos[3];
            const ndcZ = clipPos[2] / clipPos[3];

            // Convert to screen coordinates
            const rect = this.canvas.getBoundingClientRect();
            const screenX = (ndcX * 0.5 + 0.5) * rect.width + rect.left;
            const screenY = (-ndcY * 0.5 + 0.5) * rect.height + rect.top;

            return {
                x: screenX,
                y: screenY,
                z: ndcZ,  // Depth for visibility check
                ndcX,
                ndcY
            };
        }

        // Get currently hovered orb with screen position
        getHoveredOrbInfo() {
            if (!this.hoveredOrb) return null;

            const screenPos = this.getOrbScreenPosition(this.hoveredOrb);
            if (!screenPos) return null;

            return {
                conversation: this.hoveredOrb.conversation,
                screenX: screenPos.x,
                screenY: screenPos.y,
                radius: this.hoveredOrb.radius
            };
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
            const width = Math.floor(rect.width * dpr);
            const height = Math.floor(rect.height * dpr);

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

                // Initialize/resize bloom framebuffers
                if (this.bloomEnabled) {
                    this.initBloomFramebuffers(width, height);
                }
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

            // Update hover animations
            for (const orb of this.orbs) {
                const targetHover = orb === this.hoveredOrb ? 1 : 0;
                orb.hover = lerp(orb.hover, targetHover, 0.15);
            }

            // Check for orbs that need lazy loading
            const orbsToLoad = this.getOrbsToLoad();
            if (orbsToLoad.length > 0 && this.options.onOrbsNeedLoading) {
                this.options.onOrbsNeedLoading(orbsToLoad);
            }

            // Render with bloom if enabled
            if (this.bloomEnabled && this.bloomFramebuffers) {
                this.renderWithBloom();
            } else {
                this.renderScene(null);
            }
        }

        renderScene(framebuffer) {
            const gl = this.gl;

            if (framebuffer) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            // Clear to transparent
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Draw particles (background)
            this.renderParticles();

            // Draw orb glows (additive, behind orbs)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
            this.renderGlows();

            // Draw content INSIDE orbs (always visible, no depth write)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.renderContent();

            // Draw holographic orb shells (with depth)
            gl.depthMask(true);
            this.renderOrbs();
        }

        renderWithBloom() {
            const gl = this.gl;
            const fb = this.bloomFramebuffers;

            // 1. Render scene to framebuffer
            this.renderScene(fb.scene.framebuffer);

            // 2. Extract bright areas
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.blur1.framebuffer);
            gl.viewport(0, 0, fb.blur1.width, fb.blur1.height);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const extractProg = this.programs.bloomExtract;
            gl.useProgram(extractProg);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fb.scene.texture);
            gl.uniform1i(gl.getUniformLocation(extractProg, 'uScene'), 0);
            gl.uniform1f(gl.getUniformLocation(extractProg, 'uThreshold'), this.config.bloomThreshold);

            this.drawFullscreenQuad(extractProg);

            // 3. Blur horizontally
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.blur2.framebuffer);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const blurProg = this.programs.bloomBlur;
            gl.useProgram(blurProg);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fb.blur1.texture);
            gl.uniform1i(gl.getUniformLocation(blurProg, 'uTexture'), 0);
            gl.uniform2fv(gl.getUniformLocation(blurProg, 'uDirection'), [1.0, 0.0]);
            gl.uniform2fv(gl.getUniformLocation(blurProg, 'uResolution'), [fb.blur1.width, fb.blur1.height]);

            this.drawFullscreenQuad(blurProg);

            // 4. Blur vertically
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.blur1.framebuffer);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.bindTexture(gl.TEXTURE_2D, fb.blur2.texture);
            gl.uniform2fv(gl.getUniformLocation(blurProg, 'uDirection'), [0.0, 1.0]);

            this.drawFullscreenQuad(blurProg);

            // 5. Composite to screen
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const compositeProg = this.programs.bloomComposite;
            gl.useProgram(compositeProg);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fb.scene.texture);
            gl.uniform1i(gl.getUniformLocation(compositeProg, 'uScene'), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fb.blur1.texture);
            gl.uniform1i(gl.getUniformLocation(compositeProg, 'uBloom'), 1);

            gl.uniform1f(gl.getUniformLocation(compositeProg, 'uIntensity'), this.config.bloomIntensity);

            this.drawFullscreenQuad(compositeProg);
        }

        drawFullscreenQuad(program) {
            const gl = this.gl;
            const posLoc = gl.getAttribLocation(program, 'aPosition');

            gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuadBuffers.position);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreenQuadBuffers.index);
            gl.drawElements(gl.TRIANGLES, this.fullscreenQuadBuffers.count, gl.UNSIGNED_SHORT, 0);
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

            // Bind environment cubemap for reflections
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.envMap);
            gl.uniform1i(gl.getUniformLocation(program, 'uEnvMap'), 0);

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

            // Get all orbs with content
            const orbsWithContent = this.orbs.filter(orb => orb.content);
            if (orbsWithContent.length === 0) return;

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

            // Draw content for ALL orbs (always visible inside bubbles)
            for (const orb of orbsWithContent) {
                // Calculate distance-based opacity (closer = brighter)
                const camPos = this.cameraPosition;
                const orbPos = orb.position;
                const dx = camPos[0] - orbPos[0];
                const dy = camPos[1] - orbPos[1];
                const dz = camPos[2] - orbPos[2];
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

                // Normalize distance: close orbs (< 3) are fully visible, far orbs (> 8) fade
                const distFade = 1.0 - Math.min(Math.max((distance - 3) / 5, 0), 1);

                // Base opacity + distance fade + hover boost
                const baseOpacity = 0.5 + distFade * 0.35;
                const opacity = Math.min(baseOpacity + orb.hover * 0.3, 1.0);

                // Skip if too faint
                if (opacity < 0.15) continue;

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, orb.content.texture);
                gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

                gl.uniform3fv(gl.getUniformLocation(program, 'uCenter'), orb.position);
                // Scale to fit inside orb (70% of diameter)
                gl.uniform1f(gl.getUniformLocation(program, 'uScale'), orb.radius * 1.4);
                gl.uniform1f(gl.getUniformLocation(program, 'uAspect'), orb.content.aspectRatio);
                gl.uniform1f(gl.getUniformLocation(program, 'uOpacity'), opacity);

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
