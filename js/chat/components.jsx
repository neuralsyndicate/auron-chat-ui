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

// Dialogue Modal Component
function DialogueModal({ dialogue, onClose, onSendResponse }) {
    const [showQuestion, setShowQuestion] = useState(false);
    const [userResponse, setUserResponse] = useState('');
    const textareaRef = useRef(null);

    if (!dialogue) return null;

    const handleContinue = () => {
        setShowQuestion(true);
        // Auto-focus textarea after animation
        setTimeout(() => textareaRef.current?.focus(), 600);
    };

    const handleSubmit = () => {
        if (userResponse.trim()) {
            onSendResponse(userResponse.trim());
            onClose();
        }
    };

    return (
        <div className="dialogue-modal-overlay" onClick={onClose}>
            <div className="dialogue-modal" onClick={(e) => e.stopPropagation()} style={{
                transition: 'all 0.3s ease',
                maxWidth: showQuestion ? '800px' : '700px'
            }}>
                {/* Close Button */}
                <button className="dialogue-modal-close" onClick={onClose}>
                    ✕
                </button>

                {/* Guidance - Minimizes when question appears */}
                <div style={{
                    transition: 'all 0.5s ease',
                    marginBottom: showQuestion ? '1.5rem' : '2.5rem',
                    opacity: showQuestion ? 0.7 : 1,
                    transform: showQuestion ? 'scale(0.95)' : 'scale(1)'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: showQuestion ? '1rem' : '2.5rem', textAlign: 'center' }}>
                        <div style={{
                            fontSize: showQuestion ? '2rem' : '3rem',
                            marginBottom: '0.5rem',
                            filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))',
                            transition: 'all 0.5s ease'
                        }}>
                            🧠
                        </div>
                        <h2 className="text-white glow" style={{
                            fontSize: showQuestion ? '1.5rem' : '2rem',
                            fontWeight: 900,
                            marginBottom: '0.5rem',
                            letterSpacing: '0.02em',
                            transition: 'all 0.5s ease'
                        }}>
                            {!showQuestion ? 'Understanding Your Process' : 'Your Creative Reflection'}
                        </h2>
                        {!showQuestion && (
                            <p className="text-primary text-sm font-medium">
                                Knowledge Digestion
                            </p>
                        )}
                    </div>

                    {/* Guidance Text */}
                    <div
                        className="text-white leading-relaxed"
                        style={{
                            fontSize: showQuestion ? '0.95rem' : '1.15rem',
                            lineHeight: showQuestion ? '1.6' : '2',
                            padding: showQuestion ? '1rem' : '1.5rem',
                            background: 'rgba(59, 130, 246, 0.02)',
                            borderRadius: '16px',
                            border: '1px solid rgba(59, 130, 246, 0.06)',
                            transition: 'all 0.5s ease',
                            marginBottom: showQuestion ? '0' : '2rem'
                        }}>
                        <TextWithCitations
                            text={dialogue.guidance}
                            cited_references={dialogue.cited_references}
                        />
                    </div>
                </div>

                {/* Continue Button */}
                {dialogue.reflective_question && !showQuestion && (
                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={handleContinue}
                            className="btn-sci-fi px-10 py-5 rounded-2xl font-bold text-white"
                            style={{
                                fontSize: '1.1rem',
                                letterSpacing: '0.05em',
                                position: 'relative',
                                zIndex: 10
                            }}>
                            REFLECT DEEPER →
                        </button>
                        <p className="text-gray-400 text-xs mt-3">Click to explore your creative patterns</p>
                    </div>
                )}

                {/* Question + Input Section - Appears prominently */}
                {dialogue.reflective_question && showQuestion && (
                    <div style={{
                        animation: 'slideUp 0.6s ease',
                        marginTop: '2rem'
                    }}>
                        {/* Question Box - Center Stage */}
                        <div
                            className="p-8 rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                boxShadow: '0 0 60px rgba(59, 130, 246, 0.1)',
                                position: 'relative',
                                overflow: 'hidden',
                                marginBottom: '1.5rem'
                            }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '3px',
                                height: '100%',
                                background: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)',
                                boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
                            }}></div>

                            <div style={{ paddingLeft: '1rem' }}>
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-4 glow" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>💭</span> A Question For You
                                </p>
                                <p className="text-white leading-relaxed" style={{
                                    fontSize: '1.3rem',
                                    lineHeight: '2',
                                    fontWeight: '500'
                                }}>
                                    {dialogue.reflective_question}
                                </p>
                            </div>
                        </div>

                        {/* Input Area - For User Response */}
                        <div>
                            <label className="text-gray-300 text-sm mb-2 block">
                                Share your thoughts or continue the conversation:
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={userResponse}
                                onChange={(e) => setUserResponse(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Type your response or what's on your mind..."
                                className="w-full px-5 py-4 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                rows="4"
                                style={{
                                    fontSize: '1.05rem',
                                    lineHeight: '1.6'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white transition-all"
                                    style={{
                                        border: '1px solid rgba(156, 163, 175, 0.3)'
                                    }}>
                                    Close
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!userResponse.trim()}
                                    className="btn-sci-fi px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ position: 'relative', zIndex: 10 }}>
                                    Send Response
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Research Quality Badge - Shows Pro tier depth */}
                <ResearchQualityBadge research_quality={dialogue.research_quality} />

                {/* Research Sources Section */}
                <SourcesSection sources={dialogue.sources} />
            </div>
        </div>
    );
}

