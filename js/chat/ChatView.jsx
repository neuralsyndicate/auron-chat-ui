// ============================================================
// CHAT VIEW - Main Chat Interface with SSE Streaming
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

function ChatView({ user, onUpdateProgress, loadedSessionId, sessionId, setSessionId, setSyncing, onConversationUpdate }) {
    const [messages, setMessages] = useState([
        { role: 'auron', content: "Hello. I'm Auron, your creative psychologist. Share what's on your mind — whether it's frustration, curiosity, or something you can't quite name yet. I'm listening." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentDialogue, setCurrentDialogue] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarSources, setSidebarSources] = useState([]);
    const [blueprintPanelOpen, setBlueprintPanelOpen] = useState(false);
    const [blueprintPanelSources, setBlueprintPanelSources] = useState([]);
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

    // Initialize frontend encryption and conversation index
    useEffect(() => {
        const initEncryption = async () => {
            if (!user?.sub) return;
            try {
                const key = await deriveUserEncryptionKey(user.sub);
                const hash = await hashUserId(user.sub);
                setEncryptionKey(key);
                setUserHash(hash);

                // Initialize conversation index
                await conversationIndex.init(user.sub);
                await conversationIndex.load();
                console.log('Frontend encryption initialized');
            } catch (err) {
                console.error('Failed to initialize encryption:', err);
            }
        };
        initEncryption();
    }, [user?.sub]);

    // Load past conversation from Reflections
    useEffect(() => {
        if (loadedSessionId) {
            console.log('Loading past conversation:', loadedSessionId);
            const loadPastMessages = async () => {
                try {
                    setLoading(true);
                    const token = await getAuthToken();
                    const verifyResponse = await fetch(`${BFF_API_BASE}/get-conversation`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversation_id: loadedSessionId })
                    });
                    if (!verifyResponse.ok) throw new Error('Failed to verify conversation access');
                    const { signed_url, encryption_key } = await verifyResponse.json();
                    const bunnyResponse = await fetch(signed_url);
                    if (!bunnyResponse.ok) throw new Error('Failed to fetch from BunnyCDN CDN');
                    const contentType = bunnyResponse.headers.get('content-type');
                    let conversationData;
                    if (contentType && contentType.includes('application/json')) {
                        conversationData = await bunnyResponse.json();
                    } else {
                        const encryptedData = await bunnyResponse.arrayBuffer();
                        conversationData = await decryptConversation(encryptedData, encryption_key);
                    }
                    setMessages(conversationData.messages || []);
                    setSessionId(loadedSessionId);
                    setNeedsLoadSession(true);
                    // Not a new conversation - don't regenerate title
                    isFirstMessageRef.current = false;
                    if (conversationData.title) {
                        setConversationTitle(conversationData.title);
                    }
                } catch (err) {
                    console.error('Failed to load past conversation:', err);
                } finally {
                    setLoading(false);
                }
            };
            loadPastMessages();
        }
    }, [loadedSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (sseCleanupRef.current) {
                console.log('Cleaning up SSE connection');
                sseCleanupRef.current();
            }
        };
    }, []);

    // Audio Upload Handlers
    const handleAudioUpload = () => audioFileInputRef.current?.click();

    const validateAudioFile = (file) => {
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) { alert('File too large. Maximum size is 50MB.'); return false; }
        const allowedFormats = ['.wav', '.mp3', '.flac', '.m4a', '.aiff', '.ogg'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedFormats.includes(fileExt)) { alert(`Unsupported format. Allowed: ${allowedFormats.join(', ')}`); return false; }
        return true;
    };

    const uploadAudioFile = async (file) => {
        if (!validateAudioFile(file)) return;
        try {
            setUploadingAudio(true);
            setUploadProgress(10);
            setIsDraggingAudio(false);
            const blobUrl = URL.createObjectURL(file);
            setAudioFileUrl(blobUrl);
            const tempUploadId = `temp-${Date.now()}`;
            setQuestionnaireUploadId(tempUploadId);
            setDspComplete(false);
            setQuestionnaireAnswers(null);
            setShowQuestionnaire(true);
            const token = await getAuthToken();
            const formData = new FormData();
            formData.append('audio_file', file);
            const uploadResponse = await fetch(`${DIALOGUE_API_BASE}/upload-audio`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadResponse.ok) { const error = await uploadResponse.json(); throw new Error(error.detail || 'Upload failed'); }
            const { upload_id } = await uploadResponse.json();
            console.log(`Audio upload started: ${upload_id}`);
            setUploadProgress(30);
            setQuestionnaireUploadId(upload_id);
            const sseUrl = `${DIALOGUE_API_BASE}/chat/stream-events?token=${encodeURIComponent(token)}`;
            const eventSource = new EventSource(sseUrl);
            const handleAnalysisStarted = (event) => { const data = JSON.parse(event.data); if (data.upload_id === upload_id) { setUploadProgress(50); } };
            const handleAnalysisComplete = (event) => {
                const data = JSON.parse(event.data);
                if (data.upload_id === upload_id) {
                    setUploadProgress(100);
                    setUploadingAudio(false);
                    setDspComplete(true);
                    eventSource.removeEventListener('audio_analysis_started', handleAnalysisStarted);
                    eventSource.removeEventListener('audio_analysis_complete', handleAnalysisComplete);
                    eventSource.removeEventListener('audio_analysis_failed', handleAnalysisFailed);
                    eventSource.close();
                }
            };
            const handleAnalysisFailed = (event) => {
                const data = JSON.parse(event.data);
                if (data.upload_id === upload_id) {
                    console.error('Analysis failed:', data);
                    alert(`Analysis failed: ${data.error || 'Unknown error'}`);
                    setUploadingAudio(false);
                    eventSource.removeEventListener('audio_analysis_started', handleAnalysisStarted);
                    eventSource.removeEventListener('audio_analysis_complete', handleAnalysisComplete);
                    eventSource.removeEventListener('audio_analysis_failed', handleAnalysisFailed);
                    eventSource.close();
                }
            };
            eventSource.addEventListener('audio_analysis_started', handleAnalysisStarted);
            eventSource.addEventListener('audio_analysis_complete', handleAnalysisComplete);
            eventSource.addEventListener('audio_analysis_failed', handleAnalysisFailed);
            setTimeout(() => { if (uploadingAudio) { eventSource.close(); setUploadingAudio(false); alert('Analysis timeout. Please try again.'); } }, 300000);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Upload failed. Please try again.');
            setUploadingAudio(false);
        }
    };

    const handleAudioFileSelect = async (e) => { const file = e.target.files[0]; if (!file) return; await uploadAudioFile(file); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!uploadingAudio) setIsDraggingAudio(true); };
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); if (!uploadingAudio) setIsDraggingAudio(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDraggingAudio(false); };
    const handleDrop = async (e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingAudio(false); if (uploadingAudio) return; const files = e.dataTransfer.files; if (files && files.length > 0) await uploadAudioFile(files[0]); };

    // Normalize Engine profile response
    const normalizeProfile = (profile) => {
        if (!profile) return profile;
        const normalized = { ...profile };
        if (profile.mix_signature && !profile.processing_signature) normalized.processing_signature = profile.mix_signature;
        if (profile.emotional_psychological_fingerprint && !profile.emotional_fingerprint) normalized.emotional_fingerprint = profile.emotional_psychological_fingerprint;
        if (normalized.genre_fusion?.synthesis) { normalized.genre_fusion.fusion_description = normalized.genre_fusion.synthesis; normalized.genre_fusion.primary_genres = normalized.genre_fusion.characteristics?.influences || []; }
        if (normalized.tonal_identity?.synthesis) { normalized.tonal_identity.harmonic_character = normalized.tonal_identity.synthesis; const tonalChars = normalized.tonal_identity.characteristics || {}; const keyString = tonalChars.key || ''; normalized.tonal_identity.harmonic_ratio = tonalChars.harmonic_ratio ?? 0; const keyParts = keyString.split(' '); if (keyParts.length >= 2) { normalized.tonal_identity.key = keyParts[0]; normalized.tonal_identity.mode = keyParts.slice(1).join(' '); } else { normalized.tonal_identity.key = keyString; normalized.tonal_identity.mode = ''; } }
        if (normalized.rhythmic_dna?.synthesis) { normalized.rhythmic_dna.groove_type = normalized.rhythmic_dna.synthesis; normalized.rhythmic_dna.tempo_feel = `${normalized.rhythmic_dna.characteristics?.tempo_bpm || ''} BPM`; }
        if (normalized.timbre_dna?.synthesis) { normalized.timbre_dna.texture_description = normalized.timbre_dna.synthesis; const timbreChars = normalized.timbre_dna.characteristics || {}; normalized.timbre_dna.stability = timbreChars.stability ?? 0; normalized.timbre_dna.brightness = timbreChars.brightness ?? 0; }
        if (!normalized.sound_palette && normalized.timbre_dna) { normalized.sound_palette = { frequency_focus: normalized.timbre_dna.synthesis, texture_description: '' }; } else if (normalized.sound_palette?.synthesis) { normalized.sound_palette.frequency_focus = normalized.sound_palette.synthesis; const paletteChars = normalized.sound_palette.characteristics || {}; normalized.sound_palette.role = paletteChars.role || ''; normalized.sound_palette.timbre = paletteChars.timbre || 'balanced'; normalized.sound_palette.texture_description = paletteChars.role ? `${paletteChars.role} (${paletteChars.timbre})` : ''; }
        if (normalized.processing_signature?.synthesis) { normalized.processing_signature.mix_approach = normalized.processing_signature.synthesis; const mixChars = normalized.processing_signature.characteristics || {}; normalized.processing_signature.stereo_width = mixChars.stereo_width ?? 0; normalized.processing_signature.dynamic_range = mixChars.dynamic_range ?? 0; normalized.processing_signature.compression_style = mixChars.dynamic_range > 10 ? 'Dynamic' : 'Compressed'; }
        if (normalized.sonic_architecture?.synthesis) { normalized.sonic_architecture.layering_approach = normalized.sonic_architecture.synthesis; normalized.sonic_architecture.tension_release = normalized.sonic_architecture.characteristics?.temporal_movement || ''; }
        if (normalized.inspirational_triggers?.synthesis) { normalized.inspirational_triggers.sources = normalized.inspirational_triggers.characteristics?.body_sensations || normalized.inspirational_triggers.characteristics?.influences || []; }
        if (normalized.emotional_fingerprint?.synthesis) { const emotionalChars = normalized.emotional_fingerprint.characteristics || {}; const nodes = []; (emotionalChars.creator_state || []).forEach(state => { nodes.push({ label: 'Creator', value: state }); }); (emotionalChars.listener_intention || []).forEach(intent => { nodes.push({ label: 'Listener', value: intent }); }); if (nodes.length === 0) { nodes.push({ label: 'Emotional Core', value: normalized.emotional_fingerprint.synthesis }); } normalized.emotional_fingerprint.nodes = nodes; }
        if (normalized.neural_spectrum?.characteristics) { const { value, placement, intensity } = normalized.neural_spectrum.characteristics; normalized.neural_spectrum.value = value ?? 0.5; normalized.neural_spectrum.placement = placement ?? 'hybrid'; normalized.neural_spectrum.intensity = intensity ?? 'medium'; }
        return normalized;
    };

    const submitProfileSynthesis = async (uploadId, answers) => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated - please log in again');
            const response = await fetch(`${DIALOGUE_API_BASE}/synthesize-profile`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ upload_id: uploadId, user_input: answers })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.detail || 'Profile synthesis failed'); }
            const result = await response.json();
            const normalizedResult = { ...result, profile: normalizeProfile(result.profile) };
            setSynthesizedProfile(normalizedResult);
            setShowQuestionnaire(false);
            setAudioSessionId(uploadId);
            return result;
        } catch (err) {
            console.error('Profile synthesis error:', err);
            alert('Failed to synthesize profile. Please try again.');
            throw err;
        }
    };

    const handleQuestionnaireComplete = async (answers) => {
        console.log('Questionnaire complete:', answers);
        setQuestionnaireAnswers(answers);
        if (dspComplete && questionnaireUploadId) await submitProfileSynthesis(questionnaireUploadId, answers);
    };

    React.useEffect(() => {
        if (dspComplete && questionnaireAnswers && questionnaireUploadId) submitProfileSynthesis(questionnaireUploadId, questionnaireAnswers);
    }, [dspComplete, questionnaireAnswers, questionnaireUploadId]);

    const handleQuestionnaireClose = () => { setShowQuestionnaire(false); setQuestionnaireUploadId(null); setDspComplete(false); setQuestionnaireAnswers(null); setSynthesizedProfile(null); };

    // Save conversation to BunnyCDN with frontend encryption
    const saveConversationToCloud = async (currentSessionId, allMessages, title) => {
        if (!encryptionKey || !userHash) {
            console.warn('Encryption not initialized, skipping save');
            return;
        }

        try {
            const token = await getAuthToken();
            const conversationPath = `conversations/${userHash}/${currentSessionId}.enc`;

            // Prepare conversation data
            const conversationData = {
                id: currentSessionId,
                title: title || conversationTitle || generateConversationTitle(allMessages.find(m => m.role === 'user')?.content || ''),
                messages: allMessages.map(m => ({
                    role: m.role,
                    content: m.content || m.dialogue?.guidance || '',
                    timestamp: m.timestamp || new Date().toISOString()
                })),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Encrypt and upload
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

            // Update conversation index
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
            }

            console.log(`Conversation saved: ${currentSessionId}`);

            // Notify parent about conversation update for sidebar refresh
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
            console.error('Failed to save conversation:', err);
        }
    };

    const handleSendMessage = async (messageText) => {
        setMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setLoading(true);
        setIsStreaming(true);
        setSSEProgress(0);
        setSSECurrentStage('');
        setSSECompletedStages([]);
        setIsPanelFading(false);
        streamingMessageIndexRef.current = null;
        streamingGuidanceRef.current = '';

        try {
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated - please log in again');
            if (needsLoadSession && sessionId) {
                const loadResponse = await fetch(`${DIALOGUE_API_BASE}/load-session`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversation_id: sessionId })
                });
                if (loadResponse.ok) { console.log('Session loaded into backend RAM'); setNeedsLoadSession(false); }
            }

            const cleanup = await connectSSEChat({
                message: messageText,
                sessionId: sessionId,
                token: token,
                onProgress: (event) => {
                    setSSEProgress(event.progress);
                    setSSECurrentStage(event.type);
                    if (event.type.endsWith('_complete') || event.type === 'blueprint_retrieved' || event.type === 'blueprint_skipped') {
                        setSSECompletedStages(prev => [...prev, event.type]);
                    }
                },
                onBlueprintRetrieved: (data) => { blueprintSourcesRef.current = data.sources || []; },
                onBlueprintSkipped: () => { blueprintSourcesRef.current = null; },
                onAuronGenerating: () => {
                    setMessages(prev => {
                        streamingMessageIndexRef.current = prev.length;
                        return [...prev, { role: 'auron', content: '', isStreaming: true, guidance: '' }];
                    });
                    setIsPanelFading(true);
                    setTimeout(() => { setIsStreaming(false); }, 1200);
                },
                onAuronToken: (token) => {
                    streamingGuidanceRef.current += token;
                    let displayText = streamingGuidanceRef.current.replace(/^GUIDANCE:\s*/i, '');
                    const reflectiveIndex = displayText.search(/\n\s*REFLECTIVE QUESTION:/i);
                    if (reflectiveIndex !== -1) displayText = displayText.substring(0, reflectiveIndex).trim();
                    const currentIndex = streamingMessageIndexRef.current;
                    if (currentIndex !== null) {
                        setMessages(msgs => msgs.map((msg, idx) => idx === currentIndex ? { ...msg, guidance: displayText, content: displayText } : msg));
                    }
                },
                onAuronComplete: (data) => {
                    const { guidance, reflective_question } = data;
                    const currentIndex = streamingMessageIndexRef.current;
                    let cleanStreamedText = streamingGuidanceRef.current.replace(/^GUIDANCE:\s*/i, '');
                    const reflectiveIndex = cleanStreamedText.search(/\n\s*REFLECTIVE QUESTION:/i);
                    if (reflectiveIndex !== -1) cleanStreamedText = cleanStreamedText.substring(0, reflectiveIndex).trim();
                    const finalGuidance = guidance || cleanStreamedText || '';
                    const finalQuestion = reflective_question || null;
                    if (currentIndex !== null) {
                        setMessages(msgs => msgs.map((msg, idx) => idx === currentIndex ? {
                            role: 'auron', content: "View Insight →", isDialogue: true, isStreaming: false,
                            dialogue: { guidance: finalGuidance, reflective_question: finalQuestion, sources: null, research_quality: null, cited_references: null, research_synthesis: null, blueprint_sources: blueprintSourcesRef.current }
                        } : msg));
                    }
                    streamingMessageIndexRef.current = null;
                    streamingGuidanceRef.current = '';
                    blueprintSourcesRef.current = null;
                },
                onComplete: (result) => {
                    const newSessionId = result.metadata?.session_id || sessionId;
                    if (result.metadata && result.metadata.session_id) setSessionId(result.metadata.session_id);

                    const currentIndex = streamingMessageIndexRef.current;
                    if (currentIndex !== null && result.sources) {
                        setMessages(msgs => msgs.map((msg, idx) => idx === currentIndex && msg.dialogue ? {
                            ...msg, dialogue: { ...msg.dialogue, sources: result.sources || msg.dialogue.sources, research_quality: result.analysis?.web_search?.research_quality || msg.dialogue.research_quality, cited_references: result.analysis?.cited_references || msg.dialogue.cited_references, research_synthesis: result.research_synthesis || msg.dialogue.research_synthesis }
                        } : msg));
                    }

                    // Frontend-first: Generate title and save conversation with encryption
                    if (newSessionId) {
                        // Generate title from first user message if this is a new conversation
                        let title = conversationTitle;
                        if (isFirstMessageRef.current) {
                            title = generateConversationTitle(messageText);
                            setConversationTitle(title);
                            isFirstMessageRef.current = false;
                        }

                        // Get current messages and save to cloud
                        setMessages(currentMsgs => {
                            saveConversationToCloud(newSessionId, currentMsgs, title);
                            return currentMsgs;
                        });
                    }

                    setTimeout(onUpdateProgress, 1000);
                    setIsStreaming(false);
                    setLoading(false);
                    setIsPanelFading(false);
                },
                onError: (error) => {
                    console.error('SSE Error - falling back to regular chat:', error);
                    fetch(`${DIALOGUE_API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: messageText, metadata: { session_id: sessionId } }) })
                    .then(res => res.json())
                    .then(data => {
                        const newSessionId = data.metadata?.session_id || sessionId;
                        if (data.metadata && data.metadata.session_id) setSessionId(data.metadata.session_id);

                        const messageData = data.auron_response || data.message;
                        const parsedMessage = typeof messageData === 'string' ? { guidance: messageData, reflective_question: "What insight from this resonates most with you?" } : messageData;
                        const dialogueWithSources = { ...parsedMessage, sources: data.sources || null, research_quality: data.analysis?.web_search?.research_quality || null, cited_references: data.analysis?.cited_references || null, research_synthesis: data.research_synthesis || null };
                        setMessages(prev => {
                            const newMessages = [...prev, { role: 'auron', content: "View Insight →", isDialogue: true, dialogue: dialogueWithSources }];

                            // Frontend-first: Save with encryption
                            if (newSessionId) {
                                let title = conversationTitle;
                                if (isFirstMessageRef.current) {
                                    title = generateConversationTitle(messageText);
                                    setConversationTitle(title);
                                    isFirstMessageRef.current = false;
                                }
                                saveConversationToCloud(newSessionId, newMessages, title);
                            }

                            return newMessages;
                        });
                        setTimeout(onUpdateProgress, 1000);
                    })
                    .catch(err => { setMessages(prev => [...prev, { role: 'auron', content: `Error: ${err.message}` }]); })
                    .finally(() => { setIsStreaming(false); setLoading(false); });
                }
            });
            sseCleanupRef.current = cleanup;
        } catch (err) {
            setMessages(prev => [...prev, { role: 'auron', content: `Error: ${err.message}` }]);
            setIsStreaming(false);
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim() || loading) return;
        const userMessage = input.trim();
        setInput('');
        handleSendMessage(userMessage);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <input ref={audioFileInputRef} type="file" accept=".wav,.mp3,.flac,.m4a,.aiff,.ogg" onChange={handleAudioFileSelect} style={{ display: 'none' }} />

            {audioSessionId && (
                <AudioSessionModalV7
                    uploadId={audioSessionId}
                    synthesizedProfile={synthesizedProfile}
                    audioUrl={audioFileUrl}
                    onClose={() => { setAudioSessionId(null); setSynthesizedProfile(null); if (audioFileUrl) { URL.revokeObjectURL(audioFileUrl); setAudioFileUrl(null); } }}
                />
            )}

            {showQuestionnaire && questionnaireUploadId && (
                <NeuralQuestionnaireModal uploadId={questionnaireUploadId} dspComplete={dspComplete} onComplete={handleQuestionnaireComplete} onClose={handleQuestionnaireClose} />
            )}

            {(isStreaming || isPanelFading) && (
                <ThinkingPanel stage={sseCurrentStage} progress={sseProgress} completedStages={sseCompletedStages} isFading={isPanelFading} />
            )}

            {currentDialogue && (
                <DialogueModal dialogue={currentDialogue} onClose={() => setCurrentDialogue(null)} onSendResponse={(response) => { setCurrentDialogue(null); handleSendMessage(response); }} />
            )}

            <ReferencesSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} sources={sidebarSources} />
            <BlueprintFloatingPanel isOpen={blueprintPanelOpen} onClose={() => setBlueprintPanelOpen(false)} sources={blueprintPanelSources} />

            {isDraggingAudio && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease', pointerEvents: 'none' }}>
                    <div style={{ background: 'rgba(10, 10, 31, 0.75)', backdropFilter: 'blur(40px)', border: '2px dashed rgba(0, 217, 255, 0.6)', borderRadius: '0', padding: '4rem 6rem', boxShadow: '0 0 0 1px rgba(0, 217, 255, 0.15) inset, 0 24px 60px 0 rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 217, 255, 0.5), 0 0 120px rgba(0, 217, 255, 0.3)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", fontSize: '1.75rem', fontWeight: '300', color: 'rgba(255, 255, 255, 0.95)', textAlign: 'center', letterSpacing: '-0.01em', marginBottom: '1rem' }}>Drop your audio file</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", fontSize: '0.9375rem', fontWeight: '400', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>WAV, MP3, FLAC, M4A, AIFF, OGG • Max 50MB</div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-16 px-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00A8FF #1a1a1a' }} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg, idx) => (
                        <DialogueMessage key={idx} message={msg} onOpenDialogue={(dialogue) => setCurrentDialogue(dialogue)} onOpenReferences={(sources) => { setSidebarSources(sources); setSidebarOpen(true); }} onOpenBlueprintPanel={(sources) => { setBlueprintPanelSources(sources); setBlueprintPanelOpen(true); }} onCloseBlueprintPanel={() => setBlueprintPanelOpen(false)} sendMessage={handleSendMessage} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="py-8 px-8 border-t border-white/5">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Share what's on your mind..." className="flex-1 px-5 py-4 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={handleAudioUpload} disabled={uploadingAudio} className="px-5 py-4 font-medium text-white transition-all flex items-center gap-3" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", fontSize: '0.9375rem', fontWeight: '500', letterSpacing: '-0.01em', background: uploadingAudio ? 'rgba(10, 10, 31, 0.5)' : 'rgba(10, 10, 31, 0.65)', backdropFilter: 'blur(20px)', border: uploadingAudio ? '1px solid rgba(0, 217, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '0', boxShadow: uploadingAudio ? '0 0 30px rgba(0, 217, 255, 0.3)' : '0 0 0 1px rgba(255, 255, 255, 0.05) inset', cursor: uploadingAudio ? 'not-allowed' : 'pointer', color: uploadingAudio ? 'rgba(0, 217, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)' }} onMouseEnter={(e) => { if (!uploadingAudio) { e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.5)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.2)'; e.currentTarget.style.color = 'rgba(0, 217, 255, 0.95)'; } }} onMouseLeave={(e) => { if (!uploadingAudio) { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255, 255, 255, 0.05) inset'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; } }}>
                        {uploadingAudio ? (<><svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="8" cy="8" r="6" stroke="rgba(0, 217, 255, 0.3)" strokeWidth="2" fill="none" /><circle cx="8" cy="8" r="6" stroke="rgba(0, 217, 255, 0.9)" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset={28 - (28 * uploadProgress / 100)} strokeLinecap="round" /></svg><span>Analyzing {Math.round(uploadProgress)}%</span></>) : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg><span>Upload Audio</span></>)}
                    </button>
                    <button onClick={handleSend} disabled={loading || !input.trim()} className="px-8 py-4 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ background: loading ? '#666' : 'linear-gradient(135deg, #000DFF 0%, #001AFF 100%)' }}>Send</button>
                </div>
            </div>
        </div>
    );
}
