import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  // আপনার গিটহাব রিপোজিটরির নাম যদি "mogojostro" হয়, তাহলে নিচের লাইনটি দিন:
  base: '/আপনার-রিপোজিটরির-নাম/', 
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
