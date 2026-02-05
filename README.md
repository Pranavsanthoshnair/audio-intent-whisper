# Offline-First Audio Intent Analysis System

## 🎯 Checkpoint 1: Architecture Foundation

This checkpoint establishes a **solid offline-first foundation** with local backend service, frontend-backend communication, and session management. **No AI or audio processing** is implemented yet - this is purely about architecture and connectivity.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Running the Application

**Option 1: Run Everything Together (Recommended)**
```bash
npm run dev:full
```

**Option 2: Run Separately**

Terminal 1 - Backend:
```bash
npm run backend
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:8080 (or http://localhost:5173)
- **Backend API**: http://localhost:3001

---

## 📋 Features (Checkpoint 1)

### ✅ Implemented
- Local Node.js backend service (Express)
- Frontend-backend handshake and connectivity detection
- Browser online/offline state detection
- Session initialization and management
- IndexedDB for offline data persistence
- Backend status panel in UI
- Offline mode banner
- Mock audio processing flow

### ❌ Not Implemented (Future Checkpoints)
- Audio processing (Whisper integration)
- Speech-to-text transcription
- Language translation
- Threat detection AI
- Real analysis results

---

## 🧪 Testing the System

### 1. Verify Backend Connection
1. Open the app in your browser
2. Look at the **Backend Status Panel** in the right sidebar
3. Should show:
   - Local Engine: **Connected** ✅
   - Internet: **Online**
   - Mode: **offline-first**

### 2. Test Offline Mode
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. **Offline Mode Banner** should appear at the top
5. Backend should still show "Connected" (it's local!)

### 3. Initialize a Session
1. Click "Start Recording" or "Upload Audio"
2. Record/select an audio file
3. Click "Initialize Session & Submit"
4. Check browser console for session ID
5. Open DevTools → Application → IndexedDB → `OfflineAudioIntentDB`
6. Verify session is stored

### 4. Test Backend Disconnection
1. Stop the backend service (Ctrl+C)
2. Wait ~10 seconds
3. Backend status should update to "Not Connected"
4. Try initializing a session
5. Should create local fallback session

---

## 📁 Project Structure

```
audio-intent-whisper-main/
├── backend/
│   ├── server.js              # Express backend service
│   ├── package.json           # Backend dependencies
│   └── .gitignore
├── src/
│   ├── services/
│   │   ├── offlineBackendService.ts    # Backend API client
│   │   └── offlineStorage.ts           # IndexedDB wrapper
│   ├── hooks/
│   │   ├── useBackendStatus.ts         # Backend connectivity
│   │   └── useOfflineDetection.ts      # Browser online/offline
│   ├── contexts/
│   │   └── OfflineContext.tsx          # Global offline state
│   ├── components/
│   │   ├── BackendStatusPanel.tsx      # Status display
│   │   ├── OfflineModeBanner.tsx       # Offline indicator
│   │   ├── AudioInput.tsx              # Audio input (updated)
│   │   └── ... (existing components)
│   ├── pages/
│   │   └── Index.tsx                   # Main page (updated)
│   └── App.tsx                         # App root (updated)
└── package.json                        # Frontend dependencies
```

---

## 🔌 Backend API Endpoints

### `GET /health`
Health check with backend status
```json
{
  "status": "online",
  "mode": "offline-first",
  "engine": "local",
  "uptime": 123,
  "timestamp": "2026-02-05T06:03:34.000Z"
}
```

### `GET /api/ping`
Quick connectivity test
```json
{
  "status": "ok",
  "timestamp": 1770271883522
}
```

### `POST /api/init-session`
Initialize new session
```json
// Request
{
  "inputType": "record" | "upload"
}

// Response
{
  "caseId": "case-a1b2c3d4",
  "inputType": "record",
  "mode": "offline",
  "engine": "local",
  "status": "initialized",
  "createdAt": "2026-02-05T06:03:34.000Z"
}
```

### `GET /api/session/:caseId`
Get session details

### `GET /api/sessions`
List all sessions (debugging)

---

## 💾 IndexedDB Schema

**Database**: `OfflineAudioIntentDB`  
**Object Store**: `sessions`

```typescript
{
  caseId: string;              // Unique session ID
  inputType: 'record' | 'upload';
  createdAt: string;           // ISO timestamp
  status: 'initialized' | 'processing' | 'completed' | 'error';
  mode?: string;               // 'offline' or 'offline-first'
  engine?: string;             // 'local' or 'local-fallback'
}
```

---

## 🎨 UI Components

### Backend Status Panel
- Real-time connection monitoring (polls every 10s)
- Visual indicators (green ✓ / red ✗)
- Manual refresh button
- Shows backend uptime when connected

### Offline Mode Banner
- Only appears when browser is offline
- Positive messaging (offline is a feature!)
- Blue background with green checkmark

### Audio Input
- Record or upload audio
- Initializes session with backend
- Stores session in IndexedDB
- Fallback to local session if backend unavailable

---

## 🛠️ npm Scripts

```json
{
  "dev": "vite",                    // Start frontend only
  "backend": "cd backend && node server.js",  // Start backend only
  "dev:full": "concurrently ...",   // Start both frontend + backend
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 📝 Important Notes

### This is Checkpoint 1
- **Focus**: Architecture and connectivity
- **No AI**: Audio processing mocked
- **No Analysis**: Returns mock results
- **Session Management**: Fully functional
- **Offline Support**: Fully functional

### Future Checkpoints
- **Checkpoint 2**: Audio recording and storage (Completed)
- **Checkpoint 3**: Offline Speech-to-Text with language detection (Completed)
- **Checkpoint 3**: AI analysis and threat detection

### Mock Behavior
- Audio submission triggers 2s delay
- Returns mock transcription
- Session ID is real and stored
- No actual audio analysis

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure you're in the backend directory
cd backend
npm install
node server.js
```

### Frontend shows "Not Connected"
1. Check if backend is running on port 3001
2. Check browser console for errors
3. Try manual refresh in status panel

### Port already in use
```bash
# Kill process on port 3001 (backend)
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill process on port 8080/5173 (frontend)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### IndexedDB not working
1. Open DevTools → Application → IndexedDB
2. Delete `OfflineAudioIntentDB` if corrupted
3. Refresh page to recreate

---

## 📚 Documentation

- [Implementation Plan](./brain/implementation_plan.md)
- [Walkthrough](./brain/walkthrough.md)
- [Task Checklist](./brain/task.md)

---

## ✅ Checkpoint 1 Success Criteria

- [x] Backend service runs offline
- [x] Frontend connects to backend
- [x] Offline mode detected and displayed
- [x] Sessions can be initialized
- [x] Sessions stored in IndexedDB
- [x] UI shows connection status
- [x] Fallback works when backend is down
- [x] No AI or audio processing (as required)

---

## 🎉 Checkpoint 3 Complete!

**Implemented Features:**
- ✅ Offline STT with mock engine
- ✅ Multi-language support (Hindi, Urdu, Kashmiri, English)
- ✅ Confidence scoring and language detection
- ✅ Transcript aggregation and storage
- ✅ Export with transcript data

**Ready for Checkpoint 4:** Translation and Threat Analysis

The offline-first foundation is complete and ready for audio processing integration in the next checkpoint.
