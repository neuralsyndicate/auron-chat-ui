// ============================================================
// PRIVACY INDICATOR & PANEL
// "Chat is private" indicator with expandable privacy guarantees
// ============================================================

const { useState } = React;

// ═══════════════════════════════════════════════════════════════
// PRIVACY INDICATOR
// Small clickable indicator showing "Chat is private"
// ═══════════════════════════════════════════════════════════════

function PrivacyIndicator({ onClick, teeVerified }) {
    return (
        <button
            onClick={onClick}
            className={`privacy-indicator ${teeVerified ? 'verified' : ''}`}
            title="Click to learn about your privacy guarantees"
        >
            <span className="privacy-indicator-icon">{teeVerified ? '◉' : '○'}</span>
            <span className="privacy-indicator-text">Session</span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// PRIVACY PANEL
// Modal showing 3 privacy guarantees with expandable details
// ═══════════════════════════════════════════════════════════════

function PrivacyPanel({ onClose, teeVerification, onOpenTeeDetails }) {
    const [expandedCard, setExpandedCard] = useState(null);

    // Handle click outside to close
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const toggleCard = (cardId) => {
        setExpandedCard(expandedCard === cardId ? null : cardId);
    };

    const teeVerified = teeVerification?.all_verified;

    return (
        <div className="privacy-panel-overlay" onClick={handleOverlayClick}>
            <div className="privacy-panel">
                {/* Header */}
                <div className="privacy-panel-header">
                    <div className="privacy-panel-title-area">
                        <span className="privacy-panel-icon">◉</span>
                        <div>
                            <h2 className="privacy-panel-title">Session is Private</h2>
                            <p className="privacy-panel-subtitle">Your data is protected by design</p>
                        </div>
                    </div>
                    <button className="privacy-panel-close" onClick={onClose}>✕</button>
                </div>

                {/* Main Message */}
                <div className="privacy-panel-message">
                    <p>When using this chat, you have the guarantee that no one can see your data.</p>
                </div>

                {/* Three Guarantee Cards */}
                <div className="privacy-cards">
                    {/* Card 1: Data is Encrypted */}
                    <div
                        className={`privacy-card ${expandedCard === 'encrypted' ? 'expanded' : ''}`}
                        onClick={() => toggleCard('encrypted')}
                    >
                        <div className="privacy-card-header">
                            <div className="privacy-card-icon-wrapper">
                                <span className="privacy-card-icon">◉</span>
                            </div>
                            <div className="privacy-card-titles">
                                <p className="privacy-card-label">Data is</p>
                                <h3 className="privacy-card-title">Encrypted</h3>
                            </div>
                            <span className="privacy-card-arrow">{expandedCard === 'encrypted' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'encrypted' && (
                            <div className="privacy-card-content">
                                <p>All your conversations are encrypted on your device before being stored. Only you hold the decryption key derived from your identity.</p>
                                <ul>
                                    <li>End-to-end encryption using AES-256-GCM</li>
                                    <li>Keys derived from your unique identity</li>
                                    <li>Zero-knowledge storage - we can't read your data</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Code is Auditable */}
                    <div
                        className={`privacy-card ${expandedCard === 'auditable' ? 'expanded' : ''}`}
                        onClick={() => toggleCard('auditable')}
                    >
                        <div className="privacy-card-header">
                            <div className="privacy-card-icon-wrapper">
                                <span className="privacy-card-icon">◉</span>
                            </div>
                            <div className="privacy-card-titles">
                                <p className="privacy-card-label">Code is</p>
                                <h3 className="privacy-card-title">Auditable</h3>
                            </div>
                            <span className="privacy-card-arrow">{expandedCard === 'auditable' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'auditable' && (
                            <div className="privacy-card-content">
                                <p>Our inference code runs in a verifiable environment. The exact code processing your data can be inspected and audited.</p>
                                <ul>
                                    <li>Open source inference pipeline</li>
                                    <li>Cryptographic code attestation</li>
                                    <li>No hidden processing or logging</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Card 3: Runtime is Isolated */}
                    <div
                        className={`privacy-card ${expandedCard === 'isolated' ? 'expanded' : ''}`}
                        onClick={() => toggleCard('isolated')}
                    >
                        <div className="privacy-card-header">
                            <div className="privacy-card-icon-wrapper">
                                <span className={`privacy-card-icon ${teeVerified ? 'verified' : ''}`}>◉</span>
                            </div>
                            <div className="privacy-card-titles">
                                <p className="privacy-card-label">Runtime is</p>
                                <h3 className="privacy-card-title">Isolated</h3>
                            </div>
                            <span className="privacy-card-arrow">{expandedCard === 'isolated' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'isolated' && (
                            <div className="privacy-card-content">
                                <p>AI inference runs inside a Trusted Execution Environment (TEE) - a hardware-isolated secure enclave that no one can access, not even us.</p>
                                <ul>
                                    <li>Intel TDX hardware isolation</li>
                                    <li>NVIDIA H100 encrypted GPU memory</li>
                                    <li>Cryptographic attestation proof</li>
                                </ul>
                                {teeVerification && (
                                    <button
                                        className="privacy-card-action"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenTeeDetails && onOpenTeeDetails();
                                        }}
                                    >
                                        {teeVerified ? '◉ Verified' : '○ View Status'} — See Attestation Details →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="privacy-panel-footer">
                    <p>Your privacy is guaranteed by cryptography and hardware, not promises.</p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

window.PrivacyIndicator = {
    PrivacyIndicator,
    PrivacyPanel
};
