// ============================================================
// V8 NEURAL HELIX - Holographic Card
// WebGL-rendered floating detail card with glass effects
// ============================================================

const HolographicCard = (function() {
    'use strict';

    const { vec3, mat4, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const CARD_CONFIG = {
        // Card dimensions in world units
        width: 0.6,
        height: 0.6,

        // Position offset from anchor node
        offsetX: 0.5,        // To the right
        offsetY: 0.1,        // Slightly up
        offsetZ: 0.0,

        // Animation
        showDuration: 0.5,   // seconds
        hideDuration: 0.3,
        hoverBob: 0.01,      // Subtle floating motion
        bobSpeed: 2.0,

        // Glass appearance
        glassColor: [0.03, 0.05, 0.11],  // Dark blue-black
        glassOpacity: 0.35,

        // Rotation (face slightly toward camera)
        baseRotation: -0.15  // radians
    };

    // ═══════════════════════════════════════════════════════════════
    // HOLOGRAPHIC CARD CLASS
    // ═══════════════════════════════════════════════════════════════

    class HolographicCardClass {
        constructor(gl, program, textRenderer, config = {}) {
            this.gl = gl;
            this.program = program;
            this.textRenderer = textRenderer;
            this.config = { ...CARD_CONFIG, ...config };

            // Card state
            this.visible = false;
            this.opacity = 0;
            this.targetOpacity = 0;
            this.scale = 0.8;
            this.targetScale = 0.8;

            // Position
            this.anchorNode = null;
            this.anchorPosition = vec3.create(0, 0, 0);
            this.position = vec3.create(0, 0, 0);
            this.rotation = this.config.baseRotation;

            // Content
            this.currentContent = null;
            this.texture = null;

            // Animation time
            this.bobTime = 0;

            // Create geometry
            this.vertexBuffer = null;
            this.indexBuffer = null;
            this.createGeometry();
        }

        createGeometry() {
            const gl = this.gl;

            // Quad vertices: position (xyz) + texcoord (uv)
            // Centered on origin, will be transformed by uniforms
            const halfW = 0.5;
            const halfH = 0.5;

            const vertices = new Float32Array([
                // Position         // TexCoord
                -halfW, -halfH, 0,  0, 1,  // Bottom-left (flip Y for texture)
                 halfW, -halfH, 0,  1, 1,  // Bottom-right
                 halfW,  halfH, 0,  1, 0,  // Top-right
                -halfW,  halfH, 0,  0, 0   // Top-left
            ]);

            const indices = new Uint16Array([
                0, 1, 2,  // First triangle
                0, 2, 3   // Second triangle
            ]);

            // Create buffers
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }

        // ─────────────────────────────────────────────────────────────
        // SHOW / HIDE
        // ─────────────────────────────────────────────────────────────

        show(nodeData, anchorPosition) {
            this.visible = true;
            this.targetOpacity = 1;
            this.targetScale = 1;

            // Set anchor
            this.anchorPosition = vec3.create(
                anchorPosition.x || 0,
                anchorPosition.y || 0,
                anchorPosition.z || 0
            );

            // Calculate card position (offset from anchor)
            this.updatePosition();

            // Update content
            this.setContent(nodeData);
        }

        hide() {
            this.targetOpacity = 0;
            this.targetScale = 0.8;

            // Mark invisible after animation completes
            setTimeout(() => {
                if (this.targetOpacity === 0) {
                    this.visible = false;
                    this.currentContent = null;
                }
            }, this.config.hideDuration * 1000);
        }

        setContent(data) {
            if (!data) return;

            this.currentContent = data;

            // Render text to texture
            if (this.textRenderer) {
                this.texture = this.textRenderer.renderCardContent({
                    label: data.label || 'COMPONENT',
                    title: data.title || data.key || 'Unknown',
                    description: data.description || ''
                });
            }
        }

        // ─────────────────────────────────────────────────────────────
        // UPDATE
        // ─────────────────────────────────────────────────────────────

        update(deltaTime, time) {
            const { showDuration, hideDuration, hoverBob, bobSpeed } = this.config;

            // Smooth opacity transition
            const fadeSmooth = this.targetOpacity > 0.5
                ? 1 - Math.pow(0.01, deltaTime / showDuration)
                : 1 - Math.pow(0.01, deltaTime / hideDuration);

            this.opacity = lerp(this.opacity, this.targetOpacity, fadeSmooth);
            this.scale = lerp(this.scale, this.targetScale, fadeSmooth);

            // Floating bob animation
            this.bobTime = time * bobSpeed;

            // Update position with bob
            this.updatePosition();
        }

        updatePosition() {
            const { offsetX, offsetY, offsetZ, hoverBob } = this.config;

            // Base position (offset from anchor)
            this.position.x = this.anchorPosition.x + offsetX;
            this.position.y = this.anchorPosition.y + offsetY + Math.sin(this.bobTime) * hoverBob;
            this.position.z = this.anchorPosition.z + offsetZ;
        }

        setAnchorPosition(position) {
            this.anchorPosition = vec3.create(
                position.x || 0,
                position.y || 0,
                position.z || 0
            );
            this.updatePosition();
        }

        // ─────────────────────────────────────────────────────────────
        // RENDER
        // ─────────────────────────────────────────────────────────────

        render(mvpMatrix, time) {
            if (!this.visible || this.opacity < 0.01) return;

            const gl = this.gl;
            const program = this.program;

            if (!program) return;

            gl.useProgram(program);

            // Setup vertex attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

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

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            // Set uniforms
            gl.uniformMatrix4fv(program.uniforms.u_mvp, false, mvpMatrix);
            gl.uniform3f(
                program.uniforms.u_cardPosition,
                this.position.x, this.position.y, this.position.z
            );
            gl.uniform2f(
                program.uniforms.u_cardSize,
                this.config.width * this.scale,
                this.config.height * this.scale
            );
            gl.uniform1f(program.uniforms.u_cardRotation, this.rotation);
            gl.uniform1f(program.uniforms.u_opacity, this.opacity);
            gl.uniform1f(program.uniforms.u_time, time);
            gl.uniform3fv(program.uniforms.u_glassColor, this.config.glassColor);
            gl.uniform1f(program.uniforms.u_glassOpacity, this.config.glassOpacity);

            // Bind texture
            if (this.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.uniform1i(program.uniforms.u_texture, 0);
            }

            // Enable blending for transparency
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            // Disable depth write (card should render on top)
            gl.depthMask(false);

            // Draw
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            // Restore state
            gl.depthMask(true);

            // Cleanup
            if (posLoc >= 0) gl.disableVertexAttribArray(posLoc);
            if (uvLoc >= 0) gl.disableVertexAttribArray(uvLoc);
        }

        // ─────────────────────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────────────────────

        isVisible() {
            return this.visible && this.opacity > 0.01;
        }

        getOpacity() {
            return this.opacity;
        }

        getPosition() {
            return this.position;
        }

        getContent() {
            return this.currentContent;
        }

        // ─────────────────────────────────────────────────────────────
        // CLEANUP
        // ─────────────────────────────────────────────────────────────

        destroy() {
            const gl = this.gl;

            if (this.vertexBuffer) {
                gl.deleteBuffer(this.vertexBuffer);
                this.vertexBuffer = null;
            }

            if (this.indexBuffer) {
                gl.deleteBuffer(this.indexBuffer);
                this.indexBuffer = null;
            }

            // Don't delete texture - owned by TextRenderer
            this.texture = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        HolographicCard: HolographicCardClass,
        CONFIG: CARD_CONFIG
    };

})();

// Export for global access
window.HolographicCard = HolographicCard;
