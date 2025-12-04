// ============================================================
// V8 NEURAL HELIX - Text Renderer
// Canvas-to-WebGL texture text rendering for holographic card
// ============================================================

const TextRenderer = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const TEXT_CONFIG = {
        // Default text styles
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        titleSize: 28,
        labelSize: 11,
        bodySize: 15,
        lineHeight: 1.6,

        // Canvas dimensions (power of 2 for WebGL)
        canvasWidth: 512,
        canvasHeight: 512,

        // Padding
        padding: 32,

        // Colors
        titleColor: '#FFFFFF',
        labelColor: 'rgba(0, 217, 255, 0.5)',
        bodyColor: 'rgba(255, 255, 255, 0.85)',

        // Max lines for description
        maxDescriptionLines: 6
    };

    // ═══════════════════════════════════════════════════════════════
    // TEXT RENDERER CLASS
    // ═══════════════════════════════════════════════════════════════

    class TextRendererClass {
        constructor(gl, config = {}) {
            this.gl = gl;
            this.config = { ...TEXT_CONFIG, ...config };

            // Offscreen canvas for text rendering
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.config.canvasWidth;
            this.canvas.height = this.config.canvasHeight;
            this.ctx = this.canvas.getContext('2d');

            // WebGL texture
            this.texture = null;
            this.createTexture();

            // Cache to avoid re-rendering same content
            this.contentCache = null;
            this.cacheKey = null;
        }

        createTexture() {
            const gl = this.gl;

            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            // Initialize with empty data
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                this.config.canvasWidth, this.config.canvasHeight, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null
            );

            // Texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        // ─────────────────────────────────────────────────────────────
        // TEXT RENDERING
        // ─────────────────────────────────────────────────────────────

        renderCardContent(data) {
            // Check cache
            const cacheKey = JSON.stringify(data);
            if (this.cacheKey === cacheKey) {
                return this.texture;
            }

            const { ctx, config } = this;
            const { canvasWidth, canvasHeight, padding } = config;

            // Clear canvas (transparent)
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Enable font smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            let y = padding;

            // Render label (component type)
            if (data.label) {
                ctx.font = `500 ${config.labelSize}px ${config.fontFamily}`;
                ctx.fillStyle = config.labelColor;
                ctx.textBaseline = 'top';
                ctx.letterSpacing = '0.15em';

                ctx.fillText(data.label.toUpperCase(), padding, y);
                y += config.labelSize + 14;
            }

            // Render title
            if (data.title) {
                ctx.font = `600 ${config.titleSize}px ${config.fontFamily}`;
                ctx.fillStyle = config.titleColor;
                ctx.letterSpacing = '-0.01em';

                // Word wrap title if needed
                const titleLines = this.wrapText(data.title, canvasWidth - padding * 2, config.titleSize);
                titleLines.forEach(line => {
                    ctx.fillText(line, padding, y);
                    y += config.titleSize * 1.2;
                });

                y += 18;
            }

            // Render description
            if (data.description) {
                ctx.font = `400 ${config.bodySize}px ${config.fontFamily}`;
                ctx.fillStyle = config.bodyColor;
                ctx.letterSpacing = '0';

                const descLines = this.wrapText(
                    data.description,
                    canvasWidth - padding * 2,
                    config.bodySize
                );

                // Limit lines
                const linesToRender = descLines.slice(0, config.maxDescriptionLines);
                const lineHeightPx = config.bodySize * config.lineHeight;

                linesToRender.forEach((line, i) => {
                    // Add ellipsis to last line if truncated
                    if (i === config.maxDescriptionLines - 1 && descLines.length > config.maxDescriptionLines) {
                        line = line.slice(0, -3) + '...';
                    }
                    ctx.fillText(line, padding, y);
                    y += lineHeightPx;
                });
            }

            // Upload to WebGL texture
            this.uploadTexture();

            // Update cache
            this.cacheKey = cacheKey;
            this.contentCache = data;

            return this.texture;
        }

        wrapText(text, maxWidth, fontSize) {
            const ctx = this.ctx;
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            ctx.font = `400 ${fontSize}px ${this.config.fontFamily}`;

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines;
        }

        uploadTexture() {
            const gl = this.gl;

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, this.canvas
            );
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        // ─────────────────────────────────────────────────────────────
        // SIMPLE TEXT TEXTURE (for labels, etc.)
        // ─────────────────────────────────────────────────────────────

        createSimpleTextTexture(text, options = {}) {
            const {
                fontSize = 14,
                color = '#FFFFFF',
                backgroundColor = 'transparent',
                padding = 8,
                maxWidth = 256
            } = options;

            const { ctx, config } = this;

            // Measure text
            ctx.font = `500 ${fontSize}px ${config.fontFamily}`;
            const metrics = ctx.measureText(text);
            const textWidth = Math.min(metrics.width, maxWidth);
            const textHeight = fontSize;

            // Canvas size (power of 2 preferred)
            const canvasW = Math.pow(2, Math.ceil(Math.log2(textWidth + padding * 2)));
            const canvasH = Math.pow(2, Math.ceil(Math.log2(textHeight + padding * 2)));

            // Resize canvas temporarily
            this.canvas.width = canvasW;
            this.canvas.height = canvasH;

            // Clear
            ctx.clearRect(0, 0, canvasW, canvasH);

            // Background
            if (backgroundColor !== 'transparent') {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvasW, canvasH);
            }

            // Text
            ctx.font = `500 ${fontSize}px ${config.fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(text, canvasW / 2, canvasH / 2);

            // Create new texture
            const gl = this.gl;
            const texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);

            // Restore canvas size
            this.canvas.width = this.config.canvasWidth;
            this.canvas.height = this.config.canvasHeight;

            return {
                texture,
                width: canvasW,
                height: canvasH,
                aspectRatio: canvasW / canvasH
            };
        }

        // ─────────────────────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────────────────────

        getTexture() {
            return this.texture;
        }

        getAspectRatio() {
            return this.config.canvasWidth / this.config.canvasHeight;
        }

        getCanvasSize() {
            return {
                width: this.config.canvasWidth,
                height: this.config.canvasHeight
            };
        }

        // ─────────────────────────────────────────────────────────────
        // CLEANUP
        // ─────────────────────────────────────────────────────────────

        clearCache() {
            this.cacheKey = null;
            this.contentCache = null;
        }

        destroy() {
            if (this.texture) {
                this.gl.deleteTexture(this.texture);
                this.texture = null;
            }
            this.canvas = null;
            this.ctx = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        TextRenderer: TextRendererClass,
        CONFIG: TEXT_CONFIG
    };

})();

// Export for global access
window.TextRenderer = TextRenderer;
