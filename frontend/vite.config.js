import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        recordedSessions: resolve(__dirname, 'recorded-sessions.html'),
        liveSessions: resolve(__dirname, 'live-sessions.html'),
        assignments: resolve(__dirname, 'assignments.html'),
        quizzes: resolve(__dirname, 'quizzes.html'),
        analytics: resolve(__dirname, 'analytics.html'),
      },
    },
  },
});
