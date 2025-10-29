# Auron Chat UI

Frontend interface for Auron AI - Neural Syndicate's conversational AI assistant powered by Combryth Engine.

## 🎨 Features

- **Authentication**: Logto OAuth2 + OIDC integration
- **Chat Interface**: Real-time conversation with Auron
- **Reflections Tab**: Browse past conversations stored on BunnyCDN
- **Neural Music Profile**: Dynamic user engagement tracking
- **Security**: API resource-based access tokens with audience validation

## 🔐 Authentication Architecture

- **Logto Endpoint**: https://auth.neuralsyndicate.com
- **API Resource**: http://100.123.105.115:8000 (Combryth Engine)
- **Token Type**: OAuth2 Access Tokens (with `read:conversations`, `write:conversations` scopes)
- **BunnyCDN**: Signed URLs with IP validation for conversation retrieval

## 🚀 Deployment

Automatically deployed to BunnyCDN via GitHub Actions on every push to `main`:

- **Frontend URL**: https://neural-neural-test-test.b-cdn.net/public/
- **Storage Zone**: combryth-conversations-backbone/public/
- **CDN Cache**: Auto-purged on deployment

## 📁 Project Structure

```
auron-chat-ui/
├── index.html           # Landing page
├── login.html           # Logto sign-in
├── register.html        # Logto registration
├── callback.html        # OAuth callback handler
├── dashboard.html       # Main app (Chat + Reflections + Profile)
├── logto-config.js      # Logto SDK configuration
└── .github/
    └── workflows/
        └── deploy.yml   # BunnyCDN deployment automation
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript + React (via CDN)
- **Styling**: TailwindCSS
- **Auth**: Logto Browser SDK
- **CDN**: BunnyCDN Edge Storage
- **Deployment**: GitHub Actions

## 🔧 Local Development

1. Edit files locally
2. Test by serving via local server or directly opening HTML
3. Commit changes: `git commit -m "your message"`
4. Push to GitHub: `git push origin main`
5. GitHub Actions automatically deploys to BunnyCDN ✅

## 📊 Backend Integration

- **Combryth Engine**: http://100.123.105.115:8000
- **Endpoints**:
  - `POST /chat` - Send message to Auron
  - `GET /conversations` - List user conversations
  - `POST /get-conversation-url` - Get signed BunnyCDN URL
  - `POST /save-session` - Save conversation to BunnyCDN

## 🎯 Environment

- **Production Frontend**: https://neural-neural-test-test.b-cdn.net/public/
- **Logto Admin**: https://admin.neuralsyndicate.com
- **Backend API**: Tailscale network (M4 Pro)

---

**Neural Syndicate** | Auron AI Assistant
