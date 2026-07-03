import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // מאפשר גישה לקונטיינר מחוץ לדוקר
    port: 5173,      // הפורט הרגיל של Vite
    watch: {
      usePolling: true, // 👈 הפתרון! מכריח את Vite לבדוק שינויי קבצים במחשב שלך
    },
  },
})