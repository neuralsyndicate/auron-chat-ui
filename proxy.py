#!/usr/bin/env python3
"""
Simple proxy server to bypass CORS restrictions
Forwards requests to Datacrunch combryth-engine
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Datacrunch endpoint
COMBRYTH_ENDPOINT = "https://containers.datacrunch.io/combryth-engine"
BEARER_TOKEN = "dc_d220020b4f41112719574b8e5509aceef75aca9a197b98cd8ba06c0cf1b307dd59096c36087ce0bc340867fab88cd91762e5c4460de87531f05460336ee8411c54e11cf0289f1d4639a0da949eabdcc7d961faaa0b8ca575565f7f414c813d704392da2d54a8e2d40d6391e1adf6b0a685f21731009de69939cd7fcf7992f160"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health():
    """Proxy health check to Datacrunch"""
    try:
        response = requests.get(
            f"{COMBRYTH_ENDPOINT}/health",
            headers={"Authorization": f"Bearer {BEARER_TOKEN}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"error": str(e)}), 503

@app.route('/chat', methods=['POST'])
def chat():
    """Proxy chat request to Datacrunch"""
    try:
        data = request.get_json()

        logger.info(f"Proxying chat request for user: {data.get('user_id')}")

        response = requests.post(
            f"{COMBRYTH_ENDPOINT}/chat",
            json=data,
            headers={
                "Authorization": f"Bearer {BEARER_TOKEN}",
                "Content-Type": "application/json"
            },
            timeout=60
        )

        return jsonify(response.json()), response.status_code

    except requests.exceptions.Timeout:
        logger.error("Request timeout")
        return jsonify({"error": "Request timeout"}), 504
    except Exception as e:
        logger.error(f"Chat proxy failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "Auron Chat Proxy",
        "status": "running",
        "proxying_to": COMBRYTH_ENDPOINT
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8889, debug=False)
