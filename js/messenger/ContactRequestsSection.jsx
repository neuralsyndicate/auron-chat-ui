// ============================================================
// CONTACT REQUESTS SECTION - UI for pending contact requests
// ============================================================

const { useState, useCallback } = React;

function ContactRequestsSection({
    pendingRequests,
    onAccept,
    onIgnore,
    onBlock,
    isCollapsed,
    onToggleCollapse
}) {
    const [processingIds, setProcessingIds] = useState(new Set());
    const [showMenuFor, setShowMenuFor] = useState(null);

    const handleAccept = useCallback(async (sessionId) => {
        setProcessingIds(prev => new Set([...prev, sessionId]));
        try {
            await onAccept(sessionId);
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
    }, [onAccept]);

    const handleIgnore = useCallback(async (sessionId) => {
        setProcessingIds(prev => new Set([...prev, sessionId]));
        try {
            await onIgnore(sessionId);
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
        setShowMenuFor(null);
    }, [onIgnore]);

    const handleBlock = useCallback(async (sessionId) => {
        setProcessingIds(prev => new Set([...prev, sessionId]));
        try {
            await onBlock(sessionId);
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
        setShowMenuFor(null);
    }, [onBlock]);

    if (!pendingRequests || pendingRequests.length === 0) {
        return null;
    }

    const getDisplayName = (request) => {
        if (request.displayName) return request.displayName;
        if (request.username) return '@' + request.username;
        return request.sessionId.slice(0, 8) + '...';
    };

    const getUsernameDisplay = (request) => {
        if (request.username) return '@' + request.username;
        return null;
    };

    return (
        <div className="border-b border-white/5">
            {/* Header - Collapsible */}
            <button
                onClick={onToggleCollapse}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-400">Contact Requests</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        {pendingRequests.length}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Request Cards */}
            {!isCollapsed && (
                <div className="px-2 pb-2 space-y-2">
                    {pendingRequests.map((request) => {
                        const isProcessing = processingIds.has(request.sessionId);
                        const displayName = getDisplayName(request);
                        const usernameDisplay = getUsernameDisplay(request);

                        return (
                            <div
                                key={request.sessionId}
                                className="bg-white/5 rounded-xl p-3 border border-amber-500/20"
                            >
                                {/* User Info */}
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-amber-400 text-sm font-medium">
                                            {displayName.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm font-medium truncate">
                                                {displayName}
                                            </span>
                                            {!request.username && (
                                                <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                                                    Unknown
                                                </span>
                                            )}
                                        </div>
                                        {usernameDisplay && displayName !== usernameDisplay && (
                                            <div className="text-xs text-gray-500">{usernameDisplay}</div>
                                        )}
                                        <div className="text-xs text-gray-600 font-mono truncate mt-0.5">
                                            {request.sessionId.slice(0, 16)}...
                                        </div>
                                    </div>
                                </div>

                                {/* Message Preview */}
                                {request.message && (
                                    <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                                        <p className="text-gray-300 text-sm line-clamp-2">
                                            "{request.message}"
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAccept(request.sessionId)}
                                        disabled={isProcessing}
                                        className="flex-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? 'Processing...' : 'Accept'}
                                    </button>
                                    <button
                                        onClick={() => handleIgnore(request.sessionId)}
                                        disabled={isProcessing}
                                        className="flex-1 px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Ignore
                                    </button>

                                    {/* More Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMenuFor(showMenuFor === request.sessionId ? null : request.sessionId)}
                                            disabled={isProcessing}
                                            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="5" r="2" />
                                                <circle cx="12" cy="12" r="2" />
                                                <circle cx="12" cy="19" r="2" />
                                            </svg>
                                        </button>

                                        {showMenuFor === request.sessionId && (
                                            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                                                <button
                                                    onClick={() => handleBlock(request.sessionId)}
                                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    Block User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <div className="mt-2 text-xs text-gray-600 text-right">
                                    Received {new Date(request.receivedAt).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Export for global access
window.ContactRequestsSection = ContactRequestsSection;
