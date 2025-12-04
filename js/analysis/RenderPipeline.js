// ============================================================
// V8 NEURAL HELIX - Multi-Pass Render Pipeline
// Framebuffer management for bloom and post-processing
// ============================================================

const RenderPipeline = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // PIPELINE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const PIPELINE_CONFIG = {
        // Bloom settings
        bloomThreshold: 0.6,
        bloomIntensity: 0.8,
        blurSize: 1.5,
        blurPasses: 2,          // Number of blur iterations

        // Resolution scaling
        bloomScale: 0.5,        // Bloom at half resolution

        // Exposure and tone mapping
        exposure: 1.2,

        // Fog settings
        fogEnabled: true,
        fogDensity: 0.15,
        fogStart: 0.3,
        fogEnd: 1.0,
        fogColor: [0.0, 0.02, 0.04]
    };

    // ═══════════════════════════════════════════════════════════════
    // FRAMEBUFFER CLASS
    // ═══════════════════════════════════════════════════════════════

    class Framebuffer {
        constructor(gl, width, height, options = {}) {
            this.gl = gl;
            this.width = width;
            this.height = height;
            this.hasDepth = options.depth !== false;
            this.floatTexture = options.float === true;

            this.framebuffer = null;
            this.texture = null;
            this.depthBuffer = null;

            this.create();
        }

        create() {
            const gl = this.gl;

            // Create framebuffer
            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

            // Create color texture
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            // Texture format
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            gl.texImage2D(
                gl.TEXTURE_2D, 0, internalFormat,
                this.width, this.height, 0,
                format, type, null
            );

            // Texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Attach texture to framebuffer
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, this.texture, 0
            );

            // Create depth buffer if needed
            if (this.hasDepth) {
                this.depthBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
                gl.renderbufferStorage(
                    gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                    this.width, this.height
                );
                gl.framebufferRenderbuffer(
                    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                    gl.RENDERBUFFER, this.depthBuffer
                );
            }

            // Check framebuffer status
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (status !== gl.FRAMEBUFFER_COMPLETE) {
                console.error('Framebuffer incomplete:', status);
            }

            // Unbind
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }

        bind() {
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, this.width, this.height);
        }

        unbind() {
            this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        resize(width, height) {
            if (this.width === width && this.height === height) return;

            this.destroy();
            this.width = width;
            this.height = height;
            this.create();
        }

        destroy() {
            const gl = this.gl;

            if (this.framebuffer) {
                gl.deleteFramebuffer(this.framebuffer);
                this.framebuffer = null;
            }

            if (this.texture) {
                gl.deleteTexture(this.texture);
                this.texture = null;
            }

            if (this.depthBuffer) {
                gl.deleteRenderbuffer(this.depthBuffer);
                this.depthBuffer = null;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER PIPELINE CLASS
    // ═══════════════════════════════════════════════════════════════

    class Pipeline {
        constructor(gl, width, height, programs) {
            this.gl = gl;
            this.width = width;
            this.height = height;
            this.programs = programs;
            this.config = { ...PIPELINE_CONFIG };

            // Calculate bloom resolution
            this.bloomWidth = Math.floor(width * this.config.bloomScale);
            this.bloomHeight = Math.floor(height * this.config.bloomScale);

            // Create framebuffers
            this.framebuffers = {};
            this.createFramebuffers();

            // Create fullscreen quad for post-processing
            this.quadBuffer = this.createQuadBuffer();
        }

        createFramebuffers() {
            const gl = this.gl;

            // Scene framebuffer (full resolution with depth)
            this.framebuffers.scene = new Framebuffer(
                gl, this.width, this.height, { depth: true }
            );

            // Brightness extraction (half resolution)
            this.framebuffers.brightness = new Framebuffer(
                gl, this.bloomWidth, this.bloomHeight, { depth: false }
            );

            // Blur framebuffers (half resolution)
            this.framebuffers.blurH = new Framebuffer(
                gl, this.bloomWidth, this.bloomHeight, { depth: false }
            );

            this.framebuffers.blurV = new Framebuffer(
                gl, this.bloomWidth, this.bloomHeight, { depth: false }
            );

            // Ping-pong buffer for multi-pass blur
            this.framebuffers.blurPingPong = new Framebuffer(
                gl, this.bloomWidth, this.bloomHeight, { depth: false }
            );
        }

        createQuadBuffer() {
            const gl = this.gl;

            // Fullscreen quad vertices: position (xy) + texcoord (uv)
            const vertices = new Float32Array([
                // Position    // TexCoord
                -1, -1,        0, 0,
                 1, -1,        1, 0,
                -1,  1,        0, 1,
                 1,  1,        1, 1
            ]);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            return buffer;
        }

        setupQuadAttributes(program) {
            const gl = this.gl;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

            const posLoc = program.attributes.a_position;
            const uvLoc = program.attributes.a_texCoord;

            if (posLoc >= 0) {
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
            }

            if (uvLoc >= 0) {
                gl.enableVertexAttribArray(uvLoc);
                gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
            }
        }

        drawQuad() {
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }

        // ─────────────────────────────────────────────────────────────
        // RENDER PASSES
        // ─────────────────────────────────────────────────────────────

        beginScenePass() {
            const gl = this.gl;

            this.framebuffers.scene.bind();
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        endScenePass() {
            const gl = this.gl;
            gl.disable(gl.DEPTH_TEST);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        // Extract bright areas for bloom
        brightnessPass() {
            const gl = this.gl;
            const program = this.programs.brightnessExtract;

            if (!program) return;

            this.framebuffers.brightness.bind();
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);
            this.setupQuadAttributes(program);

            // Bind scene texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.framebuffers.scene.texture);
            gl.uniform1i(program.uniforms.u_texture, 0);

            // Threshold
            gl.uniform1f(program.uniforms.u_threshold, this.config.bloomThreshold);

            this.drawQuad();
        }

        // Gaussian blur passes
        blurPass() {
            const gl = this.gl;
            const programH = this.programs.blurH;
            const programV = this.programs.blurV;

            if (!programH || !programV) return;

            const texelSize = [
                1.0 / this.bloomWidth,
                1.0 / this.bloomHeight
            ];

            let readFB = this.framebuffers.brightness;
            let writeFB = this.framebuffers.blurH;

            for (let pass = 0; pass < this.config.blurPasses; pass++) {
                // Horizontal blur
                writeFB.bind();
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(programH);
                this.setupQuadAttributes(programH);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, readFB.texture);
                gl.uniform1i(programH.uniforms.u_texture, 0);
                gl.uniform2fv(programH.uniforms.u_texelSize, texelSize);
                gl.uniform1f(programH.uniforms.u_blurSize, this.config.blurSize);

                this.drawQuad();

                // Vertical blur
                readFB = writeFB;
                writeFB = pass === 0 ? this.framebuffers.blurV : this.framebuffers.blurPingPong;

                writeFB.bind();
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(programV);
                this.setupQuadAttributes(programV);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, readFB.texture);
                gl.uniform1i(programV.uniforms.u_texture, 0);
                gl.uniform2fv(programV.uniforms.u_texelSize, texelSize);
                gl.uniform1f(programV.uniforms.u_blurSize, this.config.blurSize);

                this.drawQuad();

                // Swap for next pass
                readFB = writeFB;
                writeFB = this.framebuffers.blurH;
            }

            // Final blurred result is in blurV or blurPingPong
            this.finalBloomTexture = readFB.texture;
        }

        // Composite scene + bloom
        compositePass(targetFramebuffer = null) {
            const gl = this.gl;
            const program = this.programs.composite;

            if (!program) {
                // Fallback: just render scene directly
                this.renderToScreen(this.framebuffers.scene.texture);
                return;
            }

            if (targetFramebuffer) {
                targetFramebuffer.bind();
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, this.width, this.height);
            }

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);
            this.setupQuadAttributes(program);

            // Scene texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.framebuffers.scene.texture);
            gl.uniform1i(program.uniforms.u_sceneTexture, 0);

            // Bloom texture
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.finalBloomTexture || this.framebuffers.blurV.texture);
            gl.uniform1i(program.uniforms.u_bloomTexture, 1);

            // Parameters
            gl.uniform1f(program.uniforms.u_bloomIntensity, this.config.bloomIntensity);
            gl.uniform1f(program.uniforms.u_exposure, this.config.exposure);

            this.drawQuad();
        }

        // Simple texture-to-screen render (fallback)
        renderToScreen(texture) {
            const gl = this.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.width, this.height);

            // Use a simple pass-through if composite program isn't available
            const program = this.programs.brightnessExtract; // Reuse for pass-through
            if (!program) return;

            gl.useProgram(program);
            this.setupQuadAttributes(program);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(program.uniforms.u_texture, 0);
            gl.uniform1f(program.uniforms.u_threshold, 0.0); // Pass through all

            this.drawQuad();
        }

        // ─────────────────────────────────────────────────────────────
        // FULL PIPELINE EXECUTION
        // ─────────────────────────────────────────────────────────────

        executeBloomPipeline() {
            // Extract bright areas
            this.brightnessPass();

            // Blur
            this.blurPass();

            // Composite to screen
            this.compositePass();
        }

        // ─────────────────────────────────────────────────────────────
        // POST-PROCESSING EFFECTS
        // ─────────────────────────────────────────────────────────────

        applyRippleEffect(rippleCenter, rippleTime, rippleActive) {
            const gl = this.gl;
            const program = this.programs.ripple;

            if (!program || !rippleActive) return;

            // Render to a temporary buffer, then apply ripple to screen
            // For simplicity, apply directly to current framebuffer content

            gl.useProgram(program);
            this.setupQuadAttributes(program);

            gl.uniform2fv(program.uniforms.u_rippleCenter, rippleCenter);
            gl.uniform1f(program.uniforms.u_rippleTime, rippleTime);
            gl.uniform1f(program.uniforms.u_rippleActive, rippleActive ? 1.0 : 0.0);
        }

        // ─────────────────────────────────────────────────────────────
        // RESIZE
        // ─────────────────────────────────────────────────────────────

        resize(width, height) {
            if (this.width === width && this.height === height) return;

            this.width = width;
            this.height = height;
            this.bloomWidth = Math.floor(width * this.config.bloomScale);
            this.bloomHeight = Math.floor(height * this.config.bloomScale);

            // Resize all framebuffers
            this.framebuffers.scene.resize(width, height);
            this.framebuffers.brightness.resize(this.bloomWidth, this.bloomHeight);
            this.framebuffers.blurH.resize(this.bloomWidth, this.bloomHeight);
            this.framebuffers.blurV.resize(this.bloomWidth, this.bloomHeight);
            this.framebuffers.blurPingPong.resize(this.bloomWidth, this.bloomHeight);
        }

        // ─────────────────────────────────────────────────────────────
        // CONFIGURATION
        // ─────────────────────────────────────────────────────────────

        setBloomIntensity(intensity) {
            this.config.bloomIntensity = intensity;
        }

        setBloomThreshold(threshold) {
            this.config.bloomThreshold = threshold;
        }

        setExposure(exposure) {
            this.config.exposure = exposure;
        }

        // ─────────────────────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────────────────────

        getSceneTexture() {
            return this.framebuffers.scene.texture;
        }

        getBloomTexture() {
            return this.finalBloomTexture || this.framebuffers.blurV.texture;
        }

        // ─────────────────────────────────────────────────────────────
        // CLEANUP
        // ─────────────────────────────────────────────────────────────

        destroy() {
            const gl = this.gl;

            // Destroy all framebuffers
            Object.values(this.framebuffers).forEach(fb => fb.destroy());

            // Delete quad buffer
            if (this.quadBuffer) {
                gl.deleteBuffer(this.quadBuffer);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        Framebuffer,
        Pipeline,
        CONFIG: PIPELINE_CONFIG
    };

})();

// Export for global access
window.RenderPipeline = RenderPipeline;
