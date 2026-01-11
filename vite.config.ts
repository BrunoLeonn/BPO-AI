
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process explicitly to resolve type issues in environments with restricted global types
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (do .env ou do Netlify)
  // Use process.cwd() to correctly identify the project root for loadEnv
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Mapeamento exato solicitado para produção
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
