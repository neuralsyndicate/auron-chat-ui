// ============================================================
// MESSAGES VIEW - Session Protocol Messenger
// Bound to Logto authentication - each user has their own Session identity
// Encrypted local storage via WebCrypto
// Contact request system with username integration
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
    const [pendingRequests, setPendingRequests] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [requestsCollapsed, setRequestsCollapsed] = useState(false);
    const [introMessage, setIntroMessage] = useState('');

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

                // Set user info for envelope metadata
                client.setUserInfo(user);

                // Check for existing mnemonic (async - encrypted storage)
                const existingMnemonic = await window.SessionStorage.getMnemonic(userId);
                await client.initialize(userId, existingMnemonic || undefined);

                setSessionId(client.getSessionId());
                setIsInitialized(true);

                // Load user's data (async - encrypted)
                const [savedConvs, savedContacts, savedRequests] = await Promise.all([
                    window.SessionStorage.getConversations(userId),
                    window.SessionStorage.getContacts(userId),
                    window.SessionStorage.getPendingRequests(userId)
                ]);
                setConversations(savedConvs);
                setContacts(savedContacts);
                setPendingRequests(savedRequests);

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
            (async () => {
                const savedMessages = await window.SessionStorage.getMessages(userId, activeConversation.sessionId);
                setMessages(savedMessages);
            })();
        }
    }, [activeConversation, userId]);

    // Handle incoming message with contact system
    const handleIncomingMessage = useCallback(async (msg) => {
        const result = await window.ContactManager.processIncomingMessage(userId, msg, user);

        switch (result.action) {
            case 'blocked':
                // Silent drop - do nothing
                return;

            case 'acknowledged':
                // Our request was accepted - update contacts
                setContacts(prev => {
                    const exists = prev.find(c => c.sessionId === result.contact.sessionId);
                    if (exists) return prev;
                    return [...prev, result.contact];
                });
                // Update conversation status if we have one
                setConversations(prev => {
                    return prev.map(c => {
                        if (c.sessionId === result.contact.sessionId) {
                            return { ...c, status: 'accepted', ...result.contact };
                        }
                        return c;
                    });
                });
                break;

            case 'deliver':
                // Message from known contact
                const newMsg = result.message;

                setMessages(prev => {
                    // Only add if we're viewing this conversation
                    if (activeConversation?.sessionId === msg.from) {
                        const updated = [...prev, newMsg];
                        window.SessionStorage.storeMessages(userId, msg.from, updated);
                        return updated;
                    }
                    return prev;
                });

                // Update conversation
                setConversations(prev => {
                    const exists = prev.find(c => c.sessionId === msg.from);
                    let updated;
                    if (!exists) {
                        updated = [...prev, {
                            sessionId: msg.from,
                            username: result.contact.username,
                            displayName: result.contact.displayName,
                            name: getContactDisplayName(result.contact),
                            lastMessage: window.MessageEnvelope.parse(msg.text).payload,
                            lastTimestamp: msg.timestamp,
                            status: 'accepted'
                        }];
                    } else {
                        updated = prev.map(c =>
                            c.sessionId === msg.from
                                ? {
                                    ...c,
                                    lastMessage: window.MessageEnvelope.parse(msg.text).payload,
                                    lastTimestamp: msg.timestamp
                                }
                                : c
                        );
                    }
                    window.SessionStorage.storeConversations(userId, updated);
                    return updated;
                });
                break;

            case 'new_request':
            case 'held':
                // Update pending requests
                const freshRequests = await window.SessionStorage.getPendingRequests(userId);
                setPendingRequests(freshRequests);
                break;
        }
    }, [activeConversation, userId, user]);

    // Get display name for a contact
    const getContactDisplayName = (contact) => {
        if (contact.displayName) return contact.displayName;
        if (contact.username) return '@' + contact.username;
        return contact.sessionId.slice(0, 8) + '...';
    };

    // Get display name for a conversation
    const getConversationDisplayName = (conv) => {
        // Check contacts first
        const contact = contacts.find(c => c.sessionId === conv.sessionId);
        if (contact) {
            return getContactDisplayName(contact);
        }
        // Fallback to conversation data
        if (conv.displayName) return conv.displayName;
        if (conv.username) return '@' + conv.username;
        if (conv.name) return conv.name;
        return conv.sessionId.slice(0, 8) + '...';
    };

    // Check if conversation is with a verified contact
    const isVerifiedContact = (sessionId) => {
        return contacts.some(c => c.sessionId === sessionId);
    };

    // Handle accepting a contact request
    const handleAcceptRequest = async (sessionId) => {
        try {
            const result = await window.ContactManager.acceptRequest(
                userId,
                sessionId,
                user,
                clientRef.current
            );

            // Update local state
            setContacts(prev => [...prev, result.contact]);
            setPendingRequests(prev => prev.filter(r => r.sessionId !== sessionId));

            // Create conversation for the new contact
            const newConv = {
                sessionId: sessionId,
                username: result.contact.username,
                displayName: result.contact.displayName,
                name: getContactDisplayName(result.contact),
                lastMessage: result.initialMessage || '',
                lastTimestamp: Date.now(),
                status: 'accepted'
            };

            setConversations(prev => {
                const exists = prev.find(c => c.sessionId === sessionId);
                if (exists) {
                    return prev.map(c => c.sessionId === sessionId ? { ...c, ...newConv } : c);
                }
                return [...prev, newConv];
            });

            // Store messages from held messages
            if (result.initialMessage || (result.heldMessages && result.heldMessages.length > 0)) {
                const allMessages = [];
                if (result.initialMessage) {
                    allMessages.push({
                        id: Date.now() - 1000,
                        from: sessionId,
                        text: result.initialMessage,
                        timestamp: result.contact.addedAt - 1000,
                        incoming: true
                    });
                }
                result.heldMessages.forEach((held, i) => {
                    allMessages.push({
                        id: Date.now() + i,
                        from: sessionId,
                        text: held.text,
                        timestamp: held.timestamp,
                        incoming: true
                    });
                });
                await window.SessionStorage.storeMessages(userId, sessionId, allMessages);
            }

            // Open the conversation
            setActiveConversation(newConv);
        } catch (err) {
            console.error('Accept request failed:', err);
            setError('Failed to accept request');
            setTimeout(() => setError(null), 3000);
        }
    };

    // Handle ignoring a contact request
    const handleIgnoreRequest = async (sessionId) => {
        try {
            await window.ContactManager.ignoreRequest(userId, sessionId);
            setPendingRequests(prev => prev.filter(r => r.sessionId !== sessionId));
        } catch (err) {
            console.error('Ignore request failed:', err);
        }
    };

    // Handle blocking a user
    const handleBlockUser = async (sessionId) => {
        try {
            await window.ContactManager.blockUser(userId, sessionId);
            setPendingRequests(prev => prev.filter(r => r.sessionId !== sessionId));
            setContacts(prev => prev.filter(c => c.sessionId !== sessionId));
            setConversations(prev => prev.filter(c => c.sessionId !== sessionId));
            if (activeConversation?.sessionId === sessionId) {
                setActiveConversation(null);
            }
        } catch (err) {
            console.error('Block user failed:', err);
        }
    };

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
            setTimeout(() => setError(null), 3000);
        }
    };

    // Start new conversation (send contact request)
    const handleStartNewChat = async () => {
        if (!recipientInput.trim()) return;

        const recipientId = recipientInput.trim();

        // Check if already a contact
        const existingContact = contacts.find(c => c.sessionId === recipientId);
        if (existingContact) {
            const existingConv = conversations.find(c => c.sessionId === recipientId);
            if (existingConv) {
                setActiveConversation(existingConv);
            } else {
                const newConv = {
                    sessionId: recipientId,
                    username: existingContact.username,
                    displayName: existingContact.displayName,
                    name: getContactDisplayName(existingContact),
                    lastMessage: '',
                    lastTimestamp: Date.now(),
                    status: 'accepted'
                };
                setConversations(prev => [...prev, newConv]);
                setActiveConversation(newConv);
            }
            setShowNewChat(false);
            setRecipientInput('');
            setIntroMessage('');
            return;
        }

        // Check if we already have a pending outgoing request
        const existingConv = conversations.find(c => c.sessionId === recipientId);
        if (existingConv && existingConv.status === 'pending_outgoing') {
            setActiveConversation(existingConv);
            setShowNewChat(false);
            setRecipientInput('');
            setIntroMessage('');
            return;
        }

        try {
            // Send contact request
            const result = await window.ContactManager.sendRequest(
                userId,
                recipientId,
                user,
                clientRef.current,
                introMessage || undefined
            );

            const newConv = {
                sessionId: recipientId,
                name: `${recipientId.slice(0, 8)}...`,
                lastMessage: introMessage || 'Contact request sent',
                lastTimestamp: Date.now(),
                status: 'pending_outgoing'
            };

            setConversations(prev => {
                const exists = prev.find(c => c.sessionId === recipientId);
                if (exists) {
                    return prev.map(c => c.sessionId === recipientId ? newConv : c);
                }
                const updated = [...prev, newConv];
                window.SessionStorage.storeConversations(userId, updated);
                return updated;
            });

            setActiveConversation(newConv);
            setShowNewChat(false);
            setRecipientInput('');
            setIntroMessage('');
            setMessages([]);
        } catch (err) {
            console.error('Send request failed:', err);
            setError('Failed to send contact request');
            setTimeout(() => setError(null), 3000);
        }
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
    if (error && !isInitialized) {
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
                {/* Contact Requests Section */}
                <ContactRequestsSection
                    pendingRequests={pendingRequests}
                    onAccept={handleAcceptRequest}
                    onIgnore={handleIgnoreRequest}
                    onBlock={handleBlockUser}
                    isCollapsed={requestsCollapsed}
                    onToggleCollapse={() => setRequestsCollapsed(!requestsCollapsed)}
                />

                {/* Neural ID Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Neural ID</div>
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
                        Logged in as: <span className="text-blue-400">@{user?.username || user?.name || 'User'}</span>
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
                    {/* Section Header */}
                    {conversations.length > 0 && (
                        <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                            Conversations
                        </div>
                    )}

                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            <p>No conversations yet</p>
                            <p className="mt-2 text-xs">Share your Neural ID to receive messages</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const displayName = getConversationDisplayName(conv);
                            const isVerified = isVerifiedContact(conv.sessionId);
                            const isPendingOutgoing = conv.status === 'pending_outgoing';

                            return (
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isVerified
                                                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                                                : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
                                        }`}>
                                            <span className={`text-sm font-medium ${
                                                isVerified ? 'text-blue-400' : 'text-gray-400'
                                            }`}>
                                                {displayName.slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm font-medium truncate">
                                                    {displayName}
                                                </span>
                                                {isVerified && (
                                                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                {isPendingOutgoing && (
                                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-gray-500 text-xs truncate">
                                                {conv.lastMessage || 'No messages'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isVerifiedContact(activeConversation.sessionId)
                                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                                    : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
                            }`}>
                                <span className={`text-sm font-medium ${
                                    isVerifiedContact(activeConversation.sessionId) ? 'text-blue-400' : 'text-gray-400'
                                }`}>
                                    {getConversationDisplayName(activeConversation).slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">
                                        {getConversationDisplayName(activeConversation)}
                                    </span>
                                    {isVerifiedContact(activeConversation.sessionId) && (
                                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 truncate font-mono">{activeConversation.sessionId}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeConversation.status === 'pending_outgoing' ? (
                                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                        Request Pending
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                        E2E Encrypted
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Error toast */}
                        {error && (
                            <div className="mx-4 mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Pending outgoing notice */}
                        {activeConversation.status === 'pending_outgoing' && (
                            <div className="mx-4 mt-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-amber-400 text-sm font-medium">Contact Request Pending</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Your contact request has been sent. You can chat once they accept.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                            {activeConversation.status === 'pending_outgoing' ? (
                                <div className="text-center text-gray-500 text-sm py-2">
                                    Waiting for contact request to be accepted...
                                </div>
                            ) : (
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
                            )}
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
                            Enter the Neural ID of the person you want to message.
                            A contact request will be sent and you can chat once they accept.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Neural ID
                                </label>
                                <input
                                    type="text"
                                    value={recipientInput}
                                    onChange={(e) => setRecipientInput(e.target.value)}
                                    placeholder="Enter Neural ID (05...)"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Introduction Message (Optional)
                                </label>
                                <textarea
                                    value={introMessage}
                                    onChange={(e) => setIntroMessage(e.target.value)}
                                    placeholder="Hi! I'd like to connect with you."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowNewChat(false);
                                    setRecipientInput('');
                                    setIntroMessage('');
                                }}
                                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartNewChat}
                                disabled={!recipientInput.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send Request
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