// Dialogue Message Component (for chat history display)
function DialogueMessage({ message, onOpenDialogue, onOpenReferences, onOpenBlueprintPanel, onCloseBlueprintPanel, sendMessage }) {
    if (message.role === 'user') {
        // User message (simple)
        return (
            <div className="message flex justify-end">
                <div className="max-w-[70%] rounded-2xl px-6 py-4 bg-gradient-to-r from-primary/30 to-primary-dark/30 border border-primary/50">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">You</p>
                    <p className="text-white leading-relaxed">{message.content}</p>
                </div>
            </div>
        );
    }

    // Auron message (streaming) - Simple text display while typing
    if (message.isStreaming) {
        return (
            <div className="message flex justify-start">
                <div style={{
                    maxWidth: '85%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    padding: '1.75rem 2rem',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        marginBottom: '1rem'
                    }}>
                        <span style={{
                            fontSize: '1.25rem'
                        }}>🧠</span>
                        <p style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#60A5FA',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            margin: 0
                        }}>AURON</p>
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: '1.75',
                        fontSize: '1.05rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                        {message.guidance}
                        <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '1.2em',
                            background: '#60A5FA',
                            marginLeft: '2px',
                            animation: 'blink 1s step-end infinite',
                            verticalAlign: 'text-bottom'
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    // Auron message (dialogue with inline research) - FLOWING NATURAL LAYOUT
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
            <div className="message flex justify-start">
                <div style={{
                    maxWidth: '85%',
                    width: '100%',
                    borderRadius: '20px',
                    padding: '2rem',
                    background: 'rgba(15, 20, 30, 0.3)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(59, 130, 246, 0.06)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                }}>
                    {/* Blueprint Corner Ribbon */}
                    <BlueprintCornerRibbon
                        sources={message.dialogue.blueprint_sources}
                        onOpenPanel={() => onOpenBlueprintPanel(message.dialogue.blueprint_sources || [])}
                    />

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{
                            fontSize: '1.75rem',
                            filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))'
                        }}>🧠</span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide glow" style={{
                                color: 'rgba(96, 165, 250, 0.9)',
                                letterSpacing: '0.1em'
                            }}>
                                Auron
                            </p>
                        </div>
                    </div>

                    {/* Guidance Text - Flowing naturally */}
                    <div className="text-white leading-relaxed" style={{
                        fontSize: '1.05rem',
                        lineHeight: '1.8',
                        color: 'rgba(255, 255, 255, 0.95)',
                        marginBottom: message.dialogue.research_synthesis ? '1.5rem' : '2rem'
                    }}>
                        <TextWithCitations
                            text={guidance}
                            cited_references={message.dialogue.cited_references}
                        />
                    </div>

                    {/* Blueprint Sources - Now shown via corner ribbon instead */}

                    {/* Evidence in the Pattern - Subtle, flowing integration */}
                    {message.dialogue.research_synthesis && (
                        <div style={{
                            marginBottom: '2rem',
                            paddingTop: '1.5rem',
                            borderTop: '1px solid rgba(0, 217, 255, 0.08)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                <span style={{ fontSize: '1rem', opacity: 0.7 }}>🔬</span>
                                <h4 className="text-white" style={{
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(0, 217, 255, 0.7)',
                                    fontWeight: '600'
                                }}>
                                    Evidence in the Pattern
                                </h4>
                            </div>
                            <div className="text-white leading-relaxed" style={{
                                fontSize: '0.95rem',
                                lineHeight: '1.8',
                                color: 'rgba(255, 255, 255, 0.85)',
                                paddingLeft: '1.5rem'
                            }}>
                                <TextWithCitations
                                    text={message.dialogue.research_synthesis}
                                    cited_references={message.dialogue.cited_references}
                                />
                            </div>
                        </div>
                    )}

                    {/* Reflective Question - Natural continuation */}
                    {reflectiveQuestion && (
                        <div style={{
                            marginTop: '2rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid rgba(0, 217, 255, 0.15)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <span style={{
                                    fontSize: '1.5rem',
                                    filter: 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.3))'
                                }}>💭</span>
                                <p className="text-white" style={{
                                    fontSize: '1.1rem',
                                    lineHeight: '1.6',
                                    fontWeight: '500',
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontStyle: 'italic'
                                }}>
                                    {reflectiveQuestion}
                                </p>
                            </div>

                            {/* User Response Area */}
                            <UserResponseArea
                                onSubmit={async (response) => {
                                    await sendMessage(response);
                                }}
                                messageId={message.dialogue.session_id}
                            />
                        </div>
                    )}

                    {/* View Full References - Subtle link */}
                    {message.dialogue.sources && message.dialogue.sources.length > 0 && (
                        <button
                            onClick={() => onOpenReferences(message.dialogue.sources)}
                            className="mt-6 text-sm flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors mx-auto"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textUnderlineOffset: '4px'
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>📚</span>
                            View Full References ({message.dialogue.sources.length})
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Regular Auron message (e.g., welcome message)
    return (
        <div className="message flex justify-start">
            <div className="max-w-[75%] rounded-2xl px-6 py-5 bg-gray-900 border border-gray-800">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 glow">
                    Auron
                </p>
                <p className="text-white leading-relaxed" style={{ lineHeight: '1.7' }}>
                    {message.content}
                </p>
            </div>
        </div>
    );
}
