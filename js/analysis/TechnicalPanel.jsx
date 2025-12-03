// ============================================================
// TECHNICAL ANALYSIS PANEL - Neural Music Profile
// ============================================================
function TechnicalAnalysisPanel({ components }) {
    const [expandedSections, setExpandedSections] = useState({
        sound_description: true,
        inspirational_triggers: false,
        genre_fusion: false,
        neural_spectrum: false,
        sound_palette: false,
        tonal_identity: false,
        rhythmic_dna: false,
        emotional_fingerprint: false,
        timbre_dna: false,
        mixing_signature: false,
        sonic_architecture: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Format field names: snake_case → Title Case
    const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Render confidence bar
    const renderConfidenceBar = (confidence) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                Confidence
            </span>
            <div style={{
                flex: 1,
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${confidence * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(0, 217, 255, 0.8) 0%, rgba(0, 13, 255, 0.8) 100%)'
                }} />
            </div>
            <span style={{
                fontSize: '0.8125rem',
                color: 'rgba(0, 217, 255, 0.9)',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '600'
            }}>
                {(confidence * 100).toFixed(0)}%
            </span>
        </div>
    );

    // Render reasoning text
    const renderReasoning = (reasoning) => (
        <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.6',
            fontStyle: 'italic',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            {reasoning}
        </div>
    );

    // Render array field
    const renderArrayField = (key, values) => (
        <div key={key} style={{ marginBottom: '1.25rem' }}>
            <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.75rem',
                fontWeight: '600'
            }}>
                {formatLabel(key)}
            </div>
            {values.map((item, idx) => (
                <div key={idx} style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0',
                    marginBottom: '0.375rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: '1.5'
                }}>
                    {typeof item === 'object' ? JSON.stringify(item) : item}
                </div>
            ))}
        </div>
    );

    // Render string field
    const renderStringField = (key, value) => (
        <div key={key} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '120px',
                paddingTop: '0.125rem'
            }}>
                {formatLabel(key)}
            </span>
            <span style={{
                fontSize: '0.9375rem',
                color: 'rgba(255, 255, 255, 0.9)',
                flex: 1,
                lineHeight: '1.5'
            }}>
                {value}
            </span>
        </div>
    );

    // Render number field
    const renderNumberField = (key, value) => (
        <div key={key} style={{
            display: 'inline-block',
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid rgba(0, 217, 255, 0.25)',
            borderRadius: '0',
            padding: '0.75rem 1rem',
            marginRight: '0.75rem',
            marginBottom: '0.75rem',
            textAlign: 'center'
        }}>
            <div style={{
                fontSize: '1.25rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(0, 217, 255, 0.95)',
                fontWeight: '600',
                marginBottom: '0.25rem'
            }}>
                {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
            <div style={{
                fontSize: '0.6875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {formatLabel(key)}
            </div>
        </div>
    );

    // Hero description for sound_description
    const renderHeroDescription = (data) => (
        <div>
            {data.title && (
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'rgba(0, 217, 255, 0.95)',
                    marginBottom: '1rem',
                    lineHeight: '1.3'
                }}>
                    {data.title}
                </div>
            )}
            {data.description && (
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: '1.7'
                }}>
                    {data.description}
                </div>
            )}
            {data.confidence && renderConfidenceBar(data.confidence)}
        </div>
    );

    // Enhanced generic component renderer
    const renderGenericComponent = (component) => {
        if (!component) return null;

        // Special handling for sound_description (hero display)
        if (component.title && component.description) {
            return renderHeroDescription(component);
        }

        // Categorize fields by type
        const fields = Object.entries(component).filter(([k]) =>
            !['confidence', 'reasoning', 'source'].includes(k)
        );

        const stringFields = fields.filter(([k, v]) => typeof v === 'string');
        const numberFields = fields.filter(([k, v]) => typeof v === 'number');
        const arrayFields = fields.filter(([k, v]) => Array.isArray(v) && v.length > 0);

        return (
            <div>
                {/* Number fields as metric cards */}
                {numberFields.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        {numberFields.map(([key, value]) => renderNumberField(key, value))}
                    </div>
                )}

                {/* String fields as key-value pairs */}
                {stringFields.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        {stringFields.map(([key, value]) => renderStringField(key, value))}
                    </div>
                )}

                {/* Array fields */}
                {arrayFields.map(([key, values]) => renderArrayField(key, values))}

                {/* Confidence bar */}
                {component.confidence && renderConfidenceBar(component.confidence)}

                {/* Reasoning */}
                {component.reasoning && renderReasoning(component.reasoning)}
            </div>
        );
    };

    // Section definitions (11 components)
    const sections = [
        { key: 'sound_description', label: 'Sound Description', icon: '✨' },
        { key: 'inspirational_triggers', label: 'Inspirational Triggers', icon: '💡' },
        { key: 'genre_fusion', label: 'Genre Fusion', icon: '🎵' },
        { key: 'neural_spectrum', label: 'Neural Spectrum™', icon: '🧠' },
        { key: 'sound_palette', label: 'Sound Palette', icon: '🎨' },
        { key: 'tonal_identity', label: 'Tonal Identity', icon: '🎹' },
        { key: 'rhythmic_dna', label: 'Rhythmic DNA', icon: '🥁' },
        { key: 'emotional_fingerprint', label: 'Emotional Fingerprint', icon: '💜' },
        { key: 'timbre_dna', label: 'Timbre DNA', icon: '🔊' },
        { key: 'mixing_signature', label: 'Mixing Signature', icon: '🎚️' },
        { key: 'sonic_architecture', label: 'Sonic Architecture', icon: '🏗️' }
    ];

    const sectionStyle = {
        background: 'rgba(10, 10, 31, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '0',
        marginBottom: '0.75rem',
        overflow: 'hidden'
    };

    const headerStyle = (isExpanded) => ({
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        background: isExpanded ? 'rgba(0, 217, 255, 0.05)' : 'transparent',
        borderBottom: isExpanded ? '1px solid rgba(0, 217, 255, 0.15)' : 'none',
        transition: 'all 0.2s ease'
    });

    const contentStyle = {
        padding: '1.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
    };

    // Neural Profile Content
    const NeuralProfileTab = () => (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 217, 255, 0.3) rgba(0, 0, 0, 0.2)'
        }}>
            {components ? (
                sections.map(({ key, label, icon }) => {
                    const data = components[key];
                    if (!data) return null;

                    const isExpanded = expandedSections[key];

                    return (
                        <div key={key} style={sectionStyle}>
                            <div
                                style={headerStyle(isExpanded)}
                                onClick={() => toggleSection(key)}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                                    <span style={{
                                        fontSize: '0.9375rem',
                                        fontWeight: '500',
                                        color: isExpanded ? 'rgba(0, 217, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)'
                                    }}>
                                        {label}
                                    </span>
                                </div>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={isExpanded ? 'rgba(0, 217, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                            {isExpanded && (
                                <div style={contentStyle}>
                                    {renderGenericComponent(data)}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    No profile components available
                </div>
            )}
        </div>
    );

    // Don't render if no data
    if (!components) return null;

    return (
        <div style={{
            width: '400px',
            minWidth: '400px',
            borderLeft: '1px solid rgba(0, 217, 255, 0.15)',
            background: 'rgba(5, 5, 20, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Panel Header */}
            <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(0, 217, 255, 0.15)',
                background: 'rgba(0, 217, 255, 0.05)'
            }}>
                <div style={{
                    fontSize: '0.6875rem',
                    color: 'rgba(0, 217, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: '0.25rem',
                    fontWeight: '600'
                }}>
                    Technical Analysis
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: '600'
                }}>
                    Neural Music Profile
                </div>
            </div>

            {/* Profile Content */}
            <NeuralProfileTab />
        </div>
    );
}
