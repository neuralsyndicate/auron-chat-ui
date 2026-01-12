// ============================================================
// CHAT COMPONENTS - Sources, Citations, Messages
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

// Thinking Collapsible Component - View past reasoning with toggle
function ThinkingCollapsible({ content }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content) return null;

    return (
        <div className="stream-thinking-collapsible">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="stream-thinking-toggle"
            >
                <span className="stream-thinking-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                <span>View Reasoning</span>
            </button>
            {isExpanded && (
                <div className="stream-thinking-content stream-thinking-content--completed">
                    <div className="stream-thinking-text">{content}</div>
                </div>
            )}
        </div>
    );
}

// Blueprint Source Component - Simplified (no longer used inline, kept for compatibility)
function BlueprintSourceCard({ source, index }) {
    const similarityPercent = Math.round((source.similarity || 0) * 100);

    return (
        <div style={{
            background: 'rgba(59, 130, 246, 0.03)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.75rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>📘</span>
                <h5 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'rgba(96, 165, 250, 0.9)',
                    margin: 0
                }}>
                    {source.page_title}
                </h5>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: similarityPercent >= 90 ? 'rgba(96, 165, 250, 0.9)'
                        : similarityPercent >= 80 ? 'rgba(59, 130, 246, 0.8)'
                        : 'rgba(255, 255, 255, 0.6)',
                    padding: '0.25rem 0.5rem',
                    background: similarityPercent >= 90 ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '6px',
                    marginLeft: 'auto'
                }}>
                    {similarityPercent}%
                </div>
            </div>
            {source.heading_path && (
                <p style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: '0.25rem 0 0 1.25rem'
                }}>
                    {source.heading_path}
                </p>
            )}
        </div>
    );
}

// Source Card Component - Display individual research source
function SourceCard({ source, index }) {
    // Tier colors (matches evidence hierarchy)
    const tierColors = {
        1: '#9333EA',  // Purple - Meta-Analysis/Systematic Review
        2: '#3B82F6',  // Blue - RCT
        3: '#10B981',  // Green - Observational
        4: '#F59E0B',  // Yellow - Case Study
        5: '#6B7280'   // Gray - Opinion/Limited Evidence
    };

    const tierColor = tierColors[source.credibility?.tier_number] || '#6B7280';
    const isScientific = source.source_type === 'scientific';

    return (
        <div className="source-card mb-4 p-5 rounded-xl glass-card border border-primary/20" style={{
            background: 'rgba(10, 10, 20, 0.6)',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}` }}>
                    {index}
                </span>
                <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm leading-tight mb-2">{source.title}</h4>
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold"
                        style={{ background: `${tierColor}20`, color: tierColor }}>
                        {source.credibility?.tier || 'Unknown Tier'}
                    </span>
                </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-400 mb-3 flex flex-wrap gap-2">
                {isScientific ? (
                    <>
                        {source.authors && <span>{source.authors}</span>}
                        {source.journal && source.year && (
                            <span>• {source.journal}, {source.year}</span>
                        )}
                        {source.cited_by_count && (
                            <span>• {source.cited_by_count} citations</span>
                        )}
                        {source.is_open_access && (
                            <span className="text-green-400">• Open Access</span>
                        )}
                    </>
                ) : (
                    <>
                        {source.source && <span>{source.source}</span>}
                        {source.published_date && <span>• {source.published_date}</span>}
                    </>
                )}
            </div>

            {/* Key Finding */}
            {source.key_finding && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic border-l-2 border-primary/30 pl-3">
                    {source.key_finding}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                {/* Credibility Score */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Credibility:</span>
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${source.credibility?.score || 0}%`,
                                background: `linear-gradient(90deg, ${tierColor}, ${tierColor}cc)`
                            }}
                        />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: tierColor }}>
                        {source.credibility?.score || 0}/100
                    </span>
                </div>

                {/* Read Link */}
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:text-primary-light transition-colors flex items-center gap-1">
                    {isScientific ? (source.is_open_access ? 'Read (Open Access)' : 'Read Paper') : 'Read Article'}
                    <span>→</span>
                </a>
            </div>
        </div>
    );
}

