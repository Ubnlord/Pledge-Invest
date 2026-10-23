import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/Pledge-Invest/',
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            maxParallelFileOps: 128,
        },
    },
});
