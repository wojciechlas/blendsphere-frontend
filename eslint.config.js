import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		// Global ignores
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'coverage/',
			'docs/',
			'static/',
			'node_modules/',
			'*.config.js',
			'*.config.ts',
			'vitest-setup-client.ts',
			'template-form-original.svelte'
		]
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-undef': 'off',
			// TypeScript specific rules
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			// Svelte specific rules
			'svelte/require-each-key': 'warn',
			'svelte/no-at-html-tags': 'warn',
			'svelte/no-useless-mustaches': 'warn',
			'svelte/prefer-writable-derived': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
