import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        headers: {
            // 'Cross-Origin-Opener-Policy': 'same-origin',
            // 'Cross-Origin-Embedder-Policy': 'require-corp',
            // 'Cross-Origin-Resource-Policy': 'cross-origin'
        },
    },
    optimizeDeps: {
        exclude: ['@sqlite.org/sqlite-wasm'],
    },
});
