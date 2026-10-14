import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages publishes this repository under /agentCrm/.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/agentCrm/' : '/',
})
