import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	// Add this:
	ssr: {
		noExternal: ['sveltekit-flash-message']
	}
};

export default config;
