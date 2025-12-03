// ===== API ENDPOINTS - DO NOT CHANGE =====
const API_BASE = 'http://86.38.182.54:8001';
const DIALOGUE_API_BASE = 'https://api.neuralsyndicate.com';  // Backend via Cloudflare Tunnel
const BFF_API_BASE = 'https://api.combryth-backbone.ch';  // BFF for Neural Music Profile
const BUNNY_STORAGE_URL = 'https://storage.bunnycdn.com/combryth-data';  // BunnyCDN Storage
const BUNNY_PASSWORD = 'f528b697-2867-40b5-bf1710764185-4b99-4621';  // Read-only password
const UNLOCK_THRESHOLD = 10;

// SSE Streaming Constants - Event mapping for real-time progress
const SSE_STAGE_MESSAGES = {
    'complexity_analyzing': 'Analyzing message complexity...',
    'complexity_complete': 'Complexity analysis complete',
    'emotion_analyzing': 'Detecting emotional patterns...',
    'emotion_complete': 'Emotional patterns identified',
    'domain_analyzing': 'Mapping knowledge domains...',
    'domain_complete': 'Knowledge domains mapped',
    'trigger_analyzing': 'Identifying psychological patterns...',
    'trigger_complete': 'Psychological patterns recognized',
    'blueprint_retrieved': 'Neural Music framework retrieved...',
    'blueprint_skipped': 'Framework check complete',
    'web_search_analyzing': 'Searching research papers...',
    'web_search_complete': 'Research complete',
    'auron_thinking': 'Crafting response...',
    'auron_complete': 'Response ready',
    'complete': 'Complete'
};

const SSE_STAGE_PROGRESS = {
    'complexity_analyzing': 5,
    'complexity_complete': 12,
    'emotion_analyzing': 20,
    'emotion_complete': 30,
    'domain_analyzing': 40,
    'domain_complete': 50,
    'trigger_analyzing': 60,
    'trigger_complete': 70,
    'blueprint_retrieved': 72,
    'blueprint_skipped': 72,
    'web_search_analyzing': 75,
    'web_search_complete': 85,
    'auron_thinking': 90,
    'auron_complete': 95,
    'complete': 100
};

const SSE_STAGE_ICONS = {
    'analyzing': '⚙️',
    'complete': '✅',
    'error': '❌'
};

// Stage-specific particle behaviors for thinking panel
const STAGE_CONFIG = {
    'complexity_analyzing': {
        particleSpeed: 0.8,
        glowIntensity: 0.4,
        description: 'Measuring response depth...'
    },
    'emotion_analyzing': {
        particleSpeed: 1.0,
        glowIntensity: 0.5,
        description: 'Reading emotional undertones...'
    },
    'domain_analyzing': {
        particleSpeed: 1.2,
        glowIntensity: 0.6,
        description: 'Mapping knowledge terrain...'
    },
    'trigger_analyzing': {
        particleSpeed: 0.9,
        glowIntensity: 0.55,
        description: 'Identifying patterns...'
    },
    'web_search_analyzing': {
        particleSpeed: 1.5,
        glowIntensity: 0.7,
        description: 'Searching research papers...'
    },
    'auron_thinking': {
        particleSpeed: 0.6,
        glowIntensity: 0.8,
        description: 'Synthesizing response...'
    }
};
