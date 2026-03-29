import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub Project Pages are served under /<repo>/; Vite must match or asset URLs 404. */
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base =
  process.env.GITHUB_PAGES === 'true' && repo ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
