// ============================================================
// JOURNEY VIEW - Unified Chat + Reflections Timeline
// ============================================================
// Combines Dialogue and Reflections into a single continuous journey
// with bubble-free message rendering and vertical chapter timeline

/* React Hooks (UMD) */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

function JourneyView({ user, onUpdateProgress, loadedSessionId, sessionId, setSessionId, setSyncing, onConversationUpdate }) {
    // ============================================================
    // CURRENT EXPLORATION STATE (from ChatView)
    // ============================================================
    const [messages, setMessages] = useState([
        { role: 'auron', content: "Hello. I'm Auron, your creative psychologist. Share what's on your mind — whether it's frustration, curiosity, or something you can't quite name yet. I'm listening." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentDialogue, setCurrentDialogue] = useState(null);
    const messagesEndRef = useRef(null);

    // SSE Streaming state
    const [sseProgress, setSSEProgress] = useState(0);
    const [sseCurrentStage, setSSECurrentStage] = useState('');
    const [sseCompletedStages, setSSECompletedStages] = useState([]);
    const [isPanelFading, setIsPanelFading] = useState(false);

    // Token streaming state
    const streamingMessageIndexRef = useRef(null);
    const streamingGuidanceRef = useRef('');
    const blueprintSourcesRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const sseCleanupRef = useRef(null);

    // Session management
    const [needsLoadSession, setNeedsLoadSession] = useState(false);

    // Audio Upload State
    const [audioSessionId, setAudioSessionId] = useState(null);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const audioFileInputRef = useRef(null);

    // Neural Questionnaire State
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [questionnaireUploadId, setQuestionnaireUploadId] = useState(null);
    const [dspComplete, setDspComplete] = useState(false);
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState(null);
    const [synthesizedProfile, setSynthesizedProfile] = useState(null);
    const [audioFileUrl, setAudioFileUrl] = useState(null);
    const [isDraggingAudio, setIsDraggingAudio] = useState(false);

    // Frontend Encryption State
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [userHash, setUserHash] = useState(null);
    const [conversationTitle, setConversationTitle] = useState(null);
    const isFirstMessageRef = useRef(true);

    // ============================================================
    // JOURNEY/TIMELINE STATE (new)
    // ============================================================
    const [chapters, setChapters] = useState([]);
    const [expandedChapterId, setExpandedChapterId] = useState(null);
    const [expandedChapterMessages, setExpandedChapterMessages] = useState([]);
    const [journeyDepth, setJourneyDepth] = useState(0);
    const [chaptersLoading, setChaptersLoading] = useState(true);
    const journeyContainerRef = useRef(null);

    // Sidebar state (for sources/references)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarSources, setSidebarSources] = useState([]);
    const [blueprintPanelOpen, setBlueprintPanelOpen] = useState(false);
    const [blueprintPanelSources, setBlueprintPanelSources] = useState([]);

    // ============================================================
    // INITIALIZATION
    // ============================================================

    // Initialize frontend encryption and conversation index
    useEffect(() => {
        const initEncryption = async () => {
            const userId = user?.sub || user?.id;
            if (!userId) return;

            try {
                console.log('Journey: Initializing encryption for user:', userId.slice(0, 8) + '...');
                const key = await deriveUserEncryptionKey(userId);
                const hash = await hashUserId(userId);
                setEncryptionKey(key);
                setUserHash(hash);

                // Initialize conversation index
                await conversationIndex.init(userId);
                await conversationIndex.load();
                console.log('Journey: Encryption initialized');
            } catch (err) {
                console.error('Journey: Failed to initialize encryption:', err);
            }
        };
        initEncryption();
    }, [user?.sub, user?.id]);

    // Load chapters (past conversations) from index
    useEffect(() => {
        const loadChapters = async () => {
            try {
                setChaptersLoading(true);
                const userId = user?.sub || user?.id;
                if (!userId) {
                    setChapters([]);
                    return;
                }

                // Ensure index is initialized
                if (!conversationIndex.initialized) {
                    await conversationIndex.init(userId);
                }
                await conversationIndex.load();

                // Get all conversations as chapters
                const allChapters = conversationIndex.list(50); // Get up to 50 chapters
                console.log('Journey: Loaded', allChapters.length, 'chapters');
                setChapters(allChapters);
            } catch (err) {
                console.error('Journey: Failed to load chapters:', err);
                setChapters([]);
            } finally {
                setChaptersLoading(false);
            }
        };
        loadChapters();
    }, [user?.sub, user?.id]);

    // Load past conversation if loadedSessionId is provided
    useEffect(() => {
        if (loadedSessionId) {
            console.log('Journey: Loading past conversation:', loadedSessionId);
            loadPastConversation(loadedSessionId);
        }
    }, [loadedSessionId]);

    // ============================================================
    // CONVERSATION LOADING
    // ============================================================

    const loadPastConversation = async (conversationId) => {
        try {
            setLoading(true);
            const token = await getAuthToken();
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
            const bunnyResponse = await fetch(signed_url);
            if (!bunnyResponse.ok) throw new Error('Failed to fetch from BunnyCDN');

            const contentType = bunnyResponse.headers.get('content-type');
            let conversationData;
            if (contentType && contentType.includes('application/json')) {
                conversationData = await bunnyResponse.json();
            } else {
                const encryptedData = await bunnyResponse.arrayBuffer();
                conversationData = await decryptConversation(encryptedData, encryption_key);
            }

            setMessages(conversationData.messages || []);
            setSessionId(conversationId);
            setNeedsLoadSession(true);
            isFirstMessageRef.current = false;
            if (conversationData.title) {
                setConversationTitle(conversationData.title);
            }
        } catch (err) {
            console.error('Journey: Failed to load past conversation:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load expanded chapter content
    const loadChapterContent = async (chapterId) => {
        try {
            const convEntry = conversationIndex.getConversation(chapterId);
            if (!convEntry || !convEntry.bunny_key) {
                throw new Error('Chapter not found in index');
            }

            const token = await getAuthToken();
            const response = await fetch(`${BFF_API_BASE}/cdn-proxy?path=${encodeURIComponent(convEntry.bunny_key)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Failed to fetch chapter: ${response.status}`);

            const encryptedData = await response.arrayBuffer();
            const conversationData = await decryptData(encryptedData, conversationIndex.encryptionKey);

            return conversationData.messages || [];
        } catch (err) {
            console.error('Journey: Failed to load chapter content:', err);
            return [];
        }
    };

    // Toggle chapter expansion
    const toggleChapter = async (chapterId) => {
        if (expandedChapterId === chapterId) {
            // Collapse
            setExpandedChapterId(null);
            setExpandedChapterMessages([]);
        } else {
            // Expand
            setExpandedChapterId(chapterId);
            const chapterMessages = await loadChapterContent(chapterId);
            setExpandedChapterMessages(chapterMessages);
        }
    };

    // Continue from a chapter (load it as current conversation)
    const continueFromChapter = (chapterId) => {
        loadPastConversation(chapterId);
        setExpandedChapterId(null);
        setExpandedChapterMessages([]);
    };

    // ============================================================
    // SAVE CONVERSATION (same as ChatView)
    // ============================================================

    const saveConversationToCloud = async (currentSessionId, allMessages, title) => {
        console.log('Journey: saveConversationToCloud called:', { currentSessionId, messageCount: allMessages.length, title });

        if (!encryptionKey || !userHash) {
            console.warn('Journey: Encryption not initialized, skipping save');
            return;
        }

        try {
            const token = await getAuthToken();
            const conversationPath = `conversations/${userHash}/${currentSessionId}.enc`;

            const conversationData = {
                id: currentSessionId,
                title: title || conversationTitle || generateConversationTitle(allMessages.find(m => m.role === 'user')?.content || ''),
                messages: allMessages.map(m => ({
                    role: m.role,
                    content: m.role === 'auron' ? (m.dialogue?.guidance || m.content || '') : (m.content || ''),
                    timestamp: m.timestamp || new Date().toISOString(),
                    ...(m.dialogue && { dialogue: m.dialogue, isDialogue: true })
                })),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const encryptedData = await encryptData(conversationData, encryptionKey);
            const uploadResponse = await fetch(`${BFF_API_BASE}/cdn-proxy`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                    'X-CDN-Path': conversationPath
                },
                body: encryptedData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Failed to save conversation: ${uploadResponse.status}`);
            }

            const indexEntry = {
                id: currentSessionId,
                title: conversationData.title,
                created_at: conversationData.created_at,
                message_count: allMessages.length,
                bunny_key: conversationPath
            };

            if (conversationIndex.hasConversation(currentSessionId)) {
                await conversationIndex.updateConversation(currentSessionId, {
                    title: conversationData.title,
                    message_count: allMessages.length
                });
            } else {
                await conversationIndex.addConversation(indexEntry);
                // Refresh chapters list
                const allChapters = conversationIndex.list(50);
                setChapters(allChapters);
            }

            console.log(`Journey: Conversation saved: ${currentSessionId}`);

            if (onConversationUpdate) {
                onConversationUpdate({
                    id: currentSessionId,
                    conversation_id: currentSessionId,
                    title: conversationData.title,
                    message_count: allMessages.length,
                    updated_at: conversationData.updated_at
                });
            }
        } catch (err) {
            console.error('Journey: Failed to save conversation:', err);
        }
    };

    // ============================================================
    // MESSAGE SENDING (SSE Streaming - same as ChatView)
    // ============================================================

    const handleSendMessage = async (messageText) => {
        const textToSend = messageText || input.trim();
        if (!textToSend || loading) return;

        setInput('');
        setLoading(true);

        // Prepare conversation history
        const conversationHistory = messages.map(msg => ({
            role: msg.role === 'auron' ? 'assistant' : msg.role,
            content: msg.dialogue?.guidance || msg.content
        }));

        // Add user message
        const userMessage = {
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        // Generate title for first message
        let title = conversationTitle;
        if (isFirstMessageRef.current) {
            title = generateConversationTitle(textToSend);
            setConversationTitle(title);
            isFirstMessageRef.current = false;
        }

        try {
            // Use SSE streaming
            const result = await connectSSEChat({
                message: textToSend,
                conversationHistory,
                sessionId: sessionId,
                needsLoadSession,
                onProgress: (progress, stage) => {
                    setSSEProgress(progress);
                    setSSECurrentStage(stage);
                },
                onStageComplete: (stage) => {
                    setSSECompletedStages(prev => [...prev, stage]);
                },
                onToken: (token) => {
                    if (streamingMessageIndexRef.current === null) {
                        streamingMessageIndexRef.current = messages.length + 1;
                        setMessages(prev => [...prev, {
                            role: 'auron',
                            content: 'View Insight →',
                            isStreaming: true,
                            isDialogue: true,
                            guidance: ''
                        }]);
                    }
                    streamingGuidanceRef.current += token;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const idx = streamingMessageIndexRef.current;
                        if (newMsgs[idx]) {
                            newMsgs[idx] = {
                                ...newMsgs[idx],
                                guidance: streamingGuidanceRef.current
                            };
                        }
                        return newMsgs;
                    });
                },
                onBlueprintSources: (sources) => {
                    blueprintSourcesRef.current = sources;
                },
                onComplete: (dialogue, newSessionId) => {
                    setNeedsLoadSession(false);

                    if (newSessionId && newSessionId !== sessionId) {
                        setSessionId(newSessionId);
                    }

                    const finalMessage = {
                        role: 'auron',
                        content: 'View Insight →',
                        isDialogue: true,
                        isStreaming: false,
                        dialogue: {
                            ...dialogue,
                            blueprint_sources: blueprintSourcesRef.current || dialogue.blueprint_sources
                        },
                        timestamp: new Date().toISOString()
                    };

                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const idx = streamingMessageIndexRef.current;
                        if (idx !== null && newMsgs[idx]) {
                            newMsgs[idx] = finalMessage;
                        }
                        saveConversationToCloud(newSessionId || sessionId, newMsgs, title);
                        return newMsgs;
                    });

                    // Reset streaming state
                    streamingMessageIndexRef.current = null;
                    streamingGuidanceRef.current = '';
                    blueprintSourcesRef.current = null;
                    setIsStreaming(false);
                    setIsPanelFading(true);
                    setTimeout(() => {
                        setIsPanelFading(false);
                        setSSEProgress(0);
                        setSSECurrentStage('');
                        setSSECompletedStages([]);
                    }, 500);
                },
                onError: async (error) => {
                    console.error('Journey: SSE error, falling back to POST:', error);
                    // Fallback to POST endpoint
                    try {
                        const token = await getAuthToken();
                        const response = await fetch(`${DIALOGUE_API_BASE}/chat`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: textToSend,
                                conversation_history: conversationHistory,
                                metadata: { session_id: sessionId }
                            })
                        });

                        if (!response.ok) throw new Error('Failed to send message');
                        const data = await response.json();
                        const newSessionId = data.metadata?.session_id || sessionId;

                        if (newSessionId) setSessionId(newSessionId);

                        const dialogue = data.message || {};
                        const guidance = dialogue.guidance || data.response || '';

                        const auronMessage = {
                            role: 'auron',
                            content: guidance,
                            dialogue: dialogue,
                            isDialogue: !!dialogue.guidance,
                            timestamp: new Date().toISOString()
                        };

                        setMessages(prev => {
                            const newMsgs = [...prev, auronMessage];
                            saveConversationToCloud(newSessionId, newMsgs, title);
                            return newMsgs;
                        });
                    } catch (err) {
                        console.error('Journey: Fallback POST also failed:', err);
                        setMessages(prev => [...prev, {
                            role: 'auron',
                            content: 'Sorry, I encountered an error. Please try again.'
                        }]);
                    }
                }
            });
        } catch (err) {
            console.error('Journey: Failed to send message:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ============================================================
    // SCROLL HANDLING
    // ============================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleScroll = (e) => {
        const container = e.target;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Calculate journey depth (0 = bottom/present, 1 = top/oldest)
        const maxScroll = scrollHeight - clientHeight;
        const depth = maxScroll > 0 ? (maxScroll - scrollTop) / maxScroll : 0;
        setJourneyDepth(Math.min(Math.max(depth, 0), 1));
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div
            className="journey-container"
            ref={journeyContainerRef}
            onScroll={handleScroll}
        >
            {/* Ambient Canvas Background */}
            <JourneyCanvas depth={journeyDepth} chapterCount={chapters.length} />

            {/* Thinking Panel (during SSE) */}
            {(sseCurrentStage || sseCompletedStages.length > 0) && !isPanelFading && (
                <ThinkingPanel
                    progress={sseProgress}
                    currentStage={sseCurrentStage}
                    completedStages={sseCompletedStages}
                />
            )}

            {/* Main Content Area */}
            <div className="journey-content">
                {/* Chapter Timeline (Past Conversations) */}
                <ChapterTimeline
                    chapters={chapters}
                    loading={chaptersLoading}
                    expandedId={expandedChapterId}
                    expandedMessages={expandedChapterMessages}
                    onToggle={toggleChapter}
                    onContinue={continueFromChapter}
                    onOpenReferences={(sources) => {
                        setSidebarSources(sources);
                        setSidebarOpen(true);
                    }}
                />

                {/* Present Marker */}
                {chapters.length > 0 && (
                    <div className="present-marker">
                        <span>Present</span>
                    </div>
                )}

                {/* Current Exploration */}
                <CurrentExploration
                    messages={messages}
                    loading={loading}
                    isStreaming={isStreaming}
                    onSend={handleSendMessage}
                    onOpenReferences={(sources) => {
                        setSidebarSources(sources);
                        setSidebarOpen(true);
                    }}
                    onOpenBlueprintPanel={(sources) => {
                        setBlueprintPanelSources(sources);
                        setBlueprintPanelOpen(true);
                    }}
                />

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Expression Input */}
            <ExpressionInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSendMessage()}
                onKeyPress={handleKeyPress}
                disabled={loading}
                placeholder="What's stirring in your creative mind..."
            />

            {/* Sidebars */}
            <ReferencesSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sources={sidebarSources}
            />
            <BlueprintFloatingPanel
                isOpen={blueprintPanelOpen}
                onClose={() => setBlueprintPanelOpen(false)}
                sources={blueprintPanelSources}
            />
        </div>
    );
}

// ============================================================
// JOURNEY CANVAS - Ambient Background
// ============================================================

function JourneyCanvas({ depth, chapterCount }) {
    const intensity = Math.min(chapterCount / 20, 1);

    return (
        <div className="journey-canvas">
            {/* Gradient that shifts based on scroll depth */}
            <div
                className="journey-gradient"
                style={{
                    background: `radial-gradient(ellipse at 50% ${100 - (depth * 80)}%,
                        rgba(59, 130, 246, ${0.04 + (depth * 0.04)}) 0%,
                        transparent 60%)`
                }}
            />

            {/* Subtle particle effect - more visible deeper in journey */}
            <div
                className="journey-particles"
                style={{ opacity: 0.3 + (depth * 0.4) }}
            />
        </div>
    );
}

// ============================================================
// CHAPTER TIMELINE - Past Conversations
// ============================================================

function ChapterTimeline({ chapters, loading, expandedId, expandedMessages, onToggle, onContinue, onOpenReferences }) {
    if (loading) {
        return (
            <div className="chapter-timeline-loading">
                <div className="loading-spinner" />
                <p>Loading your journey...</p>
            </div>
        );
    }

    if (chapters.length === 0) {
        return null; // No past chapters to show
    }

    // Format relative date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="chapter-timeline">
            {chapters.map((chapter, index) => (
                <div
                    key={chapter.id}
                    className={`chapter-node ${expandedId === chapter.id ? 'expanded' : ''}`}
                >
                    {/* Timeline connector */}
                    <div
                        className="timeline-connector"
                        style={{ opacity: 0.2 + ((index / chapters.length) * 0.6) }}
                    />

                    {/* Chapter marker */}
                    <button
                        className="chapter-marker"
                        onClick={() => onToggle(chapter.id)}
                    >
                        <span className="chapter-date">
                            {formatDate(chapter.created_at || chapter.timestamp)}
                        </span>
                        <span className="chapter-title">
                            {chapter.title || 'Untitled exploration'}
                        </span>
                        <span className="chapter-meta">
                            {chapter.message_count || 0} exchanges
                        </span>
                    </button>

                    {/* Expanded chapter content */}
                    {expandedId === chapter.id && (
                        <div className="chapter-content">
                            <div className="chapter-messages">
                                {expandedMessages.map((msg, idx) => (
                                    msg.role === 'user' ? (
                                        <UserExpression key={idx} content={msg.content} />
                                    ) : (
                                        <AuronResponse
                                            key={idx}
                                            message={msg}
                                            isLatest={false}
                                            onOpenReferences={onOpenReferences}
                                        />
                                    )
                                ))}
                            </div>
                            <button
                                className="chapter-continue"
                                onClick={() => onContinue(chapter.id)}
                            >
                                Continue this exploration
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ============================================================
// CURRENT EXPLORATION - Live Conversation (Bubble-Free)
// ============================================================

function CurrentExploration({ messages, loading, isStreaming, onSend, onOpenReferences, onOpenBlueprintPanel }) {
    return (
        <div className="current-exploration">
            {messages.map((msg, idx) => (
                msg.role === 'user' ? (
                    <UserExpression key={idx} content={msg.content} />
                ) : (
                    <AuronResponse
                        key={idx}
                        message={msg}
                        isLatest={idx === messages.length - 1 && !loading}
                        onRespond={onSend}
                        onOpenReferences={onOpenReferences}
                        onOpenBlueprintPanel={onOpenBlueprintPanel}
                    />
                )
            ))}

            {loading && !isStreaming && (
                <div className="thinking-indicator">
                    <span>Contemplating</span>
                    <div className="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// USER EXPRESSION - No Bubble, Right-Aligned
// ============================================================

function UserExpression({ content }) {
    return (
        <div className="user-expression">
            <p>{content}</p>
        </div>
    );
}

// ============================================================
// AURON RESPONSE - Flowing Text, No Bubble
// ============================================================

function AuronResponse({ message, isLatest, onRespond, onOpenReferences, onOpenBlueprintPanel }) {
    const dialogue = message.dialogue || {};
    const guidance = dialogue.guidance || message.content || '';
    const reflectiveQuestion = dialogue.reflective_question;
    const researchSynthesis = dialogue.research_synthesis;
    const sources = dialogue.sources;
    const citedReferences = dialogue.cited_references;
    const blueprintSources = dialogue.blueprint_sources;

    // Check if this is a streaming message
    if (message.isStreaming) {
        return (
            <div className="auron-response streaming">
                <div className="guidance-flow">
                    {message.guidance || ''}
                    <span className="streaming-cursor">|</span>
                </div>
            </div>
        );
    }

    return (
        <div className="auron-response">
            {/* Blueprint corner ribbon */}
            {blueprintSources && blueprintSources.length > 0 && (
                <button
                    className="blueprint-ribbon"
                    onClick={() => onOpenBlueprintPanel && onOpenBlueprintPanel(blueprintSources)}
                >
                    Neural Blueprint
                </button>
            )}

            {/* Main guidance - flows naturally */}
            <div className="guidance-flow">
                {citedReferences ? (
                    <TextWithCitations text={guidance} cited_references={citedReferences} />
                ) : (
                    <p>{guidance}</p>
                )}
            </div>

            {/* Evidence panel - subtle, collapsible */}
            {researchSynthesis && (
                <div className="evidence-panel">
                    <div className="evidence-header">
                        <span className="evidence-icon">🔬</span>
                        <span>Evidence in the Pattern</span>
                    </div>
                    <div className="evidence-content">
                        <TextWithCitations text={researchSynthesis} cited_references={citedReferences} />
                    </div>
                </div>
            )}

            {/* Reflection invitation - only on latest message */}
            {isLatest && reflectiveQuestion && (
                <ReflectionInvitation
                    question={reflectiveQuestion}
                    onRespond={onRespond}
                />
            )}

            {/* Sources link */}
            {sources && sources.length > 0 && (
                <button
                    className="sources-link"
                    onClick={() => onOpenReferences && onOpenReferences(sources)}
                >
                    View {sources.length} references
                </button>
            )}
        </div>
    );
}

// ============================================================
// REFLECTION INVITATION - Centered, Glowing
// ============================================================

function ReflectionInvitation({ question, onRespond }) {
    const [response, setResponse] = useState('');

    const handleSubmit = () => {
        if (response.trim()) {
            onRespond(response);
            setResponse('');
        }
    };

    return (
        <div className="reflection-invitation">
            <p className="reflection-question">{question}</p>
            <textarea
                className="reflection-input"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your reflection..."
                rows={3}
            />
            <button
                className="reflection-submit"
                onClick={handleSubmit}
                disabled={!response.trim()}
            >
                Continue
            </button>
        </div>
    );
}

// ============================================================
// EXPRESSION INPUT - Bottom Sticky Input
// ============================================================

function ExpressionInput({ value, onChange, onSubmit, onKeyPress, disabled, placeholder }) {
    return (
        <div className="expression-input-container">
            <div className="expression-input-wrapper">
                <textarea
                    className="expression-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={onKeyPress}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={value.length > 100 ? 3 : 1}
                />
                <button
                    className="expression-send"
                    onClick={onSubmit}
                    disabled={!value.trim() || disabled}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
