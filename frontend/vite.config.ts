import { defineConfig } from 'vite'; // Provides the configuration schema for better IDE autocompletion
import react from '@vitejs/plugin-react'; // Essential plugin to support React (JSX and Fast Refresh)
import viteTsconfigPaths from 'vite-tsconfig-paths'; // Allows Vite to recognize alias paths from your tsconfig.json

// https://vitejs.dev/config/
export default defineConfig({
    // plugins: An array of tools that extend Vite's core functionality
    plugins: [
        react(), // Enables React-specific features like Hot Module Replacement (HMR)
        viteTsconfigPaths() // Ensures imports like '@/components/Button' work correctly
    ],

    // server: Configures the local development environment
    server: {
        port: 3000, // Changes the default port from 5173 to 3000 (matches the old Create React App default)
        open: true  // Optional: Automatically opens your browser when you run 'npm run dev'
    },

    // build: Configures how the project is compiled for production
    build: {
        outDir: 'build' // Optional: Changes output folder from 'dist' to 'build' to match old CRA behavior
    }
});