// ============================================================
// MEMORY VIEW - Neural Memory Visualization (Neuroscience Model)
// ============================================================
// Displays the user's persistent Letta memory blocks with
// LLM-transformed human-readable display and confidence indicators.
//
// EXPLICIT MEMORY (Conscious - User-stated):
// - Semantic (semantic_memory) - Facts & knowledge
// - Episodic (episodic_memory) - Events & experiences
//
// IMPLICIT MEMORY (Unconscious - AI-inferred):
// - Procedural (procedural_memory) - Behavioral patterns
// - Emotional (emotional_memory) - Feeling associations
// - Priming (priming_memory) - Override rules & associations
// ============================================================

function MemoryView({ user }) {
    const [memoryDisplay, setMemoryDisplay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState(null);

    useEffect(() => {
        if (user) {
            fetchMemoryDisplay();
        }
    }, [user]);

    const fetchMemoryDisplay = async () => {
        try {
            setLoading(true);
            setError(null);
            setPending(false);

            const token = await getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            // Use the /memory/display endpoint for pre-computed human-readable format
            const response = await fetch(`${BFF_API_BASE}/memory/display/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // No memory agent yet - show empty state
                    setMemoryDisplay({
                        semantic_memory: { label: 'Facts & Knowledge', type: 'explicit', items: [] },
                        episodic_memory: { label: 'Events & Experiences', type: 'explicit', items: [] },
                        procedural_memory: { label: 'Behavioral Patterns', type: 'implicit', items: [] },
                        emotional_memory: { label: 'Emotional Associations', type: 'implicit', items: [] },
                        priming_memory: { label: 'Override Rules', type: 'implicit', items: [] }
                    });
                } else {
                    throw new Error(`Failed to fetch memory: ${response.status}`);
                }
            } else {
                const data = await response.json();

                // Handle "pending" status - sleep-time agent hasn't generated display yet
                if (data.status === 'pending') {
                    setPending(true);
                }

                // Response contains {status, user_id, cached, semantic_memory: {...}, ...}
                setMemoryDisplay({
                    semantic_memory: data.semantic_memory || { label: 'Facts & Knowledge', type: 'explicit', items: [] },
                    episodic_memory: data.episodic_memory || { label: 'Events & Experiences', type: 'explicit', items: [] },
                    procedural_memory: data.procedural_memory || { label: 'Behavioral Patterns', type: 'implicit', items: [] },
                    emotional_memory: data.emotional_memory || { label: 'Emotional Associations', type: 'implicit', items: [] },
                    priming_memory: data.priming_memory || { label: 'Override Rules', type: 'implicit', items: [] }
                });
            }
        } catch (err) {
            console.error('Memory fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = (blockName) => {
        setExpandedBlock(expandedBlock === blockName ? null : blockName);
    };

    if (loading) {
        return <MemoryLoadingSkeleton />;
    }

    if (error) {
        return <MemoryError message={error} onRetry={fetchMemoryDisplay} />;
    }

    return (
        <div className="neural-memory-container">
            <MemoryHeader onRefresh={fetchMemoryDisplay} />

            {/* Pending Banner - Sleep-time agent hasn't processed yet */}
            {pending && (
                <div className="memory-pending-banner glass">
                    <div className="pending-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <span>Memories are being processed in the background. Refresh in a moment.</span>
                </div>
            )}

            {/* EXPLICIT MEMORY - Conscious, User-stated */}
            <MemorySection
                title="Explicit Memory"
                subtitle="Conscious - What You Know"
                type="explicit"
            >
                <div className="memory-grid explicit-grid">
                    <SemanticMemory
                        data={memoryDisplay?.semantic_memory}
                        expanded={expandedBlock === 'semantic'}
                        onToggle={() => toggleBlock('semantic')}
                    />
                    <EpisodicMemory
                        data={memoryDisplay?.episodic_memory}
                        expanded={expandedBlock === 'episodic'}
                        onToggle={() => toggleBlock('episodic')}
                    />
                </div>
            </MemorySection>

            {/* IMPLICIT MEMORY - Unconscious, AI-inferred */}
            <MemorySection
                title="Implicit Memory"
                subtitle="Unconscious - What Shapes You"
                type="implicit"
            >
                <div className="memory-grid implicit-grid">
                    <ProceduralMemory
                        data={memoryDisplay?.procedural_memory}
                        expanded={expandedBlock === 'procedural'}
                        onToggle={() => toggleBlock('procedural')}
                    />
                    <EmotionalMemory
                        data={memoryDisplay?.emotional_memory}
                        expanded={expandedBlock === 'emotional'}
                        onToggle={() => toggleBlock('emotional')}
                    />
                    <PrimingMemory
                        data={memoryDisplay?.priming_memory}
                        expanded={expandedBlock === 'priming'}
                        onToggle={() => toggleBlock('priming')}
                    />
                </div>
            </MemorySection>
        </div>
    );
}

// ============================================================
// SECTION COMPONENT
// ============================================================

function MemorySection({ title, subtitle, type, children }) {
    return (
        <div className={`memory-section ${type}`}>
            <div className="memory-section-header">
                <h3 className="memory-section-title">{title}</h3>
                <span className="memory-section-subtitle">{subtitle}</span>
            </div>
            {children}
        </div>
    );
}

// ============================================================
// HEADER COMPONENT
// ============================================================

function MemoryHeader({ onRefresh }) {
    return (
        <div className="neural-memory-header">
            <div className="memory-title-group">
                <h2 className="memory-main-title">Neural Memory</h2>
                <p className="memory-subtitle-text">
                    Your creative identity, remembered and evolving
                </p>
            </div>
            <button
                className="memory-refresh-btn"
                onClick={onRefresh}
                title="Refresh memory"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
            </button>
        </div>
    );
}

// ============================================================
// MEMORY ITEM WITH CONFIDENCE DOT
// ============================================================

function MemoryItem({ item }) {
    const [showTooltip, setShowTooltip] = useState(false);

    const confidenceDots = {
        'HIGH': '\u25CF',   // ●
        'MEDIUM': '\u25D0', // ◐
        'LOW': '\u25CB'     // ○
    };

    const confidence = item.confidence || 'HIGH';
    const dot = confidenceDots[confidence] || confidenceDots['HIGH'];

    return (
        <div className="memory-item">
            <span className="memory-item-text">{item.display}</span>
            <span
                className={`confidence-dot ${confidence.toLowerCase()}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {dot}
                {showTooltip && <ConfidenceTooltip item={item} />}
            </span>
        </div>
    );
}

// ============================================================
// CONFIDENCE TOOLTIP
// ============================================================

function ConfidenceTooltip({ item }) {
    const confidence = item.confidence || 'HIGH';

    const explanations = {
        'HIGH': "You explicitly told AURON this.",
        'MEDIUM': `Pattern observed ${item.observations || '3+'}x in conversations.`,
        'LOW': "Early inference - AURON is still learning this about you."
    };

    const sourceLabels = {
        'user-stated': 'You stated this directly',
        'user-recalled': 'You recalled this experience',
        'observed': 'Observed from your behavior',
        'raw': 'Raw memory data'
    };

    return (
        <div className="confidence-tooltip">
            <div className="tooltip-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>Confidence: {confidence}</span>
            </div>
            <div className="tooltip-body">
                <p className="tooltip-explanation">{explanations[confidence]}</p>

                <div className="tooltip-legend">
                    <span className="legend-title">What confidence means:</span>
                    <div className="legend-item"><span className="dot high">{'\u25CF'}</span> HIGH = You stated this directly</div>
                    <div className="legend-item"><span className="dot medium">{'\u25D0'}</span> MEDIUM = Pattern observed 3+ times</div>
                    <div className="legend-item"><span className="dot low">{'\u25CB'}</span> LOW = Early inference, needs confirmation</div>
                </div>

                <div className="tooltip-meta">
                    <span>Source: {sourceLabels[item.source] || item.source}</span>
                    {item.raw && <code>{item.raw}</code>}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MEMORY ITEMS LIST
// ============================================================

function MemoryItemsList({ items, emptyMessage, emptyHint }) {
    if (!items || items.length === 0) {
        return (
            <div className="memory-empty-state">
                <p>{emptyMessage}</p>
                <span className="empty-hint">{emptyHint}</span>
            </div>
        );
    }

    return (
        <div className="memory-items-list">
            {items.map((item, index) => (
                <MemoryItem key={index} item={item} />
            ))}
        </div>
    );
}

// ============================================================
// EXPLICIT MEMORY COMPONENTS (User-stated, HIGH confidence)
// ============================================================

function SemanticMemory({ data, expanded, onToggle }) {
    const items = data?.items || [];
    const hasContent = items.length > 0;

    return (
        <div className={`memory-block semantic glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper semantic-icon">
                    {/* Brain icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69a.5.5 0 0 0 .31-.95A8 8 0 0 1 4 11a8 8 0 0 1 16 0 8 8 0 0 1-6 7.74.5.5 0 0 0 .31.95A9 9 0 0 0 21 11a9 9 0 0 0-9-9z"/>
                        <path d="M12 6a5 5 0 0 0-5 5c0 2.05 1.23 3.81 3 4.58V22h4v-6.42c1.77-.77 3-2.53 3-4.58a5 5 0 0 0-5-5z"/>
                        <circle cx="10" cy="10" r="1"/>
                        <circle cx="14" cy="10" r="1"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Semantic</h3>
                    <span className="memory-block-subtitle">{data?.label || 'Facts & Knowledge'}</span>
                </div>
                <div className="memory-meta">
                    {hasContent && <span className="memory-count">{items.length}</span>}
                    <span className={`memory-chevron ${expanded ? 'expanded' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="memory-content-wrapper">
                    <div className="memory-content">
                        <MemoryItemsList
                            items={items}
                            emptyMessage="No facts stored yet."
                            emptyHint="Your preferences, tools, and declarations will appear here as you chat."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function EpisodicMemory({ data, expanded, onToggle }) {
    const items = data?.items || [];
    const hasContent = items.length > 0;

    return (
        <div className={`memory-block episodic glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper episodic-icon">
                    {/* Calendar/Event icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Episodic</h3>
                    <span className="memory-block-subtitle">{data?.label || 'Events & Experiences'}</span>
                </div>
                <div className="memory-meta">
                    {hasContent && <span className="memory-count">{items.length}</span>}
                    <span className={`memory-chevron ${expanded ? 'expanded' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="memory-content-wrapper">
                    <div className="memory-content">
                        <MemoryItemsList
                            items={items}
                            emptyMessage="No events recorded yet."
                            emptyHint="Your sessions, projects, and experiences will appear here."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// IMPLICIT MEMORY COMPONENTS (AI-inferred, evolving confidence)
// ============================================================

function ProceduralMemory({ data, expanded, onToggle }) {
    const items = data?.items || [];
    const hasContent = items.length > 0;

    return (
        <div className={`memory-block procedural glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper procedural-icon">
                    {/* Cog/Workflow icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Procedural</h3>
                    <span className="memory-block-subtitle">{data?.label || 'Behavioral Patterns'}</span>
                </div>
                <div className="memory-meta">
                    <span className="memory-badge implicit">AI Inferred</span>
                    {hasContent && <span className="memory-count">{items.length}</span>}
                    <span className={`memory-chevron ${expanded ? 'expanded' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="memory-content-wrapper">
                    <div className="memory-content">
                        <MemoryItemsList
                            items={items}
                            emptyMessage="No patterns observed yet."
                            emptyHint="Your workflow habits and behaviors will be inferred over time."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function EmotionalMemory({ data, expanded, onToggle }) {
    const items = data?.items || [];
    const hasContent = items.length > 0;

    return (
        <div className={`memory-block emotional glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper emotional-icon">
                    {/* Heart icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Emotional</h3>
                    <span className="memory-block-subtitle">{data?.label || 'Feeling Associations'}</span>
                </div>
                <div className="memory-meta">
                    <span className="memory-badge implicit">AI Inferred</span>
                    {hasContent && <span className="memory-count">{items.length}</span>}
                    <span className={`memory-chevron ${expanded ? 'expanded' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="memory-content-wrapper">
                    <div className="memory-content">
                        <MemoryItemsList
                            items={items}
                            emptyMessage="No emotional patterns yet."
                            emptyHint="Your feeling-based responses will be learned over time."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function PrimingMemory({ data, expanded, onToggle }) {
    const items = data?.items || [];
    const hasContent = items.length > 0;

    return (
        <div className={`memory-block priming glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper priming-icon">
                    {/* Lightning/Zap icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Priming</h3>
                    <span className="memory-block-subtitle">{data?.label || 'Override Rules'}</span>
                </div>
                <div className="memory-meta">
                    <span className="memory-badge implicit">AI Inferred</span>
                    {hasContent && <span className="memory-count">{items.length}</span>}
                    <span className={`memory-chevron ${expanded ? 'expanded' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="memory-content-wrapper">
                    <div className="memory-content">
                        <MemoryItemsList
                            items={items}
                            emptyMessage="No associations learned yet."
                            emptyHint="Your personal definitions and override rules will emerge here."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// LOADING & ERROR STATES
// ============================================================

function MemoryLoadingSkeleton() {
    return (
        <div className="neural-memory-container">
            <div className="neural-memory-header">
                <div className="memory-title-group">
                    <h2 className="memory-main-title">Neural Memory</h2>
                    <p className="memory-subtitle-text">Loading your memories...</p>
                </div>
            </div>

            {/* Explicit Memory Section Skeleton */}
            <div className="memory-section explicit">
                <div className="memory-section-header">
                    <div className="skeleton-line" style={{width: '120px', height: '16px'}}></div>
                </div>
                <div className="memory-grid explicit-grid">
                    <div className="memory-block semantic glass skeleton">
                        <div className="skeleton-header">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text">
                                <div className="skeleton-line wide"></div>
                                <div className="skeleton-line narrow"></div>
                            </div>
                        </div>
                    </div>
                    <div className="memory-block episodic glass skeleton">
                        <div className="skeleton-header">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text">
                                <div className="skeleton-line wide"></div>
                                <div className="skeleton-line narrow"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Implicit Memory Section Skeleton */}
            <div className="memory-section implicit">
                <div className="memory-section-header">
                    <div className="skeleton-line" style={{width: '120px', height: '16px'}}></div>
                </div>
                <div className="memory-grid implicit-grid">
                    <div className="memory-block procedural glass skeleton">
                        <div className="skeleton-header">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text">
                                <div className="skeleton-line wide"></div>
                                <div className="skeleton-line narrow"></div>
                            </div>
                        </div>
                    </div>
                    <div className="memory-block emotional glass skeleton">
                        <div className="skeleton-header">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text">
                                <div className="skeleton-line wide"></div>
                                <div className="skeleton-line narrow"></div>
                            </div>
                        </div>
                    </div>
                    <div className="memory-block priming glass skeleton">
                        <div className="skeleton-header">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text">
                                <div className="skeleton-line wide"></div>
                                <div className="skeleton-line narrow"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MemoryError({ message, onRetry }) {
    return (
        <div className="neural-memory-container">
            <div className="neural-memory-header">
                <div className="memory-title-group">
                    <h2 className="memory-main-title">Neural Memory</h2>
                </div>
            </div>

            <div className="memory-error-state glass">
                <div className="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                    </svg>
                </div>
                <h3 className="error-title">Memory Unavailable</h3>
                <p className="error-message">{message}</p>
                <button className="error-retry-btn" onClick={onRetry}>
                    Try Again
                </button>
            </div>
        </div>
    );
}
