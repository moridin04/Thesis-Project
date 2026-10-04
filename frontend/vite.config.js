// Vite setup for the AGOS frontend.
// The React plugin compiles JSX. The Tailwind plugin compiles index.css.
// API calls use the base URL in the service code. Nothing is proxied here.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
