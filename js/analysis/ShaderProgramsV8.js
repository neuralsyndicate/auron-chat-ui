// ============================================================
// V8 NEURAL HELIX - GLSL Shader Programs
// Matrix-based 3D rendering with bloom and effects
// ============================================================

const ShaderProgramsV8 = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // HELIX STRAND SHADERS
    // ═══════════════════════════════════════════════════════════════

    const HELIX_VERTEX = `
        precision highp float;

        attribute vec3 a_position;
        attribute float a_progress;     // 0-1 along strand
        attribute float a_strand;       // 0 or 1

        uniform mat4 u_mvp;
        uniform mat4 u_model;
        uniform float u_time;

        varying float v_depth;
        varying float v_progress;
        varying float v_strand;
        varying vec3 v_worldPos;

        void main() {
            // Transform to world space
            vec4 worldPos = u_model * vec4(a_position, 1.0);
            v_worldPos = worldPos.xyz;

            // Transform to clip space
            vec4 clipPos = u_mvp * vec4(a_position, 1.0);
            gl_Position = clipPos;

            // Pass varying data
            v_depth = clipPos.z / clipPos.w;
            v_progress = a_progress;
            v_strand = a_strand;
        }
    `;

    const HELIX_FRAGMENT = `
        precision highp float;

        uniform vec3 u_colorFront;      // Cyan
        uniform vec3 u_colorBack;       // Blue (darker)
        uniform float u_alpha;
        uniform float u_time;

        // Traveling glow pulse
        uniform float u_pulsePosition;  // 0-1 along helix
        uniform float u_pulseIntensity; // 0-1
        uniform float u_pulseWidth;     // Pulse spread (default 0.15)

        // Selection state
        uniform float u_backgroundDim;  // 0-0.4 dim when selected

        varying float v_depth;
        varying float v_progress;
        varying float v_strand;
        varying vec3 v_worldPos;

        void main() {
            // Depth-based color interpolation
            float depthFactor = smoothstep(-1.0, 1.0, v_depth);
            vec3 baseColor = mix(u_colorBack, u_colorFront, depthFactor);

            // Apply background dim
            baseColor *= (1.0 - u_backgroundDim * 0.6);

            // Traveling pulse glow
            float pulseDist = abs(v_progress - u_pulsePosition);
            // Handle wrap-around
            pulseDist = min(pulseDist, 1.0 - pulseDist);
            float pulse = exp(-pulseDist * pulseDist / (u_pulseWidth * u_pulseWidth)) * u_pulseIntensity;

            // Pulse color (bright cyan)
            vec3 pulseColor = vec3(0.0, 1.0, 1.0);
            vec3 finalColor = baseColor + pulseColor * pulse * 0.8;

            // Alpha based on depth and pulse
            float alpha = u_alpha * (0.4 + depthFactor * 0.6);
            alpha += pulse * 0.3;

            // Subtle strand differentiation
            if (v_strand > 0.5) {
                finalColor *= 0.85;
            }

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // NODE SHADERS
    // ═══════════════════════════════════════════════════════════════

    const NODE_VERTEX = `
        precision highp float;

        attribute vec3 a_position;
        attribute vec2 a_texCoord;

        uniform mat4 u_mvp;
        uniform vec3 u_nodeCenter;
        uniform float u_scale;
        uniform float u_time;

        varying vec2 v_texCoord;
        varying float v_depth;

        void main() {
            // Billboard: position offset from node center
            vec3 worldPos = u_nodeCenter + a_position * u_scale;

            vec4 clipPos = u_mvp * vec4(worldPos, 1.0);
            gl_Position = clipPos;

            v_texCoord = a_texCoord;
            v_depth = clipPos.z / clipPos.w;
        }
    `;

    const NODE_FRAGMENT = `
        precision highp float;

        uniform vec3 u_color;
        uniform float u_alpha;
        uniform float u_time;
        uniform float u_isSelected;     // 0 or 1
        uniform float u_isHovered;      // 0 or 1
        uniform float u_isDimmed;       // 0 or 1 (when another node is selected)

        varying vec2 v_texCoord;
        varying float v_depth;

        void main() {
            // Distance from center for circular node
            vec2 centered = v_texCoord - 0.5;
            float dist = length(centered);

            // Soft circle
            float circle = 1.0 - smoothstep(0.35, 0.5, dist);

            // Glow ring for selected/hovered
            float ring = smoothstep(0.3, 0.4, dist) * (1.0 - smoothstep(0.4, 0.5, dist));

            // Selection pulse
            float pulse = 0.0;
            if (u_isSelected > 0.5) {
                pulse = sin(u_time * 4.0) * 0.3 + 0.7;
                ring *= pulse * 2.0;
            } else if (u_isHovered > 0.5) {
                ring *= 1.5;
            }

            // Combine core and ring
            vec3 coreColor = u_color;
            vec3 ringColor = vec3(0.0, 1.0, 1.0); // Cyan glow

            vec3 finalColor = coreColor * circle + ringColor * ring * 0.5;

            // Alpha
            float alpha = (circle + ring * 0.3) * u_alpha;

            // Dim if another node is selected
            if (u_isDimmed > 0.5) {
                finalColor *= 0.3;
                alpha *= 0.5;
            }

            // Depth-based alpha adjustment
            alpha *= (0.5 + smoothstep(-1.0, 1.0, v_depth) * 0.5);

            if (alpha < 0.01) discard;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // PARTICLE SHADERS
    // ═══════════════════════════════════════════════════════════════

    const PARTICLE_VERTEX = `
        precision highp float;

        attribute vec3 a_position;
        attribute float a_size;
        attribute float a_alpha;
        attribute float a_type;         // 0=ambient, 1=streak, 2=spark

        uniform mat4 u_mvp;
        uniform float u_time;
        uniform float u_pointScale;

        varying float v_alpha;
        varying float v_type;
        varying float v_depth;

        void main() {
            vec4 clipPos = u_mvp * vec4(a_position, 1.0);
            gl_Position = clipPos;

            // Point size with perspective
            float perspective = 1.0 / clipPos.w;
            gl_PointSize = a_size * u_pointScale * perspective;

            v_alpha = a_alpha;
            v_type = a_type;
            v_depth = clipPos.z / clipPos.w;
        }
    `;

    const PARTICLE_FRAGMENT = `
        precision highp float;

        uniform float u_time;
        uniform vec3 u_colorAmbient;    // Soft cyan
        uniform vec3 u_colorStreak;     // Bright white-cyan
        uniform vec3 u_colorSpark;      // Yellow-white

        varying float v_alpha;
        varying float v_type;
        varying float v_depth;

        void main() {
            // Circular particle with soft edge
            vec2 centered = gl_PointCoord - 0.5;
            float dist = length(centered);
            float circle = 1.0 - smoothstep(0.3, 0.5, dist);

            // Select color based on type
            vec3 color;
            if (v_type < 0.5) {
                color = u_colorAmbient;
            } else if (v_type < 1.5) {
                color = u_colorStreak;
                // Streak particles have brighter core
                circle *= 1.0 + (1.0 - dist * 2.0) * 0.5;
            } else {
                color = u_colorSpark;
                // Sparks twinkle
                circle *= 0.8 + sin(u_time * 10.0 + v_depth * 5.0) * 0.2;
            }

            float alpha = circle * v_alpha;

            // Depth fade
            alpha *= (0.3 + smoothstep(-1.0, 1.0, v_depth) * 0.7);

            if (alpha < 0.01) discard;

            gl_FragColor = vec4(color, alpha);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // STREAK PARTICLE SHADERS (Line-based)
    // ═══════════════════════════════════════════════════════════════

    const STREAK_VERTEX = `
        precision highp float;

        attribute vec3 a_position;
        attribute vec3 a_prevPosition;
        attribute float a_alpha;

        uniform mat4 u_mvp;
        uniform float u_time;

        varying float v_alpha;
        varying float v_depth;

        void main() {
            vec4 clipPos = u_mvp * vec4(a_position, 1.0);
            gl_Position = clipPos;

            v_alpha = a_alpha;
            v_depth = clipPos.z / clipPos.w;
        }
    `;

    const STREAK_FRAGMENT = `
        precision highp float;

        uniform vec3 u_color;

        varying float v_alpha;
        varying float v_depth;

        void main() {
            float alpha = v_alpha * (0.3 + smoothstep(-1.0, 1.0, v_depth) * 0.7);
            gl_FragColor = vec4(u_color, alpha);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // HOLOGRAPHIC CARD SHADERS
    // ═══════════════════════════════════════════════════════════════

    const CARD_VERTEX = `
        precision highp float;

        attribute vec3 a_position;
        attribute vec2 a_texCoord;

        uniform mat4 u_mvp;
        uniform vec3 u_cardPosition;
        uniform vec2 u_cardSize;
        uniform float u_cardRotation;

        varying vec2 v_texCoord;
        varying vec3 v_worldPos;

        void main() {
            // Apply card size
            vec3 scaledPos = a_position * vec3(u_cardSize, 1.0);

            // Apply rotation around Y axis
            float c = cos(u_cardRotation);
            float s = sin(u_cardRotation);
            vec3 rotatedPos = vec3(
                scaledPos.x * c - scaledPos.z * s,
                scaledPos.y,
                scaledPos.x * s + scaledPos.z * c
            );

            // Translate to card position
            vec3 worldPos = rotatedPos + u_cardPosition;
            v_worldPos = worldPos;

            gl_Position = u_mvp * vec4(worldPos, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    const CARD_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_texture;
        uniform float u_opacity;
        uniform float u_time;
        uniform vec3 u_glassColor;
        uniform float u_glassOpacity;

        varying vec2 v_texCoord;
        varying vec3 v_worldPos;

        void main() {
            vec4 textColor = texture2D(u_texture, v_texCoord);

            // Holographic shimmer (subtle scan lines)
            float scanline = sin(v_texCoord.y * 80.0 + u_time * 3.0) * 0.015;
            float shimmer = sin(v_texCoord.y * 200.0 - u_time * 5.0) * 0.01;

            // Edge glow (brighter at card edges)
            float edgeX = pow(abs(v_texCoord.x - 0.5) * 2.0, 3.0);
            float edgeY = pow(abs(v_texCoord.y - 0.5) * 2.0, 3.0);
            float edgeGlow = max(edgeX, edgeY) * 0.15;

            // Corner highlights
            float cornerDist = length(v_texCoord - 0.5) * 1.414;
            float cornerGlow = smoothstep(0.8, 1.0, cornerDist) * 0.1;

            // Glass base color with shimmer
            vec3 glass = u_glassColor + vec3(scanline, shimmer + edgeGlow, shimmer * 1.5);

            // Blend text over glass
            vec3 finalColor = mix(glass, textColor.rgb, textColor.a * 0.9);

            // Add cyan edge glow
            finalColor += vec3(0.0, 0.8, 1.0) * (edgeGlow + cornerGlow);

            // Final alpha: glass base + text
            float alpha = max(textColor.a, u_glassOpacity) * u_opacity;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // BLOOM SHADERS
    // ═══════════════════════════════════════════════════════════════

    const FULLSCREEN_VERTEX = `
        precision highp float;

        attribute vec2 a_position;
        attribute vec2 a_texCoord;

        varying vec2 v_texCoord;

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    const BRIGHTNESS_EXTRACT_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_texture;
        uniform float u_threshold;

        varying vec2 v_texCoord;

        void main() {
            vec4 color = texture2D(u_texture, v_texCoord);

            // Calculate luminance
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

            // Extract bright areas
            float brightness = max(0.0, luminance - u_threshold);
            brightness = brightness / (1.0 + brightness); // Tone map

            gl_FragColor = vec4(color.rgb * brightness, 1.0);
        }
    `;

    const BLUR_HORIZONTAL_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_texture;
        uniform vec2 u_texelSize;
        uniform float u_blurSize;

        varying vec2 v_texCoord;

        void main() {
            vec4 color = vec4(0.0);

            // 9-tap Gaussian blur
            float weights[5];
            weights[0] = 0.227027;
            weights[1] = 0.1945946;
            weights[2] = 0.1216216;
            weights[3] = 0.054054;
            weights[4] = 0.016216;

            color += texture2D(u_texture, v_texCoord) * weights[0];

            for (int i = 1; i < 5; i++) {
                float offset = float(i) * u_blurSize;
                color += texture2D(u_texture, v_texCoord + vec2(u_texelSize.x * offset, 0.0)) * weights[i];
                color += texture2D(u_texture, v_texCoord - vec2(u_texelSize.x * offset, 0.0)) * weights[i];
            }

            gl_FragColor = color;
        }
    `;

    const BLUR_VERTICAL_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_texture;
        uniform vec2 u_texelSize;
        uniform float u_blurSize;

        varying vec2 v_texCoord;

        void main() {
            vec4 color = vec4(0.0);

            // 9-tap Gaussian blur
            float weights[5];
            weights[0] = 0.227027;
            weights[1] = 0.1945946;
            weights[2] = 0.1216216;
            weights[3] = 0.054054;
            weights[4] = 0.016216;

            color += texture2D(u_texture, v_texCoord) * weights[0];

            for (int i = 1; i < 5; i++) {
                float offset = float(i) * u_blurSize;
                color += texture2D(u_texture, v_texCoord + vec2(0.0, u_texelSize.y * offset)) * weights[i];
                color += texture2D(u_texture, v_texCoord - vec2(0.0, u_texelSize.y * offset)) * weights[i];
            }

            gl_FragColor = color;
        }
    `;

    const BLOOM_COMPOSITE_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_sceneTexture;
        uniform sampler2D u_bloomTexture;
        uniform float u_bloomIntensity;
        uniform float u_exposure;

        varying vec2 v_texCoord;

        // ACES tone mapping
        vec3 ACESFilm(vec3 x) {
            float a = 2.51;
            float b = 0.03;
            float c = 2.43;
            float d = 0.59;
            float e = 0.14;
            return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        void main() {
            vec3 scene = texture2D(u_sceneTexture, v_texCoord).rgb;
            vec3 bloom = texture2D(u_bloomTexture, v_texCoord).rgb;

            // Add bloom
            vec3 color = scene + bloom * u_bloomIntensity;

            // Apply exposure
            color *= u_exposure;

            // Tone mapping
            color = ACESFilm(color);

            // Gamma correction
            color = pow(color, vec3(1.0 / 2.2));

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // POST-PROCESSING: FOG
    // ═══════════════════════════════════════════════════════════════

    const FOG_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_sceneTexture;
        uniform sampler2D u_depthTexture;
        uniform float u_fogDensity;
        uniform float u_fogStart;
        uniform float u_fogEnd;
        uniform vec3 u_fogColor;
        uniform float u_time;

        varying vec2 v_texCoord;

        void main() {
            vec4 sceneColor = texture2D(u_sceneTexture, v_texCoord);
            float depth = texture2D(u_depthTexture, v_texCoord).r;

            // Convert to linear depth
            float linearDepth = depth;

            // Volumetric noise for fog wisps
            float noise = sin(v_texCoord.x * 30.0 + u_time * 0.5) *
                         cos(v_texCoord.y * 20.0 + u_time * 0.3) * 0.1;

            // Calculate fog factor
            float fogFactor = smoothstep(u_fogStart, u_fogEnd, linearDepth + noise);
            fogFactor *= u_fogDensity;

            // Mix scene with fog
            vec3 finalColor = mix(sceneColor.rgb, u_fogColor, fogFactor);

            gl_FragColor = vec4(finalColor, sceneColor.a);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // POST-PROCESSING: RIPPLE EFFECT
    // ═══════════════════════════════════════════════════════════════

    const RIPPLE_FRAGMENT = `
        precision highp float;

        uniform sampler2D u_texture;
        uniform vec2 u_rippleCenter;    // NDC coordinates
        uniform float u_rippleTime;     // 0-1 animation progress
        uniform float u_rippleActive;   // 0 or 1

        varying vec2 v_texCoord;

        void main() {
            vec2 uv = v_texCoord;

            if (u_rippleActive > 0.5) {
                // Calculate distance from ripple center
                vec2 centerUV = u_rippleCenter * 0.5 + 0.5; // Convert NDC to UV
                float dist = distance(uv, centerUV);

                // Expanding ring
                float rippleRadius = u_rippleTime * 0.8;
                float ringWidth = 0.1;

                // Ring intensity
                float ring = smoothstep(rippleRadius - ringWidth, rippleRadius, dist) *
                            smoothstep(rippleRadius + ringWidth, rippleRadius, dist);

                // Decay over time
                ring *= 1.0 - u_rippleTime;

                // UV distortion
                vec2 direction = normalize(uv - centerUV);
                uv += direction * ring * 0.02;
            }

            vec4 color = texture2D(u_texture, uv);

            // Add cyan ring glow
            if (u_rippleActive > 0.5) {
                vec2 centerUV = u_rippleCenter * 0.5 + 0.5;
                float dist = distance(v_texCoord, centerUV);
                float rippleRadius = u_rippleTime * 0.8;

                float glow = smoothstep(rippleRadius - 0.05, rippleRadius, dist) *
                            smoothstep(rippleRadius + 0.05, rippleRadius, dist);
                glow *= (1.0 - u_rippleTime) * 0.5;

                color.rgb += vec3(0.0, 0.85, 1.0) * glow;
            }

            gl_FragColor = color;
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND GRADIENT SHADER
    // ═══════════════════════════════════════════════════════════════

    const BACKGROUND_FRAGMENT = `
        precision highp float;

        uniform vec3 u_colorTop;
        uniform vec3 u_colorBottom;
        uniform float u_time;

        varying vec2 v_texCoord;

        void main() {
            // Vertical gradient
            float gradient = v_texCoord.y;

            // Subtle animated noise
            float noise = sin(v_texCoord.x * 50.0 + u_time * 0.2) *
                         cos(v_texCoord.y * 30.0 - u_time * 0.1) * 0.01;

            vec3 color = mix(u_colorBottom, u_colorTop, gradient + noise);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // ═══════════════════════════════════════════════════════════════
    // SHADER COMPILATION UTILITIES
    // ═══════════════════════════════════════════════════════════════

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', error);
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            console.error('Program linking error:', error);
            gl.deleteProgram(program);
            return null;
        }

        // Clean up shaders (they're now part of the program)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    function getUniformLocations(gl, program, names) {
        const locations = {};
        for (const name of names) {
            locations[name] = gl.getUniformLocation(program, name);
        }
        return locations;
    }

    function getAttributeLocations(gl, program, names) {
        const locations = {};
        for (const name of names) {
            locations[name] = gl.getAttribLocation(program, name);
        }
        return locations;
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRAM FACTORY
    // ═══════════════════════════════════════════════════════════════

    function createAllPrograms(gl) {
        const programs = {};

        // Helix strand program
        programs.helix = createProgram(gl, HELIX_VERTEX, HELIX_FRAGMENT);
        if (programs.helix) {
            programs.helix.uniforms = getUniformLocations(gl, programs.helix, [
                'u_mvp', 'u_model', 'u_time', 'u_colorFront', 'u_colorBack',
                'u_alpha', 'u_pulsePosition', 'u_pulseIntensity', 'u_pulseWidth',
                'u_backgroundDim'
            ]);
            programs.helix.attributes = getAttributeLocations(gl, programs.helix, [
                'a_position', 'a_progress', 'a_strand'
            ]);
        }

        // Node program
        programs.node = createProgram(gl, NODE_VERTEX, NODE_FRAGMENT);
        if (programs.node) {
            programs.node.uniforms = getUniformLocations(gl, programs.node, [
                'u_mvp', 'u_nodeCenter', 'u_scale', 'u_time', 'u_color',
                'u_alpha', 'u_isSelected', 'u_isHovered', 'u_isDimmed'
            ]);
            programs.node.attributes = getAttributeLocations(gl, programs.node, [
                'a_position', 'a_texCoord'
            ]);
        }

        // Particle program
        programs.particle = createProgram(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT);
        if (programs.particle) {
            programs.particle.uniforms = getUniformLocations(gl, programs.particle, [
                'u_mvp', 'u_time', 'u_pointScale', 'u_colorAmbient',
                'u_colorStreak', 'u_colorSpark'
            ]);
            programs.particle.attributes = getAttributeLocations(gl, programs.particle, [
                'a_position', 'a_size', 'a_alpha', 'a_type'
            ]);
        }

        // Streak program
        programs.streak = createProgram(gl, STREAK_VERTEX, STREAK_FRAGMENT);
        if (programs.streak) {
            programs.streak.uniforms = getUniformLocations(gl, programs.streak, [
                'u_mvp', 'u_time', 'u_color'
            ]);
            programs.streak.attributes = getAttributeLocations(gl, programs.streak, [
                'a_position', 'a_prevPosition', 'a_alpha'
            ]);
        }

        // Card program
        programs.card = createProgram(gl, CARD_VERTEX, CARD_FRAGMENT);
        if (programs.card) {
            programs.card.uniforms = getUniformLocations(gl, programs.card, [
                'u_mvp', 'u_cardPosition', 'u_cardSize', 'u_cardRotation',
                'u_texture', 'u_opacity', 'u_time', 'u_glassColor', 'u_glassOpacity'
            ]);
            programs.card.attributes = getAttributeLocations(gl, programs.card, [
                'a_position', 'a_texCoord'
            ]);
        }

        // Fullscreen programs (bloom pipeline)
        programs.brightnessExtract = createProgram(gl, FULLSCREEN_VERTEX, BRIGHTNESS_EXTRACT_FRAGMENT);
        if (programs.brightnessExtract) {
            programs.brightnessExtract.uniforms = getUniformLocations(gl, programs.brightnessExtract, [
                'u_texture', 'u_threshold'
            ]);
            programs.brightnessExtract.attributes = getAttributeLocations(gl, programs.brightnessExtract, [
                'a_position', 'a_texCoord'
            ]);
        }

        programs.blurH = createProgram(gl, FULLSCREEN_VERTEX, BLUR_HORIZONTAL_FRAGMENT);
        if (programs.blurH) {
            programs.blurH.uniforms = getUniformLocations(gl, programs.blurH, [
                'u_texture', 'u_texelSize', 'u_blurSize'
            ]);
            programs.blurH.attributes = getAttributeLocations(gl, programs.blurH, [
                'a_position', 'a_texCoord'
            ]);
        }

        programs.blurV = createProgram(gl, FULLSCREEN_VERTEX, BLUR_VERTICAL_FRAGMENT);
        if (programs.blurV) {
            programs.blurV.uniforms = getUniformLocations(gl, programs.blurV, [
                'u_texture', 'u_texelSize', 'u_blurSize'
            ]);
            programs.blurV.attributes = getAttributeLocations(gl, programs.blurV, [
                'a_position', 'a_texCoord'
            ]);
        }

        programs.composite = createProgram(gl, FULLSCREEN_VERTEX, BLOOM_COMPOSITE_FRAGMENT);
        if (programs.composite) {
            programs.composite.uniforms = getUniformLocations(gl, programs.composite, [
                'u_sceneTexture', 'u_bloomTexture', 'u_bloomIntensity', 'u_exposure'
            ]);
            programs.composite.attributes = getAttributeLocations(gl, programs.composite, [
                'a_position', 'a_texCoord'
            ]);
        }

        // Fog program
        programs.fog = createProgram(gl, FULLSCREEN_VERTEX, FOG_FRAGMENT);
        if (programs.fog) {
            programs.fog.uniforms = getUniformLocations(gl, programs.fog, [
                'u_sceneTexture', 'u_depthTexture', 'u_fogDensity',
                'u_fogStart', 'u_fogEnd', 'u_fogColor', 'u_time'
            ]);
            programs.fog.attributes = getAttributeLocations(gl, programs.fog, [
                'a_position', 'a_texCoord'
            ]);
        }

        // Ripple program
        programs.ripple = createProgram(gl, FULLSCREEN_VERTEX, RIPPLE_FRAGMENT);
        if (programs.ripple) {
            programs.ripple.uniforms = getUniformLocations(gl, programs.ripple, [
                'u_texture', 'u_rippleCenter', 'u_rippleTime', 'u_rippleActive'
            ]);
            programs.ripple.attributes = getAttributeLocations(gl, programs.ripple, [
                'a_position', 'a_texCoord'
            ]);
        }

        // Background program
        programs.background = createProgram(gl, FULLSCREEN_VERTEX, BACKGROUND_FRAGMENT);
        if (programs.background) {
            programs.background.uniforms = getUniformLocations(gl, programs.background, [
                'u_colorTop', 'u_colorBottom', 'u_time'
            ]);
            programs.background.attributes = getAttributeLocations(gl, programs.background, [
                'a_position', 'a_texCoord'
            ]);
        }

        return programs;
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        // Shader sources (for custom compilation)
        sources: {
            helix: { vertex: HELIX_VERTEX, fragment: HELIX_FRAGMENT },
            node: { vertex: NODE_VERTEX, fragment: NODE_FRAGMENT },
            particle: { vertex: PARTICLE_VERTEX, fragment: PARTICLE_FRAGMENT },
            streak: { vertex: STREAK_VERTEX, fragment: STREAK_FRAGMENT },
            card: { vertex: CARD_VERTEX, fragment: CARD_FRAGMENT },
            fullscreen: { vertex: FULLSCREEN_VERTEX },
            brightnessExtract: { fragment: BRIGHTNESS_EXTRACT_FRAGMENT },
            blurH: { fragment: BLUR_HORIZONTAL_FRAGMENT },
            blurV: { fragment: BLUR_VERTICAL_FRAGMENT },
            composite: { fragment: BLOOM_COMPOSITE_FRAGMENT },
            fog: { fragment: FOG_FRAGMENT },
            ripple: { fragment: RIPPLE_FRAGMENT },
            background: { fragment: BACKGROUND_FRAGMENT }
        },

        // Utilities
        compileShader,
        createProgram,
        getUniformLocations,
        getAttributeLocations,

        // Factory
        createAllPrograms
    };

})();

// Export for global access
window.ShaderProgramsV8 = ShaderProgramsV8;
