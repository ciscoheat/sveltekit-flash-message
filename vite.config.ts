import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      preprocess: sveltePreprocess(),
      csrf: {
        trustedOrigins: ['*']
      }
    })
  ]
});
