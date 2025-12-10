// ============================================================
// MEMORY MODAL - Neural Memory in Modal Window
// ============================================================
// Renders MemoryView inside a modal overlay for quick access
// from the user avatar dropdown menu.
// ============================================================

function MemoryModal({ user, onClose, onOpenFullView }) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Close on overlay click (not modal content)
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="memory-modal-overlay" onClick={handleOverlayClick}>
            <div className="memory-modal-container">
                {/* Modal Header */}
                <div className="memory-modal-header">
                    <div className="memory-modal-title-group">
                        <h2 className="memory-modal-title">Neural Memory</h2>
                        <span className="memory-modal-subtitle">Quick view</span>
                    </div>
                    <div className="memory-modal-actions">
                        <button
                            className="memory-modal-full-view-btn"
                            onClick={onOpenFullView}
                            title="Open full memory view"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                            <span>Full View</span>
                        </button>
                        <button
                            className="memory-modal-close-btn"
                            onClick={onClose}
                            title="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content - Scrollable MemoryView */}
                <div className="memory-modal-content">
                    <MemoryView user={user} />
                </div>
            </div>
        </div>
    );
}
