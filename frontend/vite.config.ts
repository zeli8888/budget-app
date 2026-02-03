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
        port: 3000, // Optional: The port to run the development server on
        open: true  // Optional: Automatically opens your browser when you run 'npm run dev'
    },
});