// ============================================================
// MEMORY CONSTELLATION - React Component
// Premium 3D holographic orbs visualization for past conversations
// v8: Timeline spiral, lazy-loading, hover cards
// ============================================================

const { useState, useEffect, useRef, useCallback } = React;

function MemoryConstellation({ user, setLoadedSessionId }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const loadingQueueRef = useRef(new Set());

    // State
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [hoveredInfo, setHoveredInfo] = useState(null);  // {conversation, screenX, screenY}
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const userId = user?.sub || user?.id;
                if (!userId) {
                    setConversations([]);
                    setLoading(false);
                    return;
                }

                // Initialize conversation index if needed
                if (!conversationIndex.initialized) {
                    await conversationIndex.init(userId);
                }
                await conversationIndex.load();

                const convs = conversationIndex.list(50);
                console.log('MemoryConstellation: Loaded', convs.length, 'conversations');
                setConversations(convs);
            } catch (err) {
                console.error('Failed to load conversations:', err);
                setConversations([]);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [user?.sub, user?.id]);

    // Load full conversation data for an orb
    const loadConversationData = useCallback(async (conversation) => {
        if (!conversation?.id) return null;

        try {
            const entry = conversationIndex.getConversation(conversation.id);
            if (!entry?.bunny_key) {
                console.warn('No bunny_key for conversation:', conversation.id);
                return null;
            }

            const token = await getAuthToken();
            const response = await fetch(
                `${BFF_API_BASE}/cdn-proxy?path=${encodeURIComponent(entry.bunny_key)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const encrypted = await response.arrayBuffer();
            const data = await decryptData(encrypted, conversationIndex.encryptionKey);

            return {
                messages: data.messages || [],
                title: data.title
            };
        } catch (err) {
            console.error('Failed to load conversation data:', conversation.id, err);
            return null;
        }
    }, []);

    // Handle orbs needing lazy load
    const handleOrbsNeedLoading = useCallback(async (conversationsToLoad) => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        for (const conv of conversationsToLoad) {
            // Skip if already loading
            if (loadingQueueRef.current.has(conv.id)) continue;
            loadingQueueRef.current.add(conv.id);

            // Load asynchronously
            loadConversationData(conv).then(fullData => {
                loadingQueueRef.current.delete(conv.id);
                if (fullData && rendererRef.current) {
                    rendererRef.current.updateOrbContent(conv.id, fullData);
                }
            });
        }
    }, [loadConversationData]);

    // Initialize WebGL renderer
    useEffect(() => {
        if (loading || !canvasRef.current) return;

        const canvas = canvasRef.current;

        // Create renderer with callbacks
        const renderer = new ConstellationWebGL.ConstellationRenderer(canvas, {
            onOrbClick: (conversation) => {
                console.log('Orb clicked:', conversation.title);
                setSelectedConversationId(conversation.id);
            },
            onOrbHover: (conversation) => {
                if (!conversation) {
                    setHoveredInfo(null);
                    return;
                }
                // Get screen position from renderer
                const info = rendererRef.current?.getHoveredOrbInfo();
                if (info) {
                    setHoveredInfo({
                        conversation: info.conversation,
                        screenX: info.screenX,
                        screenY: info.screenY
                    });
                } else {
                    setHoveredInfo({ conversation, screenX: 0, screenY: 0 });
                }
            },
            onOrbsNeedLoading: handleOrbsNeedLoading
        });

        // Set conversation data
        renderer.setConversations(conversations);

        // Start rendering
        renderer.start();
        rendererRef.current = renderer;

        return () => {
            renderer.destroy();
            rendererRef.current = null;
        };
    }, [loading, conversations, handleOrbsNeedLoading]);

    // Update hover position on animation frame
    useEffect(() => {
        if (!hoveredInfo) return;

        let rafId;
        const updatePosition = () => {
            const info = rendererRef.current?.getHoveredOrbInfo();
            if (info) {
                setHoveredInfo(prev => prev ? {
                    ...prev,
                    screenX: info.screenX,
                    screenY: info.screenY
                } : null);
            }
            rafId = requestAnimationFrame(updatePosition);
        };

        rafId = requestAnimationFrame(updatePosition);
        return () => cancelAnimationFrame(rafId);
    }, [!!hoveredInfo]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (rendererRef.current) {
                rendererRef.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close modal handler
    const handleCloseModal = useCallback(() => {
        setSelectedConversationId(null);
    }, []);

    // Open conversation handler
    const handleOpenConversation = useCallback((conversationId) => {
        setSelectedConversationId(conversationId);
    }, []);

    // Delete conversation handler
    const handleDeleteConversation = useCallback(async (conversationId) => {
        if (!confirm('Delete this memory? This cannot be undone.')) return;

        try {
            await conversationIndex.delete(conversationId);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            setHoveredInfo(null);

            // Update renderer
            if (rendererRef.current) {
                rendererRef.current.setConversations(
                    conversations.filter(c => c.id !== conversationId)
                );
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    }, [conversations]);

    // Loading state
    if (loading) {
        return (
            <div className="constellation-container constellation-loading">
                <div className="constellation-spinner"></div>
                <p>Loading your memories...</p>
            </div>
        );
    }

    // Empty state
    if (conversations.length === 0) {
        return (
            <div className="constellation-container constellation-empty">
                <div className="constellation-empty-icon">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <circle cx="60" cy="60" r="50" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="2" strokeDasharray="8 4"/>
                        <circle cx="40" cy="45" r="8" fill="rgba(96, 165, 250, 0.4)"/>
                        <circle cx="75" cy="55" r="6" fill="rgba(168, 127, 255, 0.4)"/>
                        <circle cx="55" cy="75" r="10" fill="rgba(96, 165, 250, 0.5)"/>
                    </svg>
                </div>
                <h2>No Memories Yet</h2>
                <p>Your conversations with Auron will appear here as floating orbs.</p>
                <p className="constellation-hint">Each orb represents a conversation - bigger orbs mean deeper explorations.</p>
            </div>
        );
    }

    return (
        <div className="constellation-container">
            {/* WebGL Canvas */}
            <canvas ref={canvasRef} className="constellation-canvas" />

            {/* Hover Card (positioned to the right of orb) */}
            {hoveredInfo && (
                <ConstellationHoverCard
                    conversation={hoveredInfo.conversation}
                    screenX={hoveredInfo.screenX}
                    screenY={hoveredInfo.screenY}
                    onOpen={() => handleOpenConversation(hoveredInfo.conversation.id)}
                    onDelete={() => handleDeleteConversation(hoveredInfo.conversation.id)}
                />
            )}

            {/* Header Overlay */}
            <div className="constellation-header">
                <h1>Memory Constellation</h1>
                <p>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Instructions */}
            <div className="constellation-instructions">
                <span>Drag to rotate</span>
                <span>Scroll to zoom</span>
                <span>Click orb to view</span>
            </div>

            {/* Reflection Viewer Modal */}
            {selectedConversationId && (
                <ReflectionViewer
                    conversationId={selectedConversationId}
                    onClose={handleCloseModal}
                    setSessionId={() => {}}
                />
            )}
        </div>
    );
}

// ============================================================
// HOVER CARD COMPONENT
// Appears to the right of hovered orb with metadata + actions
// ============================================================

function ConstellationHoverCard({ conversation, screenX, screenY, onOpen, onDelete }) {
    // Calculate position (to the right of orb, clamped to viewport)
    const cardWidth = 260;
    const cardHeight = 140;
    const offset = 80;  // Distance from orb center

    let left = screenX + offset;
    let top = screenY - cardHeight / 2;

    // Clamp to viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If card would go off right edge, position to left of orb
    if (left + cardWidth > viewportWidth - 20) {
        left = screenX - offset - cardWidth;
    }

    // Clamp top/bottom
    top = Math.max(20, Math.min(viewportHeight - cardHeight - 20, top));

    return (
        <div
            className="constellation-hover-card"
            style={{
                left: `${left}px`,
                top: `${top}px`
            }}
        >
            <div className="hover-card-inner">
                <h3>{conversation.title || 'Conversation'}</h3>

                <div className="hover-card-meta">
                    <span>{formatRelativeDate(conversation.created_at)}</span>
                    <span className="meta-dot">·</span>
                    <span>{conversation.message_count || 0} messages</span>
                </div>

                <div className="hover-card-actions">
                    <button className="btn-open" onClick={onOpen}>
                        Open
                    </button>
                    <button className="btn-delete" onClick={onDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper function
function formatRelativeDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
