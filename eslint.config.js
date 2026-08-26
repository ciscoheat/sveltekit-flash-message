import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
// @ts-expect-error eslint-plugin-dci-lint does not publish type declarations.
import dci from 'eslint-plugin-dci-lint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: [
      '.DS_Store',
      'node_modules/',
      'build/',
      '.svelte-kit/',
      'package/',
      'dist/',
      '.env',
      '.env.*',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock'
    ]
  },
  ...(Array.isArray(tseslint.configs['flat/recommended'])
    ? tseslint.configs['flat/recommended']
    : [tseslint.configs['flat/recommended']]),
  ...(Array.isArray(svelte.configs['flat/recommended'])
    ? svelte.configs['flat/recommended']
    : [svelte.configs['flat/recommended']]),
  ...(Array.isArray(dci.configs.recommended) ? dci.configs.recommended : [dci.configs.recommended]),
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser
      }
    }
  },
  {
    files: ['**/*.svelte.js', '**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser
    }
  },
  {
    files: ['src/lib/client.svelte.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'dci-lint/grouped-rolemethods': 'off',
      'dci-lint/private-role-access': 'off'
    }
  },
  {
    files: ['src/lib/flashMessage.ts', 'src/lib/server.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
