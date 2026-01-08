// ============================================================
// PRIVACY INDICATOR & PANEL
// Verifiable privacy guarantees with cryptographic proof
// ============================================================

const { useState, useEffect } = React;

// ═══════════════════════════════════════════════════════════════
// COPYABLE HASH COMPONENT
// Display truncated hash with copy-to-clipboard functionality
// ═══════════════════════════════════════════════════════════════

function CopyableHash({ label, value, maxLength = 64 }) {
    const [copied, setCopied] = useState(false);

    if (!value) return null;

    const truncated = value.length > maxLength
        ? value.slice(0, maxLength) + '...'
        : value;

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="privacy-hash-field">
            <div className="privacy-hash-header">
                <span className="privacy-hash-label">{label}</span>
                <button
                    onClick={handleCopy}
                    className={`privacy-copy-btn ${copied ? 'copied' : ''}`}
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <code className="privacy-hash-value">{truncated}</code>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION STATUS BADGE
// Shows attested/verified status
// ═══════════════════════════════════════════════════════════════

function VerificationBadge({ verified, label }) {
    return (
        <div className={`privacy-verification-badge ${verified ? 'verified' : 'pending'}`}>
            <span className="privacy-verification-icon">{verified ? '◉' : '○'}</span>
            <span className="privacy-verification-text">{label || (verified ? 'Attested' : 'Pending')}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// PRIVACY INDICATOR
// Small clickable indicator showing "Session"
// ═══════════════════════════════════════════════════════════════

function PrivacyIndicator({ onClick, teeVerified }) {
    return (
        <button
            onClick={onClick}
            className={`privacy-indicator ${teeVerified ? 'verified' : ''}`}
            title="Click to view your privacy guarantees"
        >
            <span className="privacy-indicator-icon">{teeVerified ? '◉' : '○'}</span>
            <span className="privacy-indicator-text">Session</span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// PRIVACY PANEL
// Modal showing 3 privacy guarantees with cryptographic proof
// ═══════════════════════════════════════════════════════════════

function PrivacyPanel({ onClose, teeVerification, encryptionKeyFingerprint, userId }) {
    const [expandedCard, setExpandedCard] = useState(null);
    const [keyFingerprint, setKeyFingerprint] = useState(encryptionKeyFingerprint || null);

    // Compute encryption key fingerprint if not provided
    useEffect(() => {
        async function computeKeyFingerprint() {
            if (keyFingerprint || !userId) return;

            try {
                // Derive the encryption key
                if (typeof deriveUserEncryptionKey === 'function') {
                    const key = await deriveUserEncryptionKey(userId);
                    const exported = await crypto.subtle.exportKey('raw', key);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', exported);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    setKeyFingerprint(fingerprint);
                }
            } catch (err) {
                console.error('Failed to compute key fingerprint:', err);
            }
        }
        computeKeyFingerprint();
    }, [userId, keyFingerprint]);

    // Handle click outside to close
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const toggleCard = (cardId) => {
        setExpandedCard(expandedCard === cardId ? null : cardId);
    };

    // Extract attestation data
    const attestation = teeVerification?.attestation;
    const teeVerified = teeVerification?.all_verified;
    const teeAvailable = teeVerification?.tee_available;
    const fallbackUsed = teeVerification?.fallback_used;

    return (
        <div className="privacy-panel-overlay" onClick={handleOverlayClick}>
            <div className="privacy-panel">
                {/* Header */}
                <div className="privacy-panel-header">
                    <div className="privacy-panel-title-area">
                        <span className={`privacy-panel-icon ${teeVerified ? 'verified' : ''}`}>◉</span>
                        <div>
                            <h2 className="privacy-panel-title">Session is Private</h2>
                            <p className="privacy-panel-subtitle">
                                {teeVerified
                                    ? 'Cryptographically verified'
                                    : fallbackUsed
                                        ? 'Using fallback provider'
                                        : 'Verifying...'}
                            </p>
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

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* Card 1: Data is Encrypted */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <div
                        className={`privacy-card ${expandedCard === 'encrypted' ? 'expanded' : ''}`}
                        onClick={() => toggleCard('encrypted')}
                    >
                        <div className="privacy-card-header">
                            <div className="privacy-card-icon-wrapper">
                                <span className={`privacy-card-icon ${keyFingerprint ? 'verified' : ''}`}>◉</span>
                            </div>
                            <div className="privacy-card-titles">
                                <p className="privacy-card-label">Data is</p>
                                <h3 className="privacy-card-title">Encrypted</h3>
                            </div>
                            <VerificationBadge verified={!!keyFingerprint} />
                            <span className="privacy-card-arrow">{expandedCard === 'encrypted' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'encrypted' && (
                            <div className="privacy-card-content">
                                <p>Your data is encrypted using a unique key derived from your identity. Only you can decrypt your conversations.</p>

                                {keyFingerprint && (
                                    <CopyableHash
                                        label="Your encryption key fingerprint"
                                        value={keyFingerprint}
                                    />
                                )}

                                <div className="privacy-info-section">
                                    <div className="privacy-info-row">
                                        <span className="privacy-info-label">Encryption Protocol</span>
                                        <span className="privacy-info-value">AES-256-GCM</span>
                                    </div>
                                    <div className="privacy-info-row">
                                        <span className="privacy-info-label">Key Derivation</span>
                                        <span className="privacy-info-value">PBKDF2-SHA256 (100k iterations)</span>
                                    </div>
                                </div>

                                <p className="privacy-info-note">
                                    Your encryption key is derived locally in your browser from your unique identity.
                                    It never leaves your device.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* Card 2: Code is Auditable */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <div
                        className={`privacy-card ${expandedCard === 'auditable' ? 'expanded' : ''}`}
                        onClick={() => toggleCard('auditable')}
                    >
                        <div className="privacy-card-header">
                            <div className="privacy-card-icon-wrapper">
                                <span className={`privacy-card-icon ${attestation ? 'verified' : ''}`}>◉</span>
                            </div>
                            <div className="privacy-card-titles">
                                <p className="privacy-card-label">Code is</p>
                                <h3 className="privacy-card-title">Auditable</h3>
                            </div>
                            <VerificationBadge verified={!!attestation} label={attestation ? 'Verified' : 'Pending'} />
                            <span className="privacy-card-arrow">{expandedCard === 'auditable' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'auditable' && (
                            <div className="privacy-card-content">
                                <p>All code processing your data runs in a verifiable environment and comes from trusted open-source repositories.</p>

                                {attestation && (
                                    <>
                                        <div className="privacy-info-section">
                                            <div className="privacy-info-row">
                                                <span className="privacy-info-label">TEE Provider</span>
                                                <span className="privacy-info-value">{attestation.provider || 'RedPill/Phala'}</span>
                                            </div>
                                            <div className="privacy-info-row">
                                                <span className="privacy-info-label">Model</span>
                                                <span className="privacy-info-value">{attestation.model || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {attestation.signing_address && (
                                            <CopyableHash
                                                label="TEE Signing Address"
                                                value={attestation.signing_address}
                                            />
                                        )}
                                    </>
                                )}

                                <div className="privacy-links-section">
                                    <a
                                        href="https://github.com/phalanx-hk/phala-blockchain"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="privacy-external-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Phala Network (GitHub) →
                                    </a>
                                    <a
                                        href="https://docs.redpill.ai/privacy/confidential-ai/attestation"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="privacy-external-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        RedPill Attestation Docs →
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* Card 3: Runtime is Isolated */}
                    {/* ═══════════════════════════════════════════════════════ */}
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
                            <VerificationBadge verified={teeVerified} label={teeVerified ? 'Attested' : (fallbackUsed ? 'Fallback' : 'Pending')} />
                            <span className="privacy-card-arrow">{expandedCard === 'isolated' ? '−' : '+'}</span>
                        </div>
                        {expandedCard === 'isolated' && (
                            <div className="privacy-card-content">
                                <p>AI inference runs inside a Trusted Execution Environment (TEE) - a hardware-isolated secure enclave that no one can access, not even us.</p>

                                {fallbackUsed && (
                                    <div className="privacy-warning-box">
                                        <span className="privacy-warning-icon">⚠</span>
                                        <span>TEE unavailable. Using fallback provider: {teeVerification?.fallback_provider || 'Unknown'}</span>
                                    </div>
                                )}

                                {attestation && (
                                    <>
                                        {/* NVIDIA GPU Attestation */}
                                        {attestation.nvidia && (
                                            <div className="privacy-attestation-section">
                                                <h4 className="privacy-section-title">NVIDIA GPU Attestation</h4>
                                                <div className="privacy-info-row">
                                                    <span className="privacy-info-label">Architecture</span>
                                                    <span className="privacy-info-value">{attestation.nvidia.architecture || 'HOPPER'}</span>
                                                </div>
                                                <CopyableHash
                                                    label="NVIDIA Attestation Payload"
                                                    value={attestation.nvidia.payload}
                                                    maxLength={80}
                                                />
                                                {attestation.nvidia.verify_url && (
                                                    <a
                                                        href={attestation.nvidia.verify_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="privacy-verify-link"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Verify on NVIDIA →
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Intel TDX Attestation */}
                                        {attestation.intel_tdx && (
                                            <div className="privacy-attestation-section">
                                                <h4 className="privacy-section-title">Intel TDX Attestation</h4>
                                                <CopyableHash
                                                    label="Intel TDX Quote"
                                                    value={attestation.intel_tdx.quote}
                                                    maxLength={80}
                                                />
                                                {attestation.intel_tdx.verify_url && (
                                                    <a
                                                        href={attestation.intel_tdx.verify_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="privacy-verify-link"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Verify on t16z →
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Nonce for replay protection */}
                                        {attestation.nonce && (
                                            <CopyableHash
                                                label="Session Nonce (replay protection)"
                                                value={attestation.nonce}
                                            />
                                        )}

                                        {/* Timestamps */}
                                        {attestation.cached_at && (
                                            <div className="privacy-info-section">
                                                <div className="privacy-info-row">
                                                    <span className="privacy-info-label">Attested at</span>
                                                    <span className="privacy-info-value">
                                                        {new Date(attestation.cached_at * 1000).toLocaleString()}
                                                    </span>
                                                </div>
                                                {attestation.expires_at && (
                                                    <div className="privacy-info-row">
                                                        <span className="privacy-info-label">Valid until</span>
                                                        <span className="privacy-info-value">
                                                            {new Date(attestation.expires_at * 1000).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {!attestation && !fallbackUsed && (
                                    <p className="privacy-info-note">
                                        Attestation data will appear after your first message is processed.
                                    </p>
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
    PrivacyPanel,
    CopyableHash,
    VerificationBadge
};
