// ============================================================
// TEE VERIFICATION COMPONENTS
// Trusted Execution Environment verification badges and modal
// ============================================================

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Determines if a message badge should be shown
 * Only shows when message status differs from session default
 */
function shouldShowMessageBadge(msgTee, sessionDefault) {
    if (!msgTee) return false;
    if (sessionDefault === null) return true;
    return msgTee.all_verified !== sessionDefault;
}

// ═══════════════════════════════════════════════════════════════
// TEE SESSION BADGE
// Shows in header area - always visible when TEE data exists
// ═══════════════════════════════════════════════════════════════

function TEESessionBadge({ teeVerification, onClick }) {
    if (!teeVerification) return null;

    const isVerified = teeVerification.all_verified;
    const isFallback = teeVerification.fallback_used;

    return (
        <button
            onClick={onClick}
            className={`tee-session-badge ${isVerified ? 'verified' : 'unverified'}`}
            title={isVerified ? 'All inference verified by TEE' : 'Verification incomplete'}
        >
            <span className="tee-badge-icon">
                {isVerified ? '✓' : '⚠'}
            </span>
            <span className="tee-badge-text">
                {isVerified ? 'TEE Verified' : isFallback ? 'Fallback' : 'Unverified'}
            </span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// TEE MESSAGE BADGE
// Inline with message - only shows when status differs from session
// ═══════════════════════════════════════════════════════════════

function TEEMessageBadge({ teeVerification, sessionDefault, onClick }) {
    if (!teeVerification) return null;

    // Smart display: only show if different from session default
    if (!shouldShowMessageBadge(teeVerification, sessionDefault)) {
        return null;
    }

    const isVerified = teeVerification.all_verified;

    return (
        <button
            onClick={onClick}
            className={`tee-message-badge ${isVerified ? 'verified' : 'unverified'}`}
            title={isVerified ? 'Verified by TEE' : 'Not TEE verified'}
        >
            <span className="tee-badge-icon-small">
                {isVerified ? '✓' : '⚠'}
            </span>
            <span className="tee-badge-text-small">
                {isVerified ? 'Verified' : 'Unverified'}
            </span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// TEE HOVER INDICATOR
// Small indicator for constellation hover card
// ═══════════════════════════════════════════════════════════════

function TEEHoverIndicator({ teeVerification }) {
    if (!teeVerification) return null;

    const isVerified = teeVerification.all_verified;

    return (
        <span className={`tee-hover-indicator ${isVerified ? 'verified' : 'unverified'}`}>
            {isVerified ? '✓ TEE' : '⚠'}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusCard({ label, value, inverted = false }) {
    const isGood = inverted ? !value : value;

    return (
        <div className={`tee-status-card ${isGood ? 'good' : 'warning'}`}>
            <p className="tee-status-label">{label}</p>
            <p className="tee-status-value">{value ? 'Yes' : 'No'}</p>
        </div>
    );
}

function ComponentRow({ name, verified }) {
    return (
        <div className="tee-component-row">
            <span className="tee-component-name">{name}</span>
            <span className={`tee-component-status ${verified ? 'verified' : 'unverified'}`}>
                {verified ? '✓ Verified' : '⚠ Unverified'}
            </span>
        </div>
    );
}

function AttestationField({ label, value, monospace = false, truncate = false }) {
    return (
        <div className="tee-attestation-field">
            <p className="tee-field-label">{label}</p>
            <p className={`tee-field-value ${monospace ? 'monospace' : ''} ${truncate ? 'truncate' : ''}`}>
                {value || '—'}
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TEE ATTESTATION MODAL
// Detailed verification information with glassmorphic styling
// ═══════════════════════════════════════════════════════════════

function TEEAttestationModal({ teeVerification, onClose }) {
    if (!teeVerification) return null;

    const {
        all_verified,
        tee_available,
        fallback_used,
        fallback_provider,
        components,
        attestation
    } = teeVerification;

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

    return (
        <div className="tee-modal-overlay" onClick={handleOverlayClick}>
            <div className={`tee-modal ${all_verified ? 'verified' : 'unverified'}`}>
                {/* Header */}
                <div className="tee-modal-header">
                    <div className="tee-modal-title-area">
                        <span className={`tee-modal-icon ${all_verified ? 'verified' : 'unverified'}`}>
                            {all_verified ? '🔒' : '⚠️'}
                        </span>
                        <div>
                            <h2 className="tee-modal-title">TEE Verification</h2>
                            <p className={`tee-modal-subtitle ${all_verified ? 'verified' : 'unverified'}`}>
                                {all_verified ? 'All components verified' : 'Verification incomplete'}
                            </p>
                        </div>
                    </div>

                    <button className="tee-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="tee-modal-content">
                    {/* Privacy Message */}
                    <div className={`tee-privacy-message ${all_verified ? 'verified' : 'unverified'}`}>
                        <span className="tee-privacy-icon">{all_verified ? '🛡️' : '⚠️'}</span>
                        <p>
                            {all_verified
                                ? 'Your conversation is confidential. All inference ran in a hardware-isolated Trusted Execution Environment.'
                                : 'This session used a fallback provider. Privacy guarantees may differ.'}
                        </p>
                    </div>

                    {/* Status Overview */}
                    <div className="tee-status-grid">
                        <StatusCard label="TEE Available" value={tee_available} />
                        <StatusCard label="Fallback Used" value={fallback_used} inverted />
                    </div>

                    {/* Fallback Provider (if applicable) */}
                    {fallback_used && fallback_provider && (
                        <div className="tee-fallback-info">
                            <p className="tee-fallback-label">Fallback Provider</p>
                            <p className="tee-fallback-value">{fallback_provider}</p>
                        </div>
                    )}

                    {/* Component Verification Status */}
                    <div className="tee-section">
                        <h3 className="tee-section-title">Component Status</h3>
                        <div className="tee-component-list">
                            {components && (
                                <>
                                    <ComponentRow
                                        name="Agents"
                                        verified={components.agents?.tee_verified}
                                    />
                                    <ComponentRow
                                        name="Auron Synthesis"
                                        verified={components.auron_synthesis?.tee_verified}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Attestation Details */}
                    {attestation && (
                        <div className="tee-section">
                            <h3 className="tee-section-title">Attestation Details</h3>

                            <div className="tee-attestation-box">
                                <AttestationField label="Provider" value={attestation.provider} />
                                <AttestationField label="Model" value={attestation.model} />
                                <AttestationField
                                    label="Signing Address"
                                    value={attestation.signing_address}
                                    monospace
                                    truncate
                                />
                                <AttestationField
                                    label="Nonce"
                                    value={attestation.nonce}
                                    monospace
                                    truncate
                                />

                                {/* NVIDIA Attestation */}
                                {attestation.nvidia && (
                                    <div className="tee-attestation-subsection">
                                        <p className="tee-subsection-title">NVIDIA GPU Attestation</p>
                                        <AttestationField
                                            label="Architecture"
                                            value={attestation.nvidia.architecture}
                                        />
                                        <a
                                            href={attestation.nvidia.verify_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="tee-verify-link"
                                        >
                                            Verify GPU Attestation →
                                        </a>
                                    </div>
                                )}

                                {/* Intel TDX Attestation */}
                                {attestation.intel_tdx && (
                                    <div className="tee-attestation-subsection">
                                        <p className="tee-subsection-title">Intel TDX Attestation</p>
                                        <a
                                            href={attestation.intel_tdx.verify_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="tee-verify-link"
                                        >
                                            Verify TDX Quote →
                                        </a>
                                    </div>
                                )}

                                {/* Cache Info */}
                                {attestation.cached_at && attestation.expires_at && (
                                    <div className="tee-attestation-subsection">
                                        <p className="tee-subsection-title">Cache Information</p>
                                        <AttestationField
                                            label="Cached At"
                                            value={new Date(attestation.cached_at * 1000).toLocaleString()}
                                        />
                                        <AttestationField
                                            label="Expires At"
                                            value={new Date(attestation.expires_at * 1000).toLocaleString()}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Privacy Guarantees */}
                    {all_verified && (
                        <div className="tee-section">
                            <h3 className="tee-section-title">Privacy Guarantees</h3>
                            <div className="tee-guarantees">
                                <div className="tee-guarantee-item">
                                    <span className="tee-guarantee-icon">🔐</span>
                                    <div>
                                        <p className="tee-guarantee-title">Hardware Isolation</p>
                                        <p className="tee-guarantee-desc">Code runs in Intel TDX Trust Domain</p>
                                    </div>
                                </div>
                                <div className="tee-guarantee-item">
                                    <span className="tee-guarantee-icon">🎮</span>
                                    <div>
                                        <p className="tee-guarantee-title">GPU Encryption</p>
                                        <p className="tee-guarantee-desc">NVIDIA H100 encrypts all GPU memory</p>
                                    </div>
                                </div>
                                <div className="tee-guarantee-item">
                                    <span className="tee-guarantee-icon">🚫</span>
                                    <div>
                                        <p className="tee-guarantee-title">Zero Retention</p>
                                        <p className="tee-guarantee-desc">No logs, prompts, or outputs stored</p>
                                    </div>
                                </div>
                                <div className="tee-guarantee-item">
                                    <span className="tee-guarantee-icon">📝</span>
                                    <div>
                                        <p className="tee-guarantee-title">Cryptographic Proof</p>
                                        <p className="tee-guarantee-desc">Every response has signed attestation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

// Make components available globally (for non-module usage)
window.TEEVerification = {
    TEESessionBadge,
    TEEMessageBadge,
    TEEHoverIndicator,
    TEEAttestationModal,
    shouldShowMessageBadge
};
