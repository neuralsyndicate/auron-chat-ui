// ============================================================
// V8 NEURAL HELIX - Particle Systems
// Ambient, streak, spark particles and glow pulses
// ============================================================

const ParticleSystemsV8 = (function() {
    'use strict';

    const { vec3, lerp } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const PARTICLE_CONFIG = {
        // Ambient particles (floating dust)
        ambient: {
            count: 25,
            sizeMin: 2,
            sizeMax: 6,
            alphaMin: 0.03,
            alphaMax: 0.12,
            driftSpeed: 0.0005,
            color: [0.0, 0.85, 1.0]  // Cyan
        },

        // Streak particles (longer trailing)
        streak: {
            count: 12,
            sizeMin: 3,
            sizeMax: 8,
            alphaMin: 0.05,
            alphaMax: 0.15,
            speed: 0.002,
            trailLength: 5,
            color: [0.8, 0.95, 1.0]  // White-cyan
        },

        // Neural sparks (quick flashes between nodes)
        spark: {
            maxActive: 3,
            spawnInterval: 2500,    // ms between spawns
            duration: 800,          // ms travel time
            sizeMin: 4,
            sizeMax: 10,
            color: [1.0, 0.95, 0.7] // Yellow-white
        },

        // Glow pulse (traveling through helix strands)
        pulse: {
            autoSpawnInterval: 4000,  // ms
            speed: 0.3,               // units per second
            width: 0.15,              // pulse spread
            intensityMax: 1.0,
            bidirectional: true       // spawn from both ends on selection
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // AMBIENT PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════

    class AmbientParticleSystem {
        constructor(gl, config = {}) {
            this.gl = gl;
            this.config = { ...PARTICLE_CONFIG.ambient, ...config };
            this.particles = [];
            this.buffer = null;
            this.bufferData = null;

            this.initialize();
        }

        initialize() {
            const gl = this.gl;
            const { count, sizeMin, sizeMax, alphaMin, alphaMax } = this.config;

            // Create particles
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: (Math.random() - 0.5) * 3,
                    y: (Math.random() - 0.5) * 1.5,
                    z: (Math.random() - 0.5) * 1.5,
                    size: sizeMin + Math.random() * (sizeMax - sizeMin),
                    alpha: alphaMin + Math.random() * (alphaMax - alphaMin),
                    phase: Math.random() * Math.PI * 2,
                    driftX: (Math.random() - 0.5) * 2,
                    driftY: (Math.random() - 0.5) * 2,
                    type: 0  // Ambient type
                });
            }

            // Create buffer (position.xyz, size, alpha, type)
            this.bufferData = new Float32Array(count * 6);
            this.buffer = gl.createBuffer();
            this.updateBuffer();
        }

        update(time, deltaTime) {
            const { driftSpeed } = this.config;

            this.particles.forEach((p, i) => {
                // Slow drift motion
                p.x += Math.sin(time * 0.5 + p.phase) * p.driftX * driftSpeed;
                p.y += Math.cos(time * 0.3 + p.phase) * p.driftY * driftSpeed;
                p.z += Math.sin(time * 0.4 + p.phase + 1) * driftSpeed * 0.5;

                // Boundary wrap
                if (Math.abs(p.x) > 1.6) p.x *= -0.9;
                if (Math.abs(p.y) > 0.8) p.y *= -0.9;
                if (Math.abs(p.z) > 0.8) p.z *= -0.9;

                // Subtle alpha pulse
                const alphaPulse = 0.8 + Math.sin(time * 2 + p.phase) * 0.2;

                // Update buffer data
                const offset = i * 6;
                this.bufferData[offset] = p.x;
                this.bufferData[offset + 1] = p.y;
                this.bufferData[offset + 2] = p.z;
                this.bufferData[offset + 3] = p.size;
                this.bufferData[offset + 4] = p.alpha * alphaPulse;
                this.bufferData[offset + 5] = p.type;
            });

            this.updateBuffer();
        }

        updateBuffer() {
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
        }

        getBuffer() {
            return this.buffer;
        }

        getCount() {
            return this.particles.length;
        }

        destroy() {
            if (this.buffer) {
                this.gl.deleteBuffer(this.buffer);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STREAK PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════

    class StreakParticleSystem {
        constructor(gl, config = {}) {
            this.gl = gl;
            this.config = { ...PARTICLE_CONFIG.streak, ...config };
            this.streaks = [];
            this.buffer = null;
            this.bufferData = null;

            this.initialize();
        }

        initialize() {
            const gl = this.gl;
            const { count, sizeMin, sizeMax, alphaMin, alphaMax, trailLength } = this.config;

            // Create streaks with trail history
            for (let i = 0; i < count; i++) {
                const streak = {
                    positions: [],
                    velocity: {
                        x: (Math.random() - 0.5) * 0.01,
                        y: (Math.random() - 0.5) * 0.005,
                        z: (Math.random() - 0.5) * 0.005
                    },
                    size: sizeMin + Math.random() * (sizeMax - sizeMin),
                    alpha: alphaMin + Math.random() * (alphaMax - alphaMin),
                    type: 1  // Streak type
                };

                // Initialize trail positions
                const startX = (Math.random() - 0.5) * 2.5;
                const startY = (Math.random() - 0.5) * 1.2;
                const startZ = (Math.random() - 0.5) * 0.8;

                for (let j = 0; j < trailLength; j++) {
                    streak.positions.push({ x: startX, y: startY, z: startZ });
                }

                this.streaks.push(streak);
            }

            // Buffer for all trail points
            const totalPoints = count * trailLength;
            this.bufferData = new Float32Array(totalPoints * 6);
            this.buffer = gl.createBuffer();
            this.updateBuffer();
        }

        update(time, deltaTime) {
            const { speed, trailLength } = this.config;

            this.streaks.forEach((streak, si) => {
                // Update head position
                const head = streak.positions[0];
                head.x += streak.velocity.x + Math.sin(time + si) * 0.001;
                head.y += streak.velocity.y + Math.cos(time * 0.7 + si) * 0.0005;
                head.z += streak.velocity.z;

                // Boundary behavior - wrap with momentum change
                if (Math.abs(head.x) > 1.5) {
                    streak.velocity.x *= -0.8;
                    head.x = Math.sign(head.x) * 1.5;
                }
                if (Math.abs(head.y) > 0.7) {
                    streak.velocity.y *= -0.8;
                    head.y = Math.sign(head.y) * 0.7;
                }
                if (Math.abs(head.z) > 0.5) {
                    streak.velocity.z *= -0.8;
                    head.z = Math.sign(head.z) * 0.5;
                }

                // Shift trail positions (tail follows head)
                for (let i = trailLength - 1; i > 0; i--) {
                    const current = streak.positions[i];
                    const prev = streak.positions[i - 1];
                    current.x = lerp(current.x, prev.x, 0.3);
                    current.y = lerp(current.y, prev.y, 0.3);
                    current.z = lerp(current.z, prev.z, 0.3);
                }

                // Update buffer data
                for (let i = 0; i < trailLength; i++) {
                    const pos = streak.positions[i];
                    const trailFade = 1 - (i / trailLength);
                    const offset = (si * trailLength + i) * 6;

                    this.bufferData[offset] = pos.x;
                    this.bufferData[offset + 1] = pos.y;
                    this.bufferData[offset + 2] = pos.z;
                    this.bufferData[offset + 3] = streak.size * trailFade;
                    this.bufferData[offset + 4] = streak.alpha * trailFade;
                    this.bufferData[offset + 5] = streak.type;
                }
            });

            this.updateBuffer();
        }

        updateBuffer() {
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
        }

        getBuffer() {
            return this.buffer;
        }

        getCount() {
            return this.streaks.length * this.config.trailLength;
        }

        destroy() {
            if (this.buffer) {
                this.gl.deleteBuffer(this.buffer);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NEURAL SPARK SYSTEM
    // ═══════════════════════════════════════════════════════════════

    class NeuralSparkSystem {
        constructor(gl, nodePositions, config = {}) {
            this.gl = gl;
            this.nodePositions = nodePositions || [];
            this.config = { ...PARTICLE_CONFIG.spark, ...config };
            this.activeSparks = [];
            this.lastSpawnTime = 0;
            this.buffer = null;
            this.bufferData = null;

            this.initialize();
        }

        initialize() {
            const gl = this.gl;

            // Pre-allocate buffer for max sparks
            this.bufferData = new Float32Array(this.config.maxActive * 6);
            this.buffer = gl.createBuffer();
        }

        setNodePositions(positions) {
            this.nodePositions = positions;
        }

        update(time, deltaTime, currentTime) {
            const { maxActive, spawnInterval, duration, sizeMin, sizeMax } = this.config;

            // Auto-spawn new sparks
            if (this.nodePositions.length > 1 &&
                this.activeSparks.length < maxActive &&
                currentTime - this.lastSpawnTime > spawnInterval) {

                this.spawnSpark(currentTime);
                this.lastSpawnTime = currentTime;
            }

            // Update active sparks
            const expiredSparks = [];

            this.activeSparks.forEach((spark, i) => {
                const elapsed = currentTime - spark.startTime;
                const progress = elapsed / duration;

                if (progress >= 1) {
                    expiredSparks.push(i);
                    return;
                }

                // Interpolate position between nodes
                const startNode = this.nodePositions[spark.startIndex];
                const endNode = this.nodePositions[spark.endIndex];

                if (!startNode || !endNode) {
                    expiredSparks.push(i);
                    return;
                }

                // Ease in-out for smooth motion
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                spark.x = lerp(startNode.x, endNode.x, eased);
                spark.y = lerp(startNode.y, endNode.y, eased);
                spark.z = lerp(startNode.z, endNode.z, eased);

                // Fade in/out (sin curve)
                spark.alpha = Math.sin(progress * Math.PI) * 0.8;

                // Size pulse
                spark.size = sizeMin + (sizeMax - sizeMin) * (0.5 + Math.sin(progress * Math.PI * 4) * 0.5);

                // Update buffer
                const offset = i * 6;
                this.bufferData[offset] = spark.x;
                this.bufferData[offset + 1] = spark.y;
                this.bufferData[offset + 2] = spark.z;
                this.bufferData[offset + 3] = spark.size;
                this.bufferData[offset + 4] = spark.alpha;
                this.bufferData[offset + 5] = 2; // Spark type
            });

            // Remove expired sparks
            for (let i = expiredSparks.length - 1; i >= 0; i--) {
                this.activeSparks.splice(expiredSparks[i], 1);
            }

            this.updateBuffer();
        }

        spawnSpark(currentTime) {
            if (this.nodePositions.length < 2) return;

            // Pick random adjacent nodes
            const startIndex = Math.floor(Math.random() * (this.nodePositions.length - 1));
            const endIndex = startIndex + 1;

            this.activeSparks.push({
                startIndex,
                endIndex,
                startTime: currentTime,
                x: 0, y: 0, z: 0,
                size: this.config.sizeMin,
                alpha: 0
            });
        }

        // Trigger spark on selection (instant)
        triggerSelectionSpark(nodeIndex, currentTime) {
            if (this.nodePositions.length < 2 || nodeIndex < 0) return;

            // Spark traveling outward from selected node
            const directions = [];

            if (nodeIndex > 0) {
                directions.push({ start: nodeIndex, end: nodeIndex - 1 });
            }
            if (nodeIndex < this.nodePositions.length - 1) {
                directions.push({ start: nodeIndex, end: nodeIndex + 1 });
            }

            directions.forEach(dir => {
                if (this.activeSparks.length < this.config.maxActive) {
                    this.activeSparks.push({
                        startIndex: dir.start,
                        endIndex: dir.end,
                        startTime: currentTime,
                        x: 0, y: 0, z: 0,
                        size: this.config.sizeMin,
                        alpha: 0
                    });
                }
            });
        }

        updateBuffer() {
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
        }

        getBuffer() {
            return this.buffer;
        }

        getCount() {
            return this.activeSparks.length;
        }

        destroy() {
            if (this.buffer) {
                this.gl.deleteBuffer(this.buffer);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GLOW PULSE MANAGER
    // ═══════════════════════════════════════════════════════════════

    class GlowPulseManager {
        constructor(config = {}) {
            this.config = { ...PARTICLE_CONFIG.pulse, ...config };
            this.activePulses = [];
            this.lastAutoSpawnTime = 0;
        }

        update(time, deltaTime, currentTime) {
            const { autoSpawnInterval, speed } = this.config;

            // Auto-spawn ambient pulses
            if (currentTime - this.lastAutoSpawnTime > autoSpawnInterval) {
                this.spawnPulse(false); // Not selection-triggered
                this.lastAutoSpawnTime = currentTime;
            }

            // Update active pulses
            const expiredPulses = [];

            this.activePulses.forEach((pulse, i) => {
                pulse.position += pulse.direction * speed * deltaTime;

                // Check if pulse has traveled full length
                if (pulse.position > 1.2 || pulse.position < -0.2) {
                    expiredPulses.push(i);
                }
            });

            // Remove expired pulses
            for (let i = expiredPulses.length - 1; i >= 0; i--) {
                this.activePulses.splice(expiredPulses[i], 1);
            }
        }

        spawnPulse(isSelection = false, startPosition = null) {
            const { intensityMax, bidirectional } = this.config;

            if (startPosition !== null) {
                // Selection pulse - bidirectional from node position
                if (bidirectional && isSelection) {
                    this.activePulses.push({
                        position: startPosition,
                        direction: 1,
                        intensity: intensityMax,
                        isSelection: true
                    });
                    this.activePulses.push({
                        position: startPosition,
                        direction: -1,
                        intensity: intensityMax,
                        isSelection: true
                    });
                } else {
                    this.activePulses.push({
                        position: startPosition,
                        direction: 1,
                        intensity: intensityMax,
                        isSelection
                    });
                }
            } else {
                // Auto pulse - start from one end
                const startFromLeft = Math.random() > 0.5;
                this.activePulses.push({
                    position: startFromLeft ? -0.1 : 1.1,
                    direction: startFromLeft ? 1 : -1,
                    intensity: intensityMax * 0.6, // Dimmer for ambient
                    isSelection: false
                });
            }
        }

        triggerSelectionPulse(nodeProgress) {
            this.spawnPulse(true, nodeProgress);
        }

        // Get strongest pulse for shader uniform
        getStrongestPulse() {
            if (this.activePulses.length === 0) {
                return { position: -1, intensity: 0 };
            }

            // Find pulse with highest intensity
            let strongest = this.activePulses[0];
            for (const pulse of this.activePulses) {
                if (pulse.intensity > strongest.intensity) {
                    strongest = pulse;
                }
            }

            return {
                position: strongest.position,
                intensity: strongest.intensity
            };
        }

        // Get all pulses for multi-pulse rendering
        getAllPulses() {
            return this.activePulses.map(p => ({
                position: p.position,
                intensity: p.intensity
            }));
        }

        getWidth() {
            return this.config.width;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // COMBINED PARTICLE SYSTEM MANAGER
    // ═══════════════════════════════════════════════════════════════

    class ParticleSystemManager {
        constructor(gl, nodePositions = []) {
            this.gl = gl;

            // Create all particle systems
            this.ambient = new AmbientParticleSystem(gl);
            this.streak = new StreakParticleSystem(gl);
            this.spark = new NeuralSparkSystem(gl, nodePositions);
            this.glowPulse = new GlowPulseManager();

            // Combined buffer for rendering all particles together
            this.combinedBuffer = null;
            this.combinedData = null;
            this.createCombinedBuffer();
        }

        createCombinedBuffer() {
            const gl = this.gl;

            // Total particle count
            const totalCount =
                this.ambient.getCount() +
                this.streak.getCount() +
                PARTICLE_CONFIG.spark.maxActive;

            this.combinedData = new Float32Array(totalCount * 6);
            this.combinedBuffer = gl.createBuffer();
        }

        setNodePositions(positions) {
            this.spark.setNodePositions(positions);
        }

        update(time, deltaTime, currentTime) {
            this.ambient.update(time, deltaTime);
            this.streak.update(time, deltaTime);
            this.spark.update(time, deltaTime, currentTime);
            this.glowPulse.update(time, deltaTime, currentTime);

            // Combine all particle data into single buffer
            this.combinedData.set(
                this.ambient.bufferData,
                0
            );

            const streakOffset = this.ambient.getCount() * 6;
            this.combinedData.set(
                this.streak.bufferData,
                streakOffset
            );

            const sparkOffset = streakOffset + this.streak.getCount() * 6;
            this.combinedData.set(
                this.spark.bufferData.slice(0, this.spark.getCount() * 6),
                sparkOffset
            );

            // Update combined buffer
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.combinedBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.combinedData, gl.DYNAMIC_DRAW);
        }

        triggerSelectionEffect(nodeIndex, nodeProgress, currentTime) {
            this.spark.triggerSelectionSpark(nodeIndex, currentTime);
            this.glowPulse.triggerSelectionPulse(nodeProgress);
        }

        getCombinedBuffer() {
            return this.combinedBuffer;
        }

        getTotalCount() {
            return this.ambient.getCount() +
                   this.streak.getCount() +
                   this.spark.getCount();
        }

        getGlowPulse() {
            return this.glowPulse.getStrongestPulse();
        }

        getGlowPulseWidth() {
            return this.glowPulse.getWidth();
        }

        destroy() {
            this.ambient.destroy();
            this.streak.destroy();
            this.spark.destroy();

            if (this.combinedBuffer) {
                this.gl.deleteBuffer(this.combinedBuffer);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        AmbientParticleSystem,
        StreakParticleSystem,
        NeuralSparkSystem,
        GlowPulseManager,
        ParticleSystemManager,
        CONFIG: PARTICLE_CONFIG
    };

})();

// Export for global access
window.ParticleSystemsV8 = ParticleSystemsV8;
