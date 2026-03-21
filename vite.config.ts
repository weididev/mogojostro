import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // এটি অবশ্যই থাকতে হবে যাতে সাদা স্ক্রিন না আসে
})