// Research Quality Badge - Shows Pro tier research depth
function ResearchQualityBadge({ research_quality }) {
    if (!research_quality || !research_quality.data_points) return null;

    const { data_points, results_sections, total_papers, research_depth } = research_quality;

    // Depth indicator
    const depthLabels = {
        'results': 'Results Sections',
        'full_text': 'Full-Text Analysis',
        'abstract': 'Abstract Analysis'
    };

    return (
        <div className="research-quality-badge mb-4 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
                <p className="text-green-300 text-sm font-semibold mb-1">
                    Deep Research Analysis
                </p>
                <p className="text-green-200/80 text-xs leading-relaxed">
                    Found <span className="font-bold text-green-300">{data_points}</span> quantitative findings from{' '}
                    <span className="font-bold text-green-300">{results_sections || total_papers}</span> peer-reviewed papers
                    {research_depth === 'results' && ' (Results sections analyzed)'}
                </p>
            </div>
            <span className="px-2 py-1 rounded-md bg-green-600/30 text-green-300 text-xs font-bold uppercase tracking-wide">
                Pro
            </span>
        </div>
    );
}

// Citation Marker Component - Inline [N] with hover tooltip
function CitationMarker({ number, reference }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const markerRef = useRef(null);

    if (!reference) return <span>[{number}]</span>;

    return (
        <span className="citation-wrapper" style={{ position: 'relative', display: 'inline' }}>
            <a
                ref={markerRef}
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-marker"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{
                    color: '#3B82F6',
                    textDecoration: 'none',
                    fontSize: '0.85em',
                    verticalAlign: 'super',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#2563EB'}
                onMouseOut={(e) => e.currentTarget.style.color = '#3B82F6'}
            >
                [{number}]
            </a>

            {/* Tooltip */}
            {showTooltip && (
                <div className="citation-tooltip" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-8px)',
                    width: '320px',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease',
                    pointerEvents: 'none'
                }}>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '12px',
                        height: '12px',
                        background: 'rgba(15, 23, 42, 0.98)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderTop: 'none',
                        borderLeft: 'none',
                        transform: 'translateX(-50%) rotate(45deg)'
                    }} />

                    <h4 className="text-white font-semibold text-sm mb-2 leading-tight">
                        {reference.title}
                    </h4>

                    <p className="text-gray-300 text-xs mb-2">
                        {reference.authors} ({reference.year})
                    </p>

                    {reference.credibility_score && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-400">Credibility:</span>
                            <span className="text-xs font-bold" style={{
                                color: reference.credibility_score >= 80 ? '#10B981' :
                                       reference.credibility_score >= 60 ? '#3B82F6' : '#F59E0B'
                            }}>
                                {reference.credibility_score}/100
                            </span>
                            {reference.credibility_grade && (
                                <span className="text-xs text-gray-400">
                                    (Grade {reference.credibility_grade})
                                </span>
                            )}
                        </div>
                    )}

                    <p className="text-gray-400 text-xs mb-2">
                        {reference.study_type && <span>{reference.study_type}</span>}
                        {reference.journal && <span> · {reference.journal}</span>}
                    </p>

                    <div className="text-xs text-primary font-semibold flex items-center gap-1">
                        Click to read paper <span>→</span>
                    </div>
                </div>
            )}
        </span>
    );
}

// Parse text and render inline citations
function TextWithCitations({ text, cited_references }) {
    if (!text || !cited_references || Object.keys(cited_references).length === 0) {
        return <>{text}</>;
    }

    // Split text by [N] pattern while keeping the markers
    const parts = text.split(/(\[\d+\])/g);

    return (
        <>
            {parts.map((part, index) => {
                const match = part.match(/\[(\d+)\]/);
                if (match) {
                    const num = parseInt(match[1]);
                    // cited_references is now an object keyed by number: {"1": {...}, "2": {...}}
                    const ref = cited_references[String(num)] || cited_references[num];
                    return <CitationMarker key={index} number={num} reference={ref} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
}

// Evidence in the Pattern - Professional liquid glass research section
function EvidenceInThePattern({ research_synthesis, cited_references }) {
    if (!research_synthesis) return null;

    return (
        <div className="evidence-section mt-6" style={{
            background: 'rgba(15, 20, 30, 0.4)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 0 60px rgba(59, 130, 246, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            position: 'relative'
        }}>
            {/* Heading */}
            <div className="flex items-center gap-3 mb-4" style={{
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(59, 130, 246, 0.06)'
            }}>
                <span style={{
                    fontSize: '1.25rem',
                    filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))'
                }}>🔬</span>
                <h3 className="text-white font-semibold" style={{
                    fontSize: '1rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    color: 'rgba(96, 165, 250, 0.9)',
                    fontWeight: '600'
                }}>
                    Evidence in the Pattern
                </h3>
            </div>

            {/* Research Content with Citations */}
            <div className="text-white leading-relaxed" style={{
                fontSize: '0.95rem',
                lineHeight: '1.8',
                color: 'rgba(255, 255, 255, 0.9)'
            }}>
                <TextWithCitations
                    text={research_synthesis}
                    cited_references={cited_references}
                />
            </div>
        </div>
    );
}

// Highlighted Question Component - Beautiful prominent question display
function HighlightedQuestion({ question }) {
    if (!question) return null;

    return (
        <div className="highlighted-question mt-6" style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 0 60px rgba(59, 130, 246, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            animation: 'subtle-pulse 6s ease-in-out infinite',
            position: 'relative'
        }}>
            {/* Icon */}
            <div style={{
                textAlign: 'center',
                marginBottom: '1.25rem'
            }}>
                <span style={{
                    fontSize: '2rem',
                    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.25))'
                }}>💭</span>
            </div>

            {/* Question Text */}
            <p className="text-white text-center" style={{
                fontSize: '1.15rem',
                lineHeight: '1.8',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.95)',
                letterSpacing: '0.01em'
            }}>
                {question}
            </p>
        </div>
    );
}

