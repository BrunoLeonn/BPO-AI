
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente, incluindo as sem prefixo VITE_ (comum no Netlify)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      /**
       * Mapeamento definitivo para produção:
       * Prioriza GEMINI_API_KEY (Netlify), depois tenta VITE_GEMINI_API_KEY 
       * e cai para uma string vazia se nada for encontrado.
       */
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
