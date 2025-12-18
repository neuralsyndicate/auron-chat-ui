// ============================================================
// REFLECTIONS VIEW - Past Conversations Gallery
// ============================================================

/* React Hooks (UMD) */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  useLayoutEffect,
  useContext
} = React;

// Reflections View - Horizontal scrolling card gallery
function ReflectionsView({ user, setCurrentView, setLoadedSessionId, conversations: externalConversations, setConversations: setExternalConversations }) {
    // Use external state if provided, otherwise use local state
    const [localConversations, setLocalConversations] = useState([]);
    const conversations = externalConversations !== undefined ? externalConversations : localConversations;
    const setConversations = setExternalConversations || setLocalConversations;

    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversationDetails, setConversationDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const token = await getAuthToken();
            if (!token) {
                console.warn('No auth token');
                return;
            }

            const response = await fetch(`${DIALOGUE_API_BASE}/conversations?limit=20`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load conversations');
            }

            const data = await response.json();
            console.log('Loaded conversations:', data);
            setConversations(data.conversations || []);

        } catch (err) {
            console.error('Failed to load conversations:', err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const openConversationInChat = (conversation) => {
        const conversationId = conversation.conversation_id || conversation.id;
        console.log(`Opening reflection viewer: ${conversationId}`);

        // Open in reflection viewer (stay in reflections view)
        setLoadedSessionId(conversationId);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading your reflections...</p>
                </div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center max-w-lg">
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📚</div>
                    <h2 className="text-2xl font-bold text-white mb-4">No Reflections Yet</h2>
                    <p className="text-gray-400 mb-6">
                        Your conversations with Auron will appear here as you chat.
                    </p>
                    <p className="text-gray-500 text-sm">
                        Each conversation becomes a memory that shapes your Neural Music Profile.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden" style={{ background: '#000' }}>
            <div className="p-12">
                {/* Header */}
                <div className="text-center mb-12 relative">
                    <h1 className="text-4xl font-bold glow mb-2" style={{
                        background: 'linear-gradient(135deg, #00A8FF 0%, #005CFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '0.05em'
                    }}>
                        YOUR REFLECTIONS
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} with Auron
                    </p>

                    {/* Refresh Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            loadConversations();
                        }}
                        disabled={loading}
                        className="absolute right-0 top-0 px-5 py-2 rounded-full text-sm font-medium transition-all bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                        <span>🔄</span>
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Horizontal Scrolling Cards */}
                <div className="relative">
                    <div className="overflow-x-auto pb-8" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#00A8FF #1a1a1a'
                    }}>
                        <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
                            {conversations.map((conv, idx) => (
                                <div
                                    key={conv.id || idx}
                                    className="glass-card rounded-2xl p-6 flex-shrink-0"
                                    onClick={() => openConversationInChat(conv)}
                                    style={{
                                        width: '380px',
                                        background: 'rgba(10, 10, 31, 0.6)',
                                        border: '1px solid rgba(0, 168, 255, 0.2)',
                                        cursor: 'pointer'
                                    }}>
                                    {/* Date */}
                                    <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-3">
                                        {new Date(conv.timestamp || conv.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>

                                    {/* Title or summary */}
                                    <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2">
                                        {conv.title || conv.summary || 'Conversation with Auron'}
                                    </h3>

                                    {/* Preview text */}
                                    {conv.preview && (
                                        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {conv.preview}
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
                                        {conv.emotions && conv.emotions.length > 0 && (
                                            <div className="flex gap-2">
                                                {conv.emotions.slice(0, 3).map((emotion, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                        {emotion}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {conv.message_count && (
                                            <span className="text-xs text-gray-500 ml-auto">
                                                {conv.message_count} messages
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll Hint */}
                {conversations.length > 2 && (
                    <div className="text-center mt-8">
                        <p className="text-gray-600 text-xs">
                            ← Scroll to explore your conversations →
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Reflection Viewer Component (Clean Full Screen Modal)
function ReflectionViewer({ conversationId, onClose, setSessionId }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversation();
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversation = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();

            // Step 1: Verify access with BFF
            const verifyResponse = await fetch(`${BFF_API_BASE}/get-conversation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ conversation_id: conversationId })
            });

            if (!verifyResponse.ok) throw new Error('Failed to verify conversation access');

            const { signed_url, encryption_key } = await verifyResponse.json();

            // Step 2: Fetch from BunnyCDN
            const bunnyResponse = await fetch(signed_url);
            if (!bunnyResponse.ok) throw new Error('Failed to fetch from BunnyCDN CDN');

            // Step 3: Decrypt
            const encryptedData = await bunnyResponse.arrayBuffer();
            const conversationData = await decryptConversation(encryptedData, encryption_key);

            setMessages(conversationData.messages || []);
        } catch (err) {
            console.error('Failed to load reflection:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || chatLoading) return;

        const userMessage = input.trim();
        setInput('');
        setChatLoading(true);

        // Capture conversation history BEFORE adding new message
        const conversationHistory = messages.map(msg => ({
            role: msg.role === 'auron' ? 'assistant' : msg.role,
            content: msg.content
        }));

        // Add user message immediately for UI
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const token = await getAuthToken();

            // Send message with full conversation history + original session_id
            const response = await fetch(`${DIALOGUE_API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversation_history: conversationHistory,
                    session_id: conversationId  // Continue existing conversation with original ID
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            // Save session_id to enable sync button in header
            if (data.metadata && data.metadata.session_id) {
                setSessionId(data.metadata.session_id);
                console.log(`✓ Session active: ${data.metadata.session_id}`);
            }

            // Handle both structured dialogue response and simple message
            const auronMessage = data.message?.guidance || data.response || data.message;
            setMessages(prev => [...prev, { role: 'auron', content: auronMessage }]);

        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                role: 'auron',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white text-2xl">
                ✕
            </button>

            {/* Main Container */}
            <div className="w-full max-w-4xl mx-auto px-8 h-full flex flex-col py-8">

                {/* Header */}
                <div className="py-6 border-b border-white/10 mb-6">
                    <h2 className="text-2xl font-semibold text-center text-primary glow">
                        Reflection
                    </h2>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto mb-6" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00A8FF #1a1a1a'
                }}>
                    {loading && (
                        <div className="text-center text-gray-400 py-12">
                            Loading...
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-red-400 py-12">
                            Error: {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-2xl px-6 py-4 ${
                                        msg.role === 'user'
                                            ? 'max-w-[70%] bg-gradient-to-r from-primary/30 to-primary-dark/30 border border-primary/50'
                                            : 'max-w-[75%] bg-gray-900 border border-gray-800'
                                    }`}>
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 glow">
                                            {msg.role === 'user' ? 'You' : 'Auron'}
                                        </p>
                                        <p className="text-white leading-relaxed" style={{ lineHeight: '1.7' }}>
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {chatLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[75%] rounded-2xl px-6 py-4 bg-gray-900 border border-gray-800">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 glow">
                                            Auron
                                        </p>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <div className="border-t border-white/5 pt-6">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Continue the conversation..."
                            disabled={chatLoading}
                            className="flex-1 px-5 py-4 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {/* Audio Upload Button */}
                        <button
                            onClick={() => onAudioUpload && onAudioUpload()}
                            className="px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 flex items-center gap-2"
                            style={{
                                boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
                            }}>
                            <span style={{ fontSize: '1.2rem' }}>🎵</span>
                            <span>Upload Track</span>
                        </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || chatLoading}
                            className="btn-sci-fi px-8 py-4 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
                            {chatLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
