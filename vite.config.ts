import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  plugins: [
    sveltekit({
      adapter: adapter(),
      preprocess: vitePreprocess(),
      csrf: {
        trustedOrigins: ['*']
      }
    })
  ]
});
