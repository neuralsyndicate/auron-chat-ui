// ============================================================
// V8 NEURAL HELIX - 3D Camera System
// Orbital camera with smooth state transitions
// ============================================================

const CameraSystem = (function() {
    'use strict';

    const { vec3, mat4, degToRad, lerp, smoothstep } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // CAMERA CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const CAMERA_CONFIG = {
        // Default position
        defaultDistance: 2.5,
        defaultHeight: 0.3,
        defaultTilt: 25,              // X-axis tilt in degrees

        // Field of view
        fov: 45,                      // Degrees
        fovSelected: 38,              // Tighter on selection
        near: 0.1,
        far: 100,

        // Orbit speeds by state
        orbitSpeeds: {
            idle: 0.003,
            hover: 0.0008,
            focusing: 0.0005,
            selected: 0.0005,
            unfocusing: 0.002
        },

        // Transition durations (in seconds)
        transitions: {
            orbitSpeedSmooth: 0.08,   // Speed change smoothing
            cameraMove: 0.6,          // Camera position transition
            fovChange: 0.4,           // FOV transition
            tiltChange: 0.5           // Tilt transition
        },

        // Selection camera adjustments
        selectionZoom: 0.85,          // Distance multiplier on select
        selectionTilt: 30,            // X-axis tilt on select (degrees)
        selectionPanMax: 0.3          // Max horizontal pan toward selected node
    };

    // ═══════════════════════════════════════════════════════════════
    // CAMERA CLASS
    // ═══════════════════════════════════════════════════════════════

    class Camera {
        constructor(options = {}) {
            this.config = { ...CAMERA_CONFIG, ...options };

            // Camera state
            this.state = 'idle';       // idle | hover | focusing | selected | unfocusing
            this.previousState = null;

            // Position on orbit (angle around Y-axis)
            this.orbitAngle = 0;
            this.orbitSpeed = this.config.orbitSpeeds.idle;
            this.targetOrbitSpeed = this.orbitSpeed;

            // Camera position parameters
            this.distance = this.config.defaultDistance;
            this.targetDistance = this.distance;
            this.height = this.config.defaultHeight;
            this.targetHeight = this.height;

            // Tilt (X-axis rotation applied to view)
            this.tiltAngle = degToRad(this.config.defaultTilt);
            this.targetTiltAngle = this.tiltAngle;

            // Horizontal pan offset (for selection focus)
            this.panOffset = { x: 0, y: 0, z: 0 };
            this.targetPanOffset = { x: 0, y: 0, z: 0 };

            // Field of view
            this.fov = degToRad(this.config.fov);
            this.targetFov = this.fov;

            // Look-at target (center of helix)
            this.target = vec3.create(0, 0, 0);
            this.targetLookAt = vec3.create(0, 0, 0);

            // Computed camera position
            this.position = vec3.create(0, this.height, this.distance);

            // Matrices (pre-allocated for performance)
            this.viewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.viewProjectionMatrix = mat4.create();
            this.inverseViewProjectionMatrix = mat4.create();

            // Temporary matrices for calculations
            this._tempMat = mat4.create();
            this._tempMat2 = mat4.create();

            // Selected node info
            this.selectedNode = null;
            this.selectedNodePosition = null;

            // Aspect ratio (set on resize)
            this.aspect = 16 / 9;

            // Initialize matrices
            this.updateMatrices();
        }

        // ─────────────────────────────────────────────────────────────
        // STATE MANAGEMENT
        // ─────────────────────────────────────────────────────────────

        setState(newState, targetNode = null) {
            if (this.state === newState && !targetNode) return;

            this.previousState = this.state;
            this.state = newState;

            switch (newState) {
                case 'idle':
                    this.targetOrbitSpeed = this.config.orbitSpeeds.idle;
                    this.targetDistance = this.config.defaultDistance;
                    this.targetTiltAngle = degToRad(this.config.defaultTilt);
                    this.targetFov = degToRad(this.config.fov);
                    this.targetPanOffset = { x: 0, y: 0, z: 0 };
                    this.targetLookAt = vec3.create(0, 0, 0);
                    this.selectedNode = null;
                    this.selectedNodePosition = null;
                    break;

                case 'hover':
                    this.targetOrbitSpeed = this.config.orbitSpeeds.hover;
                    // Don't change other parameters on hover
                    break;

                case 'focusing':
                    this.targetOrbitSpeed = this.config.orbitSpeeds.focusing;
                    if (targetNode) {
                        this.selectedNode = targetNode;
                        this.selectedNodePosition = targetNode.position || vec3.create(targetNode.x, targetNode.y, targetNode.z);

                        // Zoom in
                        this.targetDistance = this.config.defaultDistance * this.config.selectionZoom;
                        this.targetTiltAngle = degToRad(this.config.selectionTilt);
                        this.targetFov = degToRad(this.config.fovSelected);

                        // Pan toward the node (limited)
                        const panX = Math.max(-this.config.selectionPanMax,
                                     Math.min(this.config.selectionPanMax, this.selectedNodePosition.x * 0.3));
                        this.targetPanOffset = { x: panX, y: 0, z: 0 };

                        // Adjust look-at slightly toward node
                        this.targetLookAt = vec3.create(panX * 0.5, 0, 0);
                    }

                    // Transition to selected after focusing
                    setTimeout(() => {
                        if (this.state === 'focusing') {
                            this.state = 'selected';
                        }
                    }, this.config.transitions.cameraMove * 1000);
                    break;

                case 'selected':
                    this.targetOrbitSpeed = this.config.orbitSpeeds.selected;
                    break;

                case 'unfocusing':
                    this.targetOrbitSpeed = this.config.orbitSpeeds.unfocusing;
                    this.targetDistance = this.config.defaultDistance;
                    this.targetTiltAngle = degToRad(this.config.defaultTilt);
                    this.targetFov = degToRad(this.config.fov);
                    this.targetPanOffset = { x: 0, y: 0, z: 0 };
                    this.targetLookAt = vec3.create(0, 0, 0);
                    this.selectedNode = null;
                    this.selectedNodePosition = null;

                    // Transition to idle after unfocusing
                    setTimeout(() => {
                        if (this.state === 'unfocusing') {
                            this.state = 'idle';
                            this.targetOrbitSpeed = this.config.orbitSpeeds.idle;
                        }
                    }, this.config.transitions.cameraMove * 1000 * 0.8);
                    break;
            }
        }

        handleHover(node) {
            if (this.state === 'selected' || this.state === 'focusing') {
                return; // Don't change state while selected
            }

            if (node) {
                this.setState('hover');
            } else if (this.state === 'hover') {
                this.setState('idle');
            }
        }

        handleSelect(node) {
            if (node) {
                this.setState('focusing', node);
            } else {
                this.deselect();
            }
        }

        deselect() {
            if (this.state === 'selected' || this.state === 'focusing') {
                this.setState('unfocusing');
            }
        }

        // ─────────────────────────────────────────────────────────────
        // UPDATE (call every frame)
        // ─────────────────────────────────────────────────────────────

        update(deltaTime) {
            // Smooth orbit speed transition
            const speedSmooth = 1 - Math.pow(0.01, deltaTime / this.config.transitions.orbitSpeedSmooth);
            this.orbitSpeed = lerp(this.orbitSpeed, this.targetOrbitSpeed, speedSmooth);

            // Update orbit angle
            this.orbitAngle += this.orbitSpeed;

            // Smooth camera parameter transitions
            const moveSmooth = 1 - Math.pow(0.01, deltaTime / this.config.transitions.cameraMove);
            const fovSmooth = 1 - Math.pow(0.01, deltaTime / this.config.transitions.fovChange);
            const tiltSmooth = 1 - Math.pow(0.01, deltaTime / this.config.transitions.tiltChange);

            this.distance = lerp(this.distance, this.targetDistance, moveSmooth);
            this.tiltAngle = lerp(this.tiltAngle, this.targetTiltAngle, tiltSmooth);
            this.fov = lerp(this.fov, this.targetFov, fovSmooth);

            // Smooth pan offset
            this.panOffset.x = lerp(this.panOffset.x, this.targetPanOffset.x, moveSmooth);
            this.panOffset.y = lerp(this.panOffset.y, this.targetPanOffset.y, moveSmooth);
            this.panOffset.z = lerp(this.panOffset.z, this.targetPanOffset.z, moveSmooth);

            // Smooth look-at target
            this.target.x = lerp(this.target.x, this.targetLookAt.x, moveSmooth);
            this.target.y = lerp(this.target.y, this.targetLookAt.y, moveSmooth);
            this.target.z = lerp(this.target.z, this.targetLookAt.z, moveSmooth);

            // Calculate camera position on orbit
            this.calculatePosition();

            // Update all matrices
            this.updateMatrices();
        }

        calculatePosition() {
            // Base position on orbit circle
            const cosAngle = Math.cos(this.orbitAngle);
            const sinAngle = Math.sin(this.orbitAngle);

            // Position on orbit (horizontal plane)
            this.position.x = sinAngle * this.distance + this.panOffset.x;
            this.position.y = this.height + this.panOffset.y;
            this.position.z = cosAngle * this.distance + this.panOffset.z;
        }

        updateMatrices() {
            // Build view matrix with tilt
            // First, create basic lookAt
            const up = vec3.create(0, 1, 0);
            mat4.lookAt(this.viewMatrix, this.position, this.target, up);

            // Apply X-axis tilt rotation to view matrix
            const tiltMatrix = mat4.create();
            mat4.rotateX(tiltMatrix, this.tiltAngle);
            mat4.multiply(this.viewMatrix, tiltMatrix, this.viewMatrix);

            // Build projection matrix
            mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.config.near, this.config.far);

            // Combine into view-projection matrix
            mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);

            // Calculate inverse for raycasting
            mat4.invert(this.inverseViewProjectionMatrix, this.viewProjectionMatrix);
        }

        // ─────────────────────────────────────────────────────────────
        // RESIZE
        // ─────────────────────────────────────────────────────────────

        resize(width, height) {
            this.aspect = width / height;
            this.updateMatrices();
        }

        // ─────────────────────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────────────────────

        getViewMatrix() {
            return this.viewMatrix;
        }

        getProjectionMatrix() {
            return this.projectionMatrix;
        }

        getViewProjectionMatrix() {
            return this.viewProjectionMatrix;
        }

        getInverseViewProjectionMatrix() {
            return this.inverseViewProjectionMatrix;
        }

        getPosition() {
            return this.position;
        }

        getTarget() {
            return this.target;
        }

        getState() {
            return this.state;
        }

        isSelected() {
            return this.state === 'selected' || this.state === 'focusing';
        }

        getSelectedNode() {
            return this.selectedNode;
        }

        // ─────────────────────────────────────────────────────────────
        // RAYCASTING (for hit detection)
        // ─────────────────────────────────────────────────────────────

        screenToRay(screenX, screenY, canvasWidth, canvasHeight) {
            // Convert screen coordinates to NDC (-1 to 1)
            const ndcX = (screenX / canvasWidth) * 2 - 1;
            const ndcY = 1 - (screenY / canvasHeight) * 2; // Y is flipped

            return MatrixMath.unprojectRay(ndcX, ndcY, this.inverseViewProjectionMatrix);
        }

        // Ray-sphere intersection for node hit testing
        rayIntersectsSphere(ray, center, radius) {
            const oc = vec3.subtract(ray.origin, center);
            const a = vec3.dot(ray.direction, ray.direction);
            const b = 2 * vec3.dot(oc, ray.direction);
            const c = vec3.dot(oc, oc) - radius * radius;
            const discriminant = b * b - 4 * a * c;

            if (discriminant < 0) {
                return null; // No intersection
            }

            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            if (t < 0) {
                return null; // Behind camera
            }

            return t; // Distance to intersection
        }

        // ─────────────────────────────────────────────────────────────
        // DEBUG
        // ─────────────────────────────────────────────────────────────

        getDebugInfo() {
            return {
                state: this.state,
                orbitAngle: this.orbitAngle.toFixed(3),
                orbitSpeed: this.orbitSpeed.toFixed(5),
                distance: this.distance.toFixed(3),
                tilt: (this.tiltAngle * 180 / Math.PI).toFixed(1) + '°',
                fov: (this.fov * 180 / Math.PI).toFixed(1) + '°',
                position: `(${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`,
                target: `(${this.target.x.toFixed(2)}, ${this.target.y.toFixed(2)}, ${this.target.z.toFixed(2)})`
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        Camera,
        CONFIG: CAMERA_CONFIG
    };

})();

// Export for global access
window.CameraSystem = CameraSystem;