// User Response Area - Inline textarea and submit
function UserResponseArea({ onSubmit, messageId }) {
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!response.trim()) return;
        setSubmitting(true);
        await onSubmit(response);
        setResponse('');
        setSubmitting(false);
    };

    return (
        <div className="user-response-area mt-6">
            {/* Textarea */}
            <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Share your reflection..."
                className="w-full px-4 py-3 rounded-xl resize-none"
                rows={4}
                style={{
                    background: 'rgba(15, 20, 30, 0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    color: 'white',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(59, 130, 246, 0.2)';
                    e.target.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.08)';
                }}
                onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(59, 130, 246, 0.1)';
                    e.target.style.boxShadow = 'none';
                }}
            />

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!response.trim() || submitting}
                className="btn-sci-fi mt-4 px-8 py-3 rounded-xl font-semibold"
                style={{
                    opacity: !response.trim() || submitting ? 0.5 : 1,
                    cursor: !response.trim() || submitting ? 'not-allowed' : 'pointer'
                }}
            >
                {submitting ? 'Sending...' : 'Continue Journey →'}
            </button>
        </div>
    );
}

// Sources Section Component - Collapsible list of sources
function SourcesSection({ sources }) {
    const [showSources, setShowSources] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div className="sources-section mt-6">
            {/* Toggle Button */}
            <button
                onClick={() => setShowSources(!showSources)}
                className="w-full py-3 px-5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all duration-300 flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span className="text-white font-semibold">
                        {showSources ? 'Hide' : 'View'} Full References
                    </span>
                    <span className="px-2 py-1 rounded-full bg-primary/30 text-primary text-xs font-bold">
                        {sources.length}
                    </span>
                </div>
                <span className="text-primary transform transition-transform duration-300"
                    style={{ transform: showSources ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </span>
            </button>

            {/* Sources List */}
            {showSources && (
                <div className="mt-4 space-y-3" style={{
                    animation: 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    {sources.map((source, i) => (
                        <SourceCard key={source.id || i} source={source} index={i + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// References Sidebar - Right sliding panel (OpenAI thinking mode style)
function ReferencesSidebar({ isOpen, onClose, sources }) {
    if (!sources || sources.length === 0) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 999,
                        opacity: isOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            {/* Sidebar Panel */}
            <div style={{
                position: 'fixed',
                right: isOpen ? 0 : '-420px',
                top: 0,
                width: '420px',
                height: '100vh',
                background: 'rgba(15, 20, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(59, 130, 246, 0.1)',
                boxShadow: '-10px 0 60px rgba(0, 0, 0, 0.5)',
                transition: 'right 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(59, 130, 246, 0.02)'
                }}>
                    <div className="flex items-center gap-3">
                        <span style={{
                            fontSize: '1.5rem',
                            filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))'
                        }}>📚</span>
                        <h3 className="text-white font-semibold" style={{
                            fontSize: '1.1rem',
                            letterSpacing: '0.02em'
                        }}>
                            Full References
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'rgba(96, 165, 250, 0.9)'
                        }}>
                            {sources.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-primary transition-colors"
                        style={{
                            fontSize: '1.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(59, 130, 246, 0.3) #1a1a1a'
                }}>
                    <div className="space-y-4">
                        {sources.map((source, i) => (
                            <SourceCard key={source.id || i} source={source} index={i + 1} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

// DialogueModal removed - guidance now shown inline in conversation stream

// Dialogue Message Component (for chat history display) - Conversation Stream Style
function DialogueMessage({ message, onOpenReferences, onOpenBlueprintPanel, onCloseBlueprintPanel, sendMessage, sessionTeeStatus, onOpenTeeModal }) {
    if (message.role === 'user') {
        // User message - Stream style (no label, left border accent)
        return (
            <div className="stream-message stream-message--user">
                <div className="stream-message__content">
                    <p style={{ margin: 0 }}>{message.content}</p>
                </div>
            </div>
        );
    }

    // Auron message (streaming) - Stream style with cursor and thinking display
    if (message.isStreaming) {
        return (
            <div className="stream-message stream-message--auron stream-message--streaming">
                <div className="stream-message__indicator">
                    <span className="stream-message__indicator-icon">●</span>
                    <span>Auron</span>
                </div>

                {/* Thinking Content - Shows BEFORE answer (GLM-4.6 reasoning) */}
                {message.thinkingContent && (
                    <div className={`stream-thinking-content ${!message.isThinking ? 'transitioning' : ''}`}>
                        <div className="stream-thinking-label">Reasoning</div>
                        <div className="stream-thinking-text">{message.thinkingContent}</div>
                    </div>
                )}

                {/* Answer Content */}
                <div className="stream-message__content">
                    {message.guidance}
                </div>
            </div>
        );
    }

    // Auron message (dialogue with inline research) - Conversation Stream Style
    if (message.isDialogue) {
        // Parse guidance to extract reflection question if embedded
        let guidance = message.dialogue.guidance || '';
        let reflectiveQuestion = message.dialogue.reflective_question;

        const reflectionMatch = guidance.match(/REFLECTION QUESTION:\s*(.+?)$/s);
        if (reflectionMatch) {
            reflectiveQuestion = reflectionMatch[1].trim();
            guidance = guidance.replace(/REFLECTION QUESTION:\s*.+$/s, '').trim();
        }

        return (
            <div className="stream-message stream-message--auron" style={{ position: 'relative' }}>
                {/* Blueprint Corner Ribbon */}
                <BlueprintCornerRibbon
                    sources={message.dialogue.blueprint_sources}
                    onOpenPanel={() => onOpenBlueprintPanel(message.dialogue.blueprint_sources || [])}
                />

                {/* Auron Indicator */}
                <div className="stream-message__indicator">
                    <span className="stream-message__indicator-icon">●</span>
                    <span>Auron</span>
                </div>

                {/* Thinking Content - Collapsible for completed messages */}
                {(message.thinkingContent || message.dialogue?.thinking) && (
                    <ThinkingCollapsible
                        content={message.thinkingContent || message.dialogue?.thinking}
                    />
                )}

                {/* Guidance Text - Full content inline */}
                <div className="stream-message__content">
                    <TextWithCitations
                        text={guidance}
                        cited_references={message.dialogue.cited_references}
                    />
                </div>

                {/* Evidence in the Pattern */}
                {message.dialogue.research_synthesis && (
                    <div className="stream-evidence">
                        <div className="stream-evidence__label">Evidence in the Pattern</div>
                        <div className="stream-evidence__content">
                            <TextWithCitations
                                text={message.dialogue.research_synthesis}
                                cited_references={message.dialogue.cited_references}
                            />
                        </div>
                    </div>
                )}

                {/* Reflective Question - Inline with response area */}
                {reflectiveQuestion && (
                    <div className="stream-reflective-question">
                        <div className="stream-reflective-question__label">A Question For You</div>
                        <p className="stream-reflective-question__text">{reflectiveQuestion}</p>
                        <UserResponseArea
                            onSubmit={async (response) => {
                                await sendMessage(response);
                            }}
                            messageId={message.dialogue.session_id}
                        />
                    </div>
                )}

                {/* View Full References */}
                {message.dialogue.sources && message.dialogue.sources.length > 0 && (
                    <button
                        onClick={() => onOpenReferences(message.dialogue.sources)}
                        className="stream-sources-link"
                    >
                        <span>📚</span>
                        View References ({message.dialogue.sources.length})
                    </button>
                )}
            </div>
        );
    }

    // Regular Auron message (fallback) - Stream style
    return (
        <div className="stream-message stream-message--auron">
            <div className="stream-message__indicator">
                <span className="stream-message__indicator-icon">●</span>
                <span>Auron</span>
            </div>
            <div className="stream-message__content">
                <p style={{ margin: 0 }}>{message.content}</p>
            </div>
        </div>
    );
}
