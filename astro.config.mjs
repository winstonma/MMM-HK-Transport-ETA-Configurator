// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	// Only use base path for production builds (GitHub Pages)
	base:
		process.env.NODE_ENV === 'production'
			? '/MMM-HK-Transport-ETA-Configurator/'
			: '/',
	publicDir: './public',
	outDir: './dist',
	integrations: [svelte()],
	vite: { plugins: [tailwindcss()] },
});
