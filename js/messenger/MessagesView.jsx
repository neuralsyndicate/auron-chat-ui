// ============================================================
// MESSAGES VIEW - Session Protocol Messenger
// Bound to Logto authentication - each user has their own Session identity
// ============================================================

const { useState, useEffect, useRef, useCallback } = React;

function MessagesView({ user }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [inputText, setInputText] = useState('');
    const [recipientInput, setRecipientInput] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const messagesEndRef = useRef(null);
    const clientRef = useRef(null);

    // Get user ID from Logto user object
    const userId = user?.id || user?.sub;

    // Initialize Session client bound to authenticated user
    useEffect(() => {
        if (!userId) {
            setError('Authentication required');
            setIsLoading(false);
            return;
        }

        async function initSession() {
            try {
                setIsLoading(true);
                setError(null);

                // Get user-scoped Session client
                const client = window.getSessionClient(userId);
                clientRef.current = client;

                // Check for existing mnemonic for this user
                const existingMnemonic = window.SessionStorage.getMnemonic(userId);
                const newMnemonic = await client.initialize(userId, existingMnemonic || undefined);

                if (newMnemonic) {
                    console.log('New Session account created for user:', userId);
                }

                setSessionId(client.getSessionId());
                setIsInitialized(true);

                // Load user's saved conversations
                const savedConvs = window.SessionStorage.getConversations(userId);
                setConversations(savedConvs);

                // Start polling for messages
                client.startPolling((msg) => {
                    handleIncomingMessage(msg);
                }, 5000);

            } catch (err) {
                console.error('Session init error:', err);
                setError(err.message || 'Failed to initialize secure messaging');
            } finally {
                setIsLoading(false);
            }
        }

        initSession();

        return () => {
            if (clientRef.current) {
                clientRef.current.stopPolling();
            }
        };
    }, [userId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load messages when conversation changes
    useEffect(() => {
        if (activeConversation && userId) {
            const savedMessages = window.SessionStorage.getMessages(userId, activeConversation.sessionId);
            setMessages(savedMessages);
        }
    }, [activeConversation, userId]);

    // Handle incoming message
    const handleIncomingMessage = useCallback((msg) => {
        const newMsg = {
            id: Date.now(),
            from: msg.from,
            text: msg.text,
            timestamp: msg.timestamp,
            incoming: true
        };

        setMessages(prev => {
            const updated = [...prev, newMsg];
            // Save to storage if this is the active conversation
            if (activeConversation?.sessionId === msg.from) {
                window.SessionStorage.storeMessages(userId, msg.from, updated);
            }
            return updated;
        });

        // Add/update conversation
        setConversations(prev => {
            const exists = prev.find(c => c.sessionId === msg.from);
            let updated;
            if (!exists) {
                updated = [...prev, {
                    sessionId: msg.from,
                    name: `${msg.from.slice(0, 8)}...`,
                    lastMessage: msg.text,
                    lastTimestamp: msg.timestamp
                }];
            } else {
                updated = prev.map(c =>
                    c.sessionId === msg.from
                        ? { ...c, lastMessage: msg.text, lastTimestamp: msg.timestamp }
                        : c
                );
            }
            window.SessionStorage.storeConversations(userId, updated);
            return updated;
        });
    }, [activeConversation, userId]);

    // Send message
    const handleSend = async () => {
        if (!inputText.trim() || !activeConversation) return;

        try {
            await clientRef.current.sendMessage(activeConversation.sessionId, inputText);

            const newMsg = {
                id: Date.now(),
                from: sessionId,
                text: inputText,
                timestamp: Date.now(),
                incoming: false
            };

            // Add to messages and save
            setMessages(prev => {
                const updated = [...prev, newMsg];
                window.SessionStorage.storeMessages(userId, activeConversation.sessionId, updated);
                return updated;
            });

            // Update conversation
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.sessionId === activeConversation.sessionId
                        ? { ...c, lastMessage: inputText, lastTimestamp: Date.now() }
                        : c
                );
                window.SessionStorage.storeConversations(userId, updated);
                return updated;
            });

            setInputText('');
        } catch (err) {
            console.error('Send failed:', err);
            setError('Failed to send message');
        }
    };

    // Start new conversation
    const handleStartNewChat = () => {
        if (!recipientInput.trim()) return;

        const recipientId = recipientInput.trim();
        const newConv = {
            sessionId: recipientId,
            name: `${recipientId.slice(0, 8)}...`,
            lastMessage: '',
            lastTimestamp: Date.now()
        };

        setConversations(prev => {
            const exists = prev.find(c => c.sessionId === recipientId);
            if (exists) {
                setActiveConversation(exists);
                setShowNewChat(false);
                setRecipientInput('');
                return prev;
            }
            const updated = [...prev, newConv];
            window.SessionStorage.storeConversations(userId, updated);
            return updated;
        });

        setActiveConversation(newConv);
        setShowNewChat(false);
        setRecipientInput('');
        setMessages([]);
    };

    // Copy Session ID
    const copySessionId = async () => {
        try {
            await navigator.clipboard.writeText(sessionId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Initializing secure messaging...</p>
                    <p className="text-gray-500 text-sm mt-2">Connecting to Session network</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <div className="text-red-400 text-4xl mb-4">⚠</div>
                    <h3 className="text-white text-lg mb-2">Connection Error</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Sidebar - Conversations */}
            <div className="w-80 border-r border-white/5 flex flex-col">
                {/* Session ID Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Session ID</div>
                    <div
                        onClick={copySessionId}
                        className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group"
                    >
                        <code className="text-xs text-blue-400 truncate flex-1 font-mono">{sessionId}</code>
                        <span className="text-gray-500 text-xs group-hover:text-blue-400 transition-colors">
                            {copySuccess ? '✓ copied' : 'copy'}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                        Logged in as: {user?.username || user?.name || 'User'}
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="w-full px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
                    >
                        + New Conversation
                    </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            <p>No conversations yet</p>
                            <p className="mt-2 text-xs">Share your Session ID to receive messages</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.sessionId}
                                onClick={() => setActiveConversation(conv)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                                    activeConversation?.sessionId === conv.sessionId
                                        ? 'bg-white/5'
                                        : 'hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-400 text-sm font-medium">
                                            {conv.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium truncate">{conv.name}</div>
                                        <div className="text-gray-500 text-xs truncate">{conv.lastMessage || 'No messages'}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Security Badge */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>End-to-end encrypted via Session Protocol</span>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <span className="text-blue-400 text-sm font-medium">
                                    {activeConversation.name.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium">{activeConversation.name}</div>
                                <div className="text-xs text-gray-500 truncate font-mono">{activeConversation.sessionId}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    E2E Encrypted
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm py-8">
                                    <p>No messages yet</p>
                                    <p className="text-xs mt-2">Messages are end-to-end encrypted</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.incoming ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                                                msg.incoming
                                                    ? 'bg-white/5 text-white rounded-bl-md'
                                                    : 'bg-blue-500/20 text-white rounded-br-md'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            <div className="text-xs text-gray-500 mt-1 text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="text-6xl mb-4 opacity-20">💬</div>
                            <h3 className="text-white text-lg mb-2">Secure Messaging</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Select a conversation or start a new one.
                                All messages are end-to-end encrypted using Session Protocol.
                            </p>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewChat(false)}>
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg font-medium mb-2">New Conversation</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Enter the Session ID of the person you want to message.
                            They can find their Session ID in their Messages tab.
                        </p>
                        <input
                            type="text"
                            value={recipientInput}
                            onChange={(e) => setRecipientInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStartNewChat()}
                            placeholder="Enter Session ID (05...)"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 mb-4 font-mono text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewChat(false)}
                                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartNewChat}
                                disabled={!recipientInput.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export for global access
window.MessagesView = MessagesView;
