import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// Development and production server configuration
	server: {
		port: parseInt(process.env.PORT || '3000'),
		host: process.env.HOST === 'localhost' ? 'localhost' : true,
		strictPort: false, // If port is taken, try next available
		// Security headers
		headers: {
			'X-Frame-Options': 'DENY',
			'X-Content-Type-Options': 'nosniff'
		}
	},

	// Preview server configuration (for production preview)
	preview: {
		port: parseInt(process.env.PORT || '4173'),
		host: process.env.HOST === 'localhost' ? 'localhost' : true,
		strictPort: false
	},

	build: {
		// Production build security
		sourcemap: false, // Don't expose source maps in production
		minify: true,
		rollupOptions: {
			external: ['fs', 'path', 'os'] // Prevent Node.js modules in client bundle
		}
	},
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
