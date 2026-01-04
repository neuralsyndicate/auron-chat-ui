// ============================================================
// MEMORY CONSTELLATION - React Component
// 3D floating orbs visualization for past conversations
// ============================================================

const { useState, useEffect, useRef, useCallback } = React;

function MemoryConstellation({ user, setLoadedSessionId }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    // State
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [hoveredConversation, setHoveredConversation] = useState(null);
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

    // Initialize WebGL renderer
    useEffect(() => {
        if (loading || !canvasRef.current) return;

        const canvas = canvasRef.current;

        // Create renderer
        const renderer = new ConstellationWebGL.ConstellationRenderer(canvas, {
            onOrbClick: (conversation) => {
                console.log('Orb clicked:', conversation.title);
                setSelectedConversationId(conversation.id);
            },
            onOrbHover: (conversation) => {
                setHoveredConversation(conversation);
            }
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
    }, [loading, conversations]);

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

            {/* Hover Tooltip */}
            {hoveredConversation && (
                <div className="constellation-tooltip">
                    <span className="tooltip-title">{hoveredConversation.title || 'Conversation'}</span>
                    <span className="tooltip-meta">
                        {hoveredConversation.message_count || 0} exchanges
                        {' · '}
                        {formatRelativeDate(hoveredConversation.created_at)}
                    </span>
                </div>
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
