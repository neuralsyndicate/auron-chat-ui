// ============================================================
// V8 NEURAL HELIX - Unified State Manager
// Coordinates camera, interactions, effects, and card states
// ============================================================

const V8StateManager = (function() {
    'use strict';

    const { lerp, smoothstep } = MatrixMath;

    // ═══════════════════════════════════════════════════════════════
    // STATE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const STATE_CONFIG = {
        // Background dim on selection
        backgroundDim: {
            selected: 0.4,
            transition: 0.4  // seconds
        },

        // Ripple effect
        ripple: {
            duration: 1.2,   // seconds
            speed: 0.8
        },

        // Card animation
        card: {
            showDuration: 0.5,
            hideDuration: 0.3,
            scaleMin: 0.8,
            scaleMax: 1.0
        },

        // Node interaction
        node: {
            hoverScale: 1.2,
            selectedScale: 1.4,
            dimmedAlpha: 0.3
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // STATE MANAGER CLASS
    // ═══════════════════════════════════════════════════════════════

    class StateManager {
        constructor(options = {}) {
            this.config = { ...STATE_CONFIG, ...options };

            // Interaction state
            this.interaction = {
                hoveredNodeKey: null,
                hoveredNodeIndex: -1,
                selectedNodeKey: null,
                selectedNodeIndex: -1,
                selectedNodeData: null
            };

            // Camera state (managed by CameraSystem, mirrored here)
            this.cameraState = 'idle';

            // Effects state
            this.effects = {
                backgroundDim: 0,
                targetBackgroundDim: 0,
                rippleActive: false,
                rippleCenter: [0, 0],
                rippleTime: 0,
                rippleStartTime: 0
            };

            // Card state
            this.card = {
                visible: false,
                opacity: 0,
                targetOpacity: 0,
                scale: this.config.card.scaleMin,
                targetScale: this.config.card.scaleMin,
                content: null,
                anchorPosition: null
            };

            // Node states (for rendering)
            this.nodeStates = new Map();

            // Callbacks
            this.callbacks = {
                onHover: null,
                onSelect: null,
                onDeselect: null,
                onCardShow: null,
                onCardHide: null
            };

            // Time tracking
            this.currentTime = 0;
        }

        // ─────────────────────────────────────────────────────────────
        // CALLBACK REGISTRATION
        // ─────────────────────────────────────────────────────────────

        on(event, callback) {
            if (this.callbacks.hasOwnProperty(event)) {
                this.callbacks[event] = callback;
            }
            return this;
        }

        // ─────────────────────────────────────────────────────────────
        // INTERACTION HANDLERS
        // ─────────────────────────────────────────────────────────────

        handleHover(nodeKey, nodeIndex, nodeData) {
            const wasHovered = this.interaction.hoveredNodeKey;

            this.interaction.hoveredNodeKey = nodeKey;
            this.interaction.hoveredNodeIndex = nodeIndex;

            // Update node state
            if (wasHovered && wasHovered !== nodeKey) {
                this.updateNodeState(wasHovered, { isHovered: false });
            }

            if (nodeKey) {
                this.updateNodeState(nodeKey, { isHovered: true });
            }

            // Trigger callback
            if (this.callbacks.onHover) {
                this.callbacks.onHover(nodeKey, nodeIndex, nodeData);
            }

            return this.getCameraStateForHover();
        }

        handleSelect(nodeKey, nodeIndex, nodeData, nodePosition, screenPosition) {
            // If same node, deselect
            if (this.interaction.selectedNodeKey === nodeKey) {
                return this.handleDeselect();
            }

            // Deselect previous
            if (this.interaction.selectedNodeKey) {
                this.updateNodeState(this.interaction.selectedNodeKey, {
                    isSelected: false,
                    isDimmed: false
                });
            }

            // Update selection
            this.interaction.selectedNodeKey = nodeKey;
            this.interaction.selectedNodeIndex = nodeIndex;
            this.interaction.selectedNodeData = nodeData;

            // Update node states
            this.updateNodeState(nodeKey, {
                isSelected: true,
                isHovered: false,
                isDimmed: false
            });

            // Dim all other nodes
            this.nodeStates.forEach((state, key) => {
                if (key !== nodeKey) {
                    state.isDimmed = true;
                }
            });

            // Trigger effects
            this.effects.targetBackgroundDim = this.config.backgroundDim.selected;
            this.triggerRipple(screenPosition);

            // Show card
            this.showCard(nodeData, nodePosition);

            // Trigger callback
            if (this.callbacks.onSelect) {
                this.callbacks.onSelect(nodeKey, nodeIndex, nodeData);
            }

            return {
                cameraState: 'focusing',
                targetNode: {
                    key: nodeKey,
                    index: nodeIndex,
                    position: nodePosition,
                    data: nodeData
                }
            };
        }

        handleDeselect() {
            const wasSelected = this.interaction.selectedNodeKey;

            // Clear selection
            this.interaction.selectedNodeKey = null;
            this.interaction.selectedNodeIndex = -1;
            this.interaction.selectedNodeData = null;

            // Reset all node states
            this.nodeStates.forEach((state, key) => {
                state.isSelected = false;
                state.isDimmed = false;
            });

            // Reset effects
            this.effects.targetBackgroundDim = 0;

            // Hide card
            this.hideCard();

            // Trigger callback
            if (this.callbacks.onDeselect && wasSelected) {
                this.callbacks.onDeselect(wasSelected);
            }

            return {
                cameraState: 'unfocusing'
            };
        }

        // ─────────────────────────────────────────────────────────────
        // NODE STATE MANAGEMENT
        // ─────────────────────────────────────────────────────────────

        updateNodeState(nodeKey, updates) {
            if (!this.nodeStates.has(nodeKey)) {
                this.nodeStates.set(nodeKey, {
                    isHovered: false,
                    isSelected: false,
                    isDimmed: false,
                    scale: 1.0,
                    alpha: 1.0
                });
            }

            const state = this.nodeStates.get(nodeKey);
            Object.assign(state, updates);
        }

        getNodeState(nodeKey) {
            if (!this.nodeStates.has(nodeKey)) {
                return {
                    isHovered: false,
                    isSelected: false,
                    isDimmed: false,
                    scale: 1.0,
                    alpha: 1.0
                };
            }
            return this.nodeStates.get(nodeKey);
        }

        initializeNodes(nodeKeys) {
            nodeKeys.forEach(key => {
                if (!this.nodeStates.has(key)) {
                    this.nodeStates.set(key, {
                        isHovered: false,
                        isSelected: false,
                        isDimmed: false,
                        scale: 1.0,
                        alpha: 1.0
                    });
                }
            });
        }

        // ─────────────────────────────────────────────────────────────
        // EFFECTS
        // ─────────────────────────────────────────────────────────────

        triggerRipple(screenPosition) {
            if (!screenPosition) return;

            this.effects.rippleActive = true;
            this.effects.rippleCenter = [screenPosition.x, screenPosition.y];
            this.effects.rippleTime = 0;
            this.effects.rippleStartTime = this.currentTime;
        }

        // ─────────────────────────────────────────────────────────────
        // CARD MANAGEMENT
        // ─────────────────────────────────────────────────────────────

        showCard(nodeData, anchorPosition) {
            this.card.visible = true;
            this.card.targetOpacity = 1;
            this.card.targetScale = this.config.card.scaleMax;
            this.card.content = nodeData;
            this.card.anchorPosition = anchorPosition;

            if (this.callbacks.onCardShow) {
                this.callbacks.onCardShow(nodeData, anchorPosition);
            }
        }

        hideCard() {
            this.card.targetOpacity = 0;
            this.card.targetScale = this.config.card.scaleMin;

            // Delay actual hide until animation completes
            setTimeout(() => {
                if (this.card.targetOpacity === 0) {
                    this.card.visible = false;
                    this.card.content = null;

                    if (this.callbacks.onCardHide) {
                        this.callbacks.onCardHide();
                    }
                }
            }, this.config.card.hideDuration * 1000);
        }

        // ─────────────────────────────────────────────────────────────
        // UPDATE (call every frame)
        // ─────────────────────────────────────────────────────────────

        update(deltaTime, currentTime) {
            this.currentTime = currentTime;

            // Smooth background dim transition
            const dimSmooth = 1 - Math.pow(0.01, deltaTime / this.config.backgroundDim.transition);
            this.effects.backgroundDim = lerp(
                this.effects.backgroundDim,
                this.effects.targetBackgroundDim,
                dimSmooth
            );

            // Update ripple
            if (this.effects.rippleActive) {
                this.effects.rippleTime = (currentTime - this.effects.rippleStartTime) / 1000;

                if (this.effects.rippleTime > this.config.ripple.duration) {
                    this.effects.rippleActive = false;
                    this.effects.rippleTime = 0;
                }
            }

            // Update card animation
            const cardShowSmooth = 1 - Math.pow(0.01, deltaTime / this.config.card.showDuration);
            const cardHideSmooth = 1 - Math.pow(0.01, deltaTime / this.config.card.hideDuration);
            const cardSmooth = this.card.targetOpacity > 0.5 ? cardShowSmooth : cardHideSmooth;

            this.card.opacity = lerp(this.card.opacity, this.card.targetOpacity, cardSmooth);
            this.card.scale = lerp(this.card.scale, this.card.targetScale, cardSmooth);

            // Update node visual states
            this.nodeStates.forEach((state, key) => {
                // Target scale
                let targetScale = 1.0;
                if (state.isSelected) {
                    targetScale = this.config.node.selectedScale;
                } else if (state.isHovered) {
                    targetScale = this.config.node.hoverScale;
                }

                // Target alpha
                let targetAlpha = 1.0;
                if (state.isDimmed) {
                    targetAlpha = this.config.node.dimmedAlpha;
                }

                // Smooth transitions
                state.scale = lerp(state.scale, targetScale, cardSmooth);
                state.alpha = lerp(state.alpha, targetAlpha, cardSmooth);
            });
        }

        // ─────────────────────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────────────────────

        getInteractionState() {
            return { ...this.interaction };
        }

        getEffectsState() {
            return {
                backgroundDim: this.effects.backgroundDim,
                ripple: {
                    active: this.effects.rippleActive,
                    center: this.effects.rippleCenter,
                    time: this.effects.rippleTime / this.config.ripple.duration
                }
            };
        }

        getCardState() {
            return {
                visible: this.card.visible,
                opacity: this.card.opacity,
                scale: this.card.scale,
                content: this.card.content,
                anchorPosition: this.card.anchorPosition
            };
        }

        isSelected() {
            return this.interaction.selectedNodeKey !== null;
        }

        getSelectedNodeKey() {
            return this.interaction.selectedNodeKey;
        }

        getHoveredNodeKey() {
            return this.interaction.hoveredNodeKey;
        }

        getCameraStateForHover() {
            if (this.isSelected()) {
                return 'selected'; // Don't change camera state while selected
            }
            return this.interaction.hoveredNodeKey ? 'hover' : 'idle';
        }

        // ─────────────────────────────────────────────────────────────
        // SHADER UNIFORMS HELPER
        // ─────────────────────────────────────────────────────────────

        getShaderUniforms() {
            const effectsState = this.getEffectsState();

            return {
                backgroundDim: this.effects.backgroundDim,
                rippleActive: effectsState.ripple.active ? 1.0 : 0.0,
                rippleCenter: effectsState.ripple.center,
                rippleTime: effectsState.ripple.time
            };
        }

        getNodeShaderUniforms(nodeKey) {
            const state = this.getNodeState(nodeKey);

            return {
                isSelected: state.isSelected ? 1.0 : 0.0,
                isHovered: state.isHovered ? 1.0 : 0.0,
                isDimmed: state.isDimmed ? 1.0 : 0.0,
                scale: state.scale,
                alpha: state.alpha
            };
        }

        // ─────────────────────────────────────────────────────────────
        // RESET
        // ─────────────────────────────────────────────────────────────

        reset() {
            this.interaction = {
                hoveredNodeKey: null,
                hoveredNodeIndex: -1,
                selectedNodeKey: null,
                selectedNodeIndex: -1,
                selectedNodeData: null
            };

            this.effects = {
                backgroundDim: 0,
                targetBackgroundDim: 0,
                rippleActive: false,
                rippleCenter: [0, 0],
                rippleTime: 0,
                rippleStartTime: 0
            };

            this.card = {
                visible: false,
                opacity: 0,
                targetOpacity: 0,
                scale: this.config.card.scaleMin,
                targetScale: this.config.card.scaleMin,
                content: null,
                anchorPosition: null
            };

            this.nodeStates.clear();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        StateManager,
        CONFIG: STATE_CONFIG
    };

})();

// Export for global access
window.V8StateManager = V8StateManager;
