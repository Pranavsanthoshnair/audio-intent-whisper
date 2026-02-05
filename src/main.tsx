import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, setupInstallPrompt } from "@/utils/registerServiceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if (import.meta.env.PROD) {
    registerServiceWorker().then((registered) => {
        if (registered) {
            console.log('✓ PWA service worker registered');
            setupInstallPrompt();
        }
    });
} else {
    console.log('ℹ Service worker disabled in development mode');
}
