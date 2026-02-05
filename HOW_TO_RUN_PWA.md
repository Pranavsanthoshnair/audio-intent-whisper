# How to Run the Offline Audio Intent PWA

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd backend
node server.js
```

You should see:
```
╔════════════════════════════════════════════════╗
║   OFFLINE BACKEND ENGINE                       ║
╚════════════════════════════════════════════════╝

✓ Server running on http://localhost:3001
✓ Mode: Offline-First
✓ CORS enabled for: http://localhost:5173
```

### 2. Start the Frontend (in a new terminal)

```bash
# From the project root
npm run dev
```

You should see:
```
VITE v5.4.19  ready in 544 ms

➜  Local:   http://localhost:8080/
➜  Network: http://192.168.x.x:8080/
```

**Note:** The port might be 5173 or 8080 depending on availability.

### 3. Open in Browser

Navigate to: **http://localhost:8080** (or the port shown in your terminal)

---

## 📱 Installing as PWA

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the **install icon** (⊕) in the address bar
3. Click it and select **"Install"**
4. The app will open in a standalone window
5. You can now launch it from your desktop/start menu

**Alternative:**
- Click the three dots menu (⋮)
- Select **"Install Offline Audio Intent..."**

### Mobile (Android)

1. Open the app in Chrome
2. Tap the three dots menu (⋮)
3. Select **"Add to Home screen"**
4. Tap **"Add"**
5. The app icon will appear on your home screen

### Mobile (iOS)

1. Open the app in Safari
2. Tap the **Share** button (□↑)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon will appear on your home screen

---

## 🧪 Testing Offline Capability

### Test 1: Offline Reload

1. Open the app in your browser
2. Open DevTools (F12)
3. Go to **Application** tab → **Service Workers**
4. Check **"Offline"** checkbox
5. Refresh the page (F5)
6. ✅ The app should still load!

### Test 2: Backend Disconnection

1. Stop the backend server (Ctrl+C in backend terminal)
2. The app should show **"Backend Offline"** banner
3. You can still:
   - View the UI
   - Access IndexedDB data
   - Export sessions
4. Restart backend to reconnect

### Test 3: Audio Recording Offline

1. Ensure backend is running
2. Create a new session (Record mode)
3. Record audio
4. Stop the backend
5. ✅ Audio should still be playable from IndexedDB
6. ✅ Export should still work

---

## 🔧 Development Commands

### Run Both Frontend + Backend Together

```bash
npm run dev:full
```

This runs both servers concurrently:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

### Build for Production

```bash
npm run build
```

Output: `dist/` folder with optimized static files

### Preview Production Build

```bash
npm run build
npm run preview
```

---

## 🗂️ Project Structure

```
audio-intent-whisper-main/
├── backend/
│   ├── server.js          # Express backend (port 3001)
│   └── package.json
├── src/
│   ├── components/        # UI components
│   ├── services/          # Business logic
│   ├── contexts/          # React contexts
│   └── pages/             # Page components
├── public/
│   ├── manifest.json      # PWA manifest
│   └── service-worker.js  # Offline caching
└── package.json
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 8080 is already in use":

```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or just use a different port
npm run dev -- --port 5174
```

### Backend Not Connecting

1. Check backend is running: http://localhost:3001/health
2. Check CORS settings in `backend/server.js`
3. Ensure frontend port matches CORS origin

### Service Worker Not Updating

1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Click **"Unregister"**
4. Hard refresh (Ctrl+Shift+R)

### IndexedDB Not Working

1. Open DevTools (F12)
2. Go to **Application** → **Storage** → **IndexedDB**
3. Check if `OfflineAudioIntentDB` exists
4. If corrupted, delete it and refresh

---

## 📊 Checking PWA Status

### In Chrome DevTools

1. Press F12
2. Go to **Application** tab
3. Check:
   - **Manifest**: Should show app details
   - **Service Workers**: Should show "activated and running"
   - **Storage**: IndexedDB should have your data

### Lighthouse Audit

1. Press F12
2. Go to **Lighthouse** tab
3. Select **"Progressive Web App"**
4. Click **"Generate report"**
5. Check PWA score (should be 90+)

---

## 🎯 Next Steps

1. **Test Recording**: Record audio and verify it saves
2. **Test Upload**: Upload a WAV/MP3 file
3. **Test Playback**: Play audio from IndexedDB
4. **Test Export**: Download JSON/CSV
5. **Test Offline**: Disconnect and verify functionality
6. **Install PWA**: Install as desktop/mobile app

---

## 📝 Current Limitations

- ❌ No speech-to-text (Checkpoint 3)
- ❌ No translation (Checkpoint 3)
- ❌ No threat detection (Checkpoint 3)
- ✅ Audio recording works
- ✅ Audio upload works
- ✅ Audio playback works
- ✅ Export works (with mock data)
- ✅ Offline mode works

---

## 🆘 Need Help?

Check the console for errors:
1. Press F12
2. Go to **Console** tab
3. Look for red error messages
4. Check **Network** tab for failed requests

Common issues:
- Backend not running → Start with `node server.js`
- CORS errors → Check backend CORS settings
- Port conflicts → Use different port
- Service worker issues → Unregister and refresh
