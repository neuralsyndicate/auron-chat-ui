// ============================================================
// MEMORY VIEW - Neural Memory Visualization
// ============================================================
// Displays the user's persistent Letta memory:
// - Conscious (fact_block) - What you know (explicit facts)
// - Subconscious (creative_intuition) - What shapes you (inferred patterns)
// ============================================================

function MemoryView({ user }) {
    const [memoryBlocks, setMemoryBlocks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedBlock, setExpandedBlock] = useState(null);

    useEffect(() => {
        if (user) {
            fetchMemoryBlocks();
        }
    }, [user]);

    const fetchMemoryBlocks = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${BFF_API_BASE}/memory/blocks/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // No memory agent yet - show empty state
                    setMemoryBlocks({
                        fact_block: '',
                        creative_intuition: ''
                    });
                } else {
                    throw new Error(`Failed to fetch memory: ${response.status}`);
                }
            } else {
                const data = await response.json();
                // Extract blocks from response - BFF returns {status, user_id, blocks: {...}}
                setMemoryBlocks(data.blocks || {});
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
        return <MemoryError message={error} onRetry={fetchMemoryBlocks} />;
    }

    return (
        <div className="neural-memory-container">
            <MemoryHeader onRefresh={fetchMemoryBlocks} />

            {/* Memory Blocks Grid */}
            <div className="memory-grid">
                <ConsciousMemory
                    content={memoryBlocks?.fact_block}
                    expanded={expandedBlock === 'conscious'}
                    onToggle={() => toggleBlock('conscious')}
                />

                <SubconsciousMemory
                    content={memoryBlocks?.creative_intuition}
                    expanded={expandedBlock === 'subconscious'}
                    onToggle={() => toggleBlock('subconscious')}
                />
            </div>
        </div>
    );
}

// ============================================================
// SUB-COMPONENTS
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

function ConsciousMemory({ content, expanded, onToggle }) {
    const hasContent = content && content.trim().length > 0;

    return (
        <div className={`memory-block conscious glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper conscious-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="4"/>
                        <line x1="12" y1="2" x2="12" y2="4"/>
                        <line x1="12" y1="20" x2="12" y2="22"/>
                        <line x1="2" y1="12" x2="4" y2="12"/>
                        <line x1="20" y1="12" x2="22" y2="12"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Conscious</h3>
                    <span className="memory-block-subtitle">What you know</span>
                </div>
                <div className="memory-meta">
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
                        {hasContent ? (
                            <pre className="memory-text">{content}</pre>
                        ) : (
                            <div className="memory-empty-state">
                                <p>No explicit facts stored yet.</p>
                                <span className="empty-hint">Your preferences, tools, and profile will appear here as you chat.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function SubconsciousMemory({ content, expanded, onToggle }) {
    const hasContent = content && content.trim().length > 0;

    return (
        <div className={`memory-block subconscious glass ${expanded ? 'expanded' : ''}`}>
            <div className="memory-block-header" onClick={onToggle}>
                <div className="memory-icon-wrapper subconscious-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12c2-2.67 5.33-4 10-4s8 1.33 10 4c-2 2.67-5.33 4-10 4s-8-1.33-10-4z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </div>
                <div className="memory-titles">
                    <h3 className="memory-block-title">Subconscious</h3>
                    <span className="memory-block-subtitle">What shapes you</span>
                </div>
                <div className="memory-meta">
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
                        {hasContent ? (
                            <pre className="memory-text">{content}</pre>
                        ) : (
                            <div className="memory-empty-state">
                                <p>No learned patterns yet.</p>
                                <span className="empty-hint">Your creative intuitions and associations will emerge here over time.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MemoryLoadingSkeleton() {
    return (
        <div className="neural-memory-container">
            <div className="neural-memory-header">
                <div className="memory-title-group">
                    <h2 className="memory-main-title">Neural Memory</h2>
                    <p className="memory-subtitle-text">Loading your memories...</p>
                </div>
            </div>

            <div className="memory-grid">
                <div className="memory-block conscious glass skeleton">
                    <div className="skeleton-header">
                        <div className="skeleton-icon"></div>
                        <div className="skeleton-text">
                            <div className="skeleton-line wide"></div>
                            <div className="skeleton-line narrow"></div>
                        </div>
                    </div>
                </div>
                <div className="memory-block subconscious glass skeleton">
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
