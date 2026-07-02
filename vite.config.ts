import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so Capacitor WebView resolves assets correctly.
  base: './',
  plugins: [react()],
  // Allow access via LAN IP and tunnel hostnames (Vite blocks unknown hosts by default).
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
})
