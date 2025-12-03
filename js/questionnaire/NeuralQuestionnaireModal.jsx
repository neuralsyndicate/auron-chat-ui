// ============================================================
// NEURAL QUESTIONNAIRE MODAL - 6 Questions for Profile Synthesis
// ============================================================
function NeuralQuestionnaireModal({ uploadId, dspComplete, onComplete, onClose }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({
        creator_state: [],
        influences: [],
        body_sensations: [],
        sound_role: null,
        temporal_movement: null,
        listener_intention: []
    });
    const [customInputValue, setCustomInputValue] = useState('');
    const [activeArchetypeTab, setActiveArchetypeTab] = useState('Opening');
    const [submitting, setSubmitting] = useState(false);
    const [allAnswered, setAllAnswered] = useState(false);

    // Q1 Creator State Archetypes (16 states in 4 categories)
    const creatorStateArchetypes = {
        'Opening': {
            description: 'Entering the process',
            states: [
                { id: 'searching', label: 'Searching', hint: 'Looking for something without knowing what' },
                { id: 'play', label: 'Play', hint: 'Un-serious exploration, touching sound like clay' },
                { id: 'dropped_in', label: 'Dropped In', hint: 'Presence, flow, thinking quiets' }
            ]
        },
        'Tension': {
            description: 'Where meaning forms',
            states: [
                { id: 'obsession', label: 'Obsession', hint: 'Looping details, hunting something invisible' },
                { id: 'friction', label: 'Friction', hint: 'Resistance between idea and current version' },
                { id: 'disruption', label: 'Disruption', hint: 'Breaking habits to find truth' },
                { id: 'construction', label: 'Construction', hint: 'Layering, building, shaping structure' }
            ]
        },
        'Clarity': {
            description: 'Where identity appears',
            states: [
                { id: 'surrender', label: 'Surrender', hint: 'Letting the track tell you what it wants' },
                { id: 'reduction', label: 'Reduction', hint: 'Removing what doesn\'t belong' },
                { id: 'integration', label: 'Integration', hint: 'Pieces connecting, idea becoming whole' },
                { id: 'expansion', label: 'Expansion', hint: 'Seeing the bigger arc' }
            ]
        },
        'Embodied': {
            description: 'The nervous system layer',
            states: [
                { id: 'stillness', label: 'Stillness', hint: 'Internal quiet, spaciousness' },
                { id: 'charge', label: 'Charge', hint: 'High energy, momentum, forward-pull' },
                { id: 'pressure', label: 'Pressure', hint: 'Nervous-system load from expectation' },
                { id: 'dissolution', label: 'Dissolution', hint: 'Boundaries soften, intuition dominates' },
                { id: 'reflection', label: 'Reflection', hint: 'Evaluating from a calm distance' }
            ]
        }
    };

    // Question definitions with Title Case and allowCustom for all
    const questions = [
        {
            id: 'creator_state',
            question: 'What was your creative state while making this?',
            type: 'multi-archetypes',
            archetypes: creatorStateArchetypes,
            allowCustom: true,
            minSelect: 1
        },
        {
            id: 'influences',
            question: 'Which influences shaped this track?',
            type: 'multi-categorized',
            categories: {
                'Genres': ['Ambient', 'Techno', 'House', 'Jazz', 'Classical', 'Hip-Hop', 'Rock', 'Electronic', 'Folk', 'World', 'Experimental'],
                'Eras': ['60s', '70s', '80s', '90s', '2000s', '2010s', 'Modern', 'Timeless'],
                'Cultures': ['Japanese', 'African', 'Latin', 'Nordic', 'Middle-Eastern', 'Indian', 'Slavic', 'Mediterranean'],
                'Production': ['Minimalist', 'Maximalist', 'Lo-Fi', 'Hi-Fi', 'Analog', 'Digital', 'Hybrid'],
                'Movements': ['Impressionist', 'Brutalist', 'Romantic', 'Futurist', 'Ambient', 'Industrial'],
                'Textures': ['Tribal', 'Urban', 'Natural', 'Synthetic', 'Cosmic', 'Earthly']
            },
            allowCustom: true,
            minSelect: 3
        },
        {
            id: 'body_sensations',
            question: 'Which body sensations match the track?',
            type: 'multi',
            options: ['Pressure', 'Openness', 'Movement', 'Stillness', 'Heaviness', 'Weightlessness', 'Tightness', 'Spaciousness'],
            allowCustom: true,
            minSelect: 1
        },
        {
            id: 'sound_role',
            question: 'What role does your main sound play?',
            type: 'single',
            options: ['Lead Voice', 'Rhythmic Engine', 'Atmosphere', 'Harmony Bed', 'Foundation Bass', 'Texture Layer', 'Percussive Accent'],
            allowCustom: true
        },
        {
            id: 'temporal_movement',
            question: 'How does the track move through time?',
            type: 'single',
            options: ['Steady', 'Rising', 'Falling', 'Tension → Release', 'Cycles', 'Bursts', 'Expanding', 'Dissolving'],
            allowCustom: true
        },
        {
            id: 'listener_intention',
            question: 'What do you want the listener to feel?',
            type: 'multi',
            options: ['Clarity', 'Energy', 'Calm', 'Focus', 'Nostalgia', 'Tension', 'Curiosity', 'Transcendence', 'Introspection'],
            allowCustom: true,
            minSelect: 1
        }
    ];

    const currentQ = questions[currentQuestion];

    // Check if all questions are answered
    useEffect(() => {
        const isComplete = questions.every(q => {
            const answer = answers[q.id];
            if (q.type === 'single') return answer !== null;
            return Array.isArray(answer) && answer.length >= (q.minSelect || 1);
        });
        setAllAnswered(isComplete);
    }, [answers]);

    // Auto-submit when both DSP complete and all answered
    useEffect(() => {
        if (dspComplete && allAnswered && currentQuestion === 6) {
            handleSubmit();
        }
    }, [dspComplete, allAnswered, currentQuestion]);

    const toggleOption = (questionId, option) => {
        const q = questions.find(q => q.id === questionId);
        if (q.type === 'single') {
            setAnswers(prev => ({ ...prev, [questionId]: option }));
        } else {
            setAnswers(prev => {
                const current = prev[questionId] || [];
                if (current.includes(option)) {
                    return { ...prev, [questionId]: current.filter(o => o !== option) };
                } else {
                    return { ...prev, [questionId]: [...current, option] };
                }
            });
        }
    };

    // Add custom value for any question
    const addCustomValue = (questionId) => {
        if (customInputValue.trim()) {
            const q = questions.find(q => q.id === questionId);
            if (q.type === 'single') {
                setAnswers(prev => ({ ...prev, [questionId]: customInputValue.trim() }));
            } else {
                setAnswers(prev => ({
                    ...prev,
                    [questionId]: [...(prev[questionId] || []), customInputValue.trim()]
                }));
            }
            setCustomInputValue('');
        }
    };

    // Get all predefined options for a question (for detecting custom values)
    const getPredefinedOptions = (q) => {
        if (q.type === 'multi-archetypes') {
            return Object.values(q.archetypes).flatMap(a => a.states.map(s => s.id));
        }
        if (q.type === 'multi-categorized') {
            return Object.values(q.categories).flat();
        }
        return q.options || [];
    };

    // Check if a value is custom (not in predefined options)
    const isCustomValue = (q, value) => {
        return !getPredefinedOptions(q).includes(value);
    };

    const canProceed = () => {
        const answer = answers[currentQ.id];
        if (currentQ.type === 'single') return answer !== null;
        if (currentQ.type === 'multi-archetypes') {
            return Array.isArray(answer) && answer.length >= (currentQ.minSelect || 1);
        }
        return Array.isArray(answer) && answer.length >= (currentQ.minSelect || 1);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setCustomInputValue('');
        } else {
            setCurrentQuestion(6);
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
            setCustomInputValue('');
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        onComplete(answers);
    };

    const getSelectionCount = () => {
        const answer = answers[currentQ.id];
        if (currentQ.type === 'single') return answer ? 1 : 0;
        return Array.isArray(answer) ? answer.length : 0;
    };

    const chipStyle = (isSelected) => ({
        padding: '0.75rem 1.25rem',
        background: isSelected ? 'rgba(0, 217, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
        border: isSelected ? '1px solid rgba(0, 217, 255, 0.7)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '4px',
        color: isSelected ? 'rgba(0, 217, 255, 1)' : 'rgba(255, 255, 255, 0.75)',
        fontSize: '0.9375rem',
        fontWeight: isSelected ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isSelected ? '0 0 20px rgba(0, 217, 255, 0.35), inset 0 0 20px rgba(0, 217, 255, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.15)'
    });

    const archetypeChipStyle = (isSelected) => ({
        ...chipStyle(isSelected),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '1rem 1.25rem',
        minHeight: '72px',
        textAlign: 'left'
    });

    const WaitingState = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
            {!dspComplete ? (
                <>
                    <div style={{ width: '48px', height: '48px', border: '2px solid rgba(0, 217, 255, 0.2)', borderTop: '2px solid rgba(0, 217, 255, 0.8)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
                    <div style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', marginBottom: '0.75rem' }}>Refining your sonic fingerprint...</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '300px', lineHeight: '1.6' }}>Feel free to revisit your answers while we analyze the audio.</div>
                    <button onClick={() => setCurrentQuestion(0)} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(0, 217, 255, 0.3)', color: 'rgba(0, 217, 255, 0.9)', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '0' }}>Review Answers</button>
                </>
            ) : (
                <div style={{ fontSize: '1.125rem', color: 'rgba(0, 217, 255, 0.9)', fontWeight: '500', marginBottom: '0.75rem' }}>Creating your Neural Music Profile...</div>
            )}
        </div>
    );

    const CustomInputField = ({ questionId }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem', background: customInputValue ? 'rgba(0, 217, 255, 0.05)' : 'transparent', border: '1px dashed rgba(0, 217, 255, 0.3)', borderRadius: '4px', transition: 'all 0.2s ease' }}>
            <span style={{ color: 'rgba(0, 217, 255, 0.7)', fontSize: '1.25rem', fontWeight: '300' }}>+</span>
            <input type="text" value={customInputValue} onChange={(e) => setCustomInputValue(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && customInputValue.trim()) { addCustomValue(questionId); } }} placeholder="Add your own..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', fontFamily: 'inherit' }} />
            {customInputValue.trim() && (
                <button onClick={() => addCustomValue(questionId)} style={{ padding: '0.375rem 0.75rem', background: 'rgba(0, 217, 255, 0.15)', border: '1px solid rgba(0, 217, 255, 0.4)', borderRadius: '4px', color: 'rgba(0, 217, 255, 1)', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>Add</button>
            )}
        </div>
    );

    const renderCustomValues = (q, selected) => {
        const customValues = Array.isArray(selected) ? selected.filter(s => isCustomValue(q, s)) : (selected && isCustomValue(q, selected) ? [selected] : []);
        if (customValues.length === 0) return null;
        return (
            <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(0, 217, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Your Additions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {customValues.map(tag => (<button key={tag} onClick={() => toggleOption(q.id, tag)} style={chipStyle(true)}>{tag} ×</button>))}
                </div>
            </div>
        );
    };

    const renderQuestionContent = () => {
        if (currentQuestion >= questions.length) return <WaitingState />;

        const q = currentQ;
        const selected = answers[q.id] || (q.type === 'single' ? null : []);

        if (q.type === 'multi-archetypes') {
            const archetypes = q.archetypes;
            const currentArchetype = archetypes[activeArchetypeTab];
            return (
                <div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {Object.entries(archetypes).map(([name, data]) => {
                            const hasSelection = selected.some(s => data.states.some(st => st.id === s));
                            return (
                                <button key={name} onClick={() => setActiveArchetypeTab(name)} style={{ padding: '0.75rem 1.25rem', background: activeArchetypeTab === name ? 'rgba(0, 217, 255, 0.1)' : 'transparent', border: 'none', borderBottom: activeArchetypeTab === name ? '2px solid rgba(0, 217, 255, 0.8)' : '2px solid transparent', color: activeArchetypeTab === name ? 'rgba(0, 217, 255, 1)' : 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                    {name}
                                    {hasSelection && (<span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(0, 217, 255, 1)' }} />)}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '1rem', fontStyle: 'italic' }}>{currentArchetype.description}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        {currentArchetype.states.map(state => (
                            <button key={state.id} onClick={() => toggleOption(q.id, state.id)} style={archetypeChipStyle(selected.includes(state.id))}>
                                <span style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{state.label}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.3 }}>{state.hint}</span>
                            </button>
                        ))}
                    </div>
                    {renderCustomValues(q, selected)}
                    {q.allowCustom && <CustomInputField questionId={q.id} />}
                </div>
            );
        }

        if (q.type === 'multi-categorized') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {Object.entries(q.categories).map(([category, options]) => (
                        <div key={category}>
                            <div style={{ fontSize: '0.6875rem', color: 'rgba(0, 217, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>{category}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {options.map(opt => (<button key={opt} onClick={() => toggleOption(q.id, opt)} style={chipStyle(selected.includes(opt))}>{opt}</button>))}
                            </div>
                        </div>
                    ))}
                    {renderCustomValues(q, selected)}
                    {q.allowCustom && <CustomInputField questionId={q.id} />}
                </div>
            );
        }

        return (
            <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                    {q.options.map(opt => (<button key={opt} onClick={() => toggleOption(q.id, opt)} style={chipStyle(q.type === 'single' ? selected === opt : selected.includes(opt))}>{opt}</button>))}
                </div>
                {renderCustomValues(q, selected)}
                {q.allowCustom && <CustomInputField questionId={q.id} />}
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ width: '900px', maxWidth: '95vw', maxHeight: '85vh', minHeight: '500px', background: 'rgba(10, 10, 31, 0.97)', backdropFilter: 'blur(40px)', border: '1px solid rgba(0, 217, 255, 0.2)', borderRadius: '8px', boxShadow: '0 0 80px rgba(0, 13, 255, 0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid rgba(0, 217, 255, 0.12)', background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.05) 0%, transparent 50%)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(0, 217, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.75rem', fontWeight: '600' }}>Neural Music Profile</div>
                    <div style={{ fontSize: '1.5rem', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600', lineHeight: '1.3' }}>Tell me about your creative process</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>Your answers shape how Auron understands your music</div>
                </div>

                {/* Progress Track */}
                {currentQuestion < questions.length && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', background: 'rgba(255, 255, 255, 0.1)', transform: 'translateY(-50%)' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '15%', width: `${Math.max(0, (currentQuestion / (questions.length - 1)) * 70)}%`, height: '2px', background: 'linear-gradient(90deg, rgba(0, 217, 255, 0.8), rgba(0, 217, 255, 0.4))', transform: 'translateY(-50%)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        {questions.map((_, idx) => (
                            <div key={idx} onClick={() => idx < currentQuestion && setCurrentQuestion(idx)} style={{ width: idx === currentQuestion ? '16px' : '12px', height: idx === currentQuestion ? '16px' : '12px', borderRadius: '50%', background: idx < currentQuestion ? 'rgba(0, 217, 255, 1)' : idx === currentQuestion ? 'rgba(10, 10, 31, 1)' : 'rgba(255, 255, 255, 0.15)', border: idx === currentQuestion ? '2px solid rgba(0, 217, 255, 1)' : 'none', boxShadow: idx <= currentQuestion ? '0 0 12px rgba(0, 217, 255, 0.5)' : 'none', transition: 'all 0.3s ease', cursor: idx < currentQuestion ? 'pointer' : 'default', position: 'relative', zIndex: 1, margin: '0 1.5rem' }} />
                        ))}
                    </div>
                )}

                {/* Question Number */}
                {currentQuestion < questions.length && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '2rem', fontWeight: '700', color: 'rgba(0, 217, 255, 0.9)', lineHeight: 1 }}>{currentQuestion + 1}</span>
                            <span style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '400' }}>of {questions.length}</span>
                        </div>
                        {(currentQ.type !== 'single') && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: getSelectionCount() >= (currentQ.minSelect || 1) ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 200, 0, 0.1)', border: `1px solid ${getSelectionCount() >= (currentQ.minSelect || 1) ? 'rgba(0, 217, 255, 0.3)' : 'rgba(255, 200, 0, 0.3)'}`, borderRadius: '20px', fontSize: '0.75rem', color: getSelectionCount() >= (currentQ.minSelect || 1) ? 'rgba(0, 217, 255, 0.9)' : 'rgba(255, 200, 0, 0.9)' }}>
                                <span>{getSelectionCount()} selected</span>
                                {currentQ.minSelect && <span style={{ opacity: 0.6 }}>/ min {currentQ.minSelect}</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Question Content */}
                <div style={{ flex: 1, padding: '1.5rem 2.5rem', overflowY: 'auto' }}>
                    {currentQuestion < questions.length && (
                        <div style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1.5rem', fontWeight: '500', lineHeight: '1.4' }}>{currentQ.question}</div>
                    )}
                    {renderQuestionContent()}
                </div>

                {/* Footer Navigation */}
                {currentQuestion < questions.length && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', borderTop: '1px solid rgba(0, 217, 255, 0.12)', background: 'rgba(0, 0, 0, 0.2)' }}>
                        <button onClick={handleBack} disabled={currentQuestion === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: currentQuestion === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.9375rem', fontWeight: '500', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: currentQuestion === 0 ? 0.5 : 1 }}>← Back</button>
                        <button onClick={handleNext} disabled={!canProceed()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: canProceed() ? 'rgba(0, 217, 255, 0.2)' : 'rgba(0, 217, 255, 0.08)', border: canProceed() ? '1px solid rgba(0, 217, 255, 0.5)' : '1px solid rgba(0, 217, 255, 0.2)', borderRadius: '4px', color: canProceed() ? 'rgba(0, 217, 255, 1)' : 'rgba(0, 217, 255, 0.4)', fontSize: '0.9375rem', fontWeight: '600', cursor: canProceed() ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease', boxShadow: canProceed() ? '0 0 25px rgba(0, 217, 255, 0.25)' : 'none', opacity: canProceed() ? 1 : 0.6 }}>{currentQuestion === questions.length - 1 ? 'Complete' : 'Continue'} →</button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
