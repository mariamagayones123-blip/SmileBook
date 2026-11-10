import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Local HTTPS using mkcert files. If the files are missing (like on Vercel), it falls back to the normal config.
const keyPath = './localhost-key.pem'
const certPath = './localhost.pem'
const https = fs.existsSync(keyPath) && fs.existsSync(certPath)
  ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  : undefined

export default defineConfig({
  plugins: [react()],
  server: { https },
})