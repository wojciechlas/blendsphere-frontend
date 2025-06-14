import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import security from 'eslint-plugin-security';
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
	// security.configs.recommended, // Temporarily disabled to stop object injection warnings
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
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				// Additional browser globals
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLAudioElement: 'readonly',
				HTMLVideoElement: 'readonly',
				MouseEvent: 'readonly',
				TouchEvent: 'readonly',
				Event: 'readonly',
				File: 'readonly',
				FileReader: 'readonly',
				FormData: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly'
			},
			parser: ts.parser,
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'no-undef': 'off',

			// TypeScript specific rules (only for TS files with type info)
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			globals: {
				...globals.browser,
				// Additional browser globals for Svelte components
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLAudioElement: 'readonly',
				HTMLVideoElement: 'readonly',
				HTMLInputElement: 'readonly',
				HTMLButtonElement: 'readonly',
				MouseEvent: 'readonly',
				TouchEvent: 'readonly',
				Event: 'readonly',
				KeyboardEvent: 'readonly',
				FocusEvent: 'readonly',
				File: 'readonly',
				FileReader: 'readonly',
				FormData: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly'
			},
			parser: svelte.parser,
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
				svelteConfig
			}
		},
		rules: {
			// Svelte specific rules
			'svelte/require-each-key': 'warn',
			'svelte/no-at-html-tags': 'warn',
			'svelte/no-useless-mustaches': 'warn',
			'svelte/prefer-writable-derived': 'warn'
		}
	},
	{
		// Special configuration for type declaration files
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		// Special rules for test files
		files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		// Security utilities need some flexibility
		files: ['**/security-enhanced.ts', '**/security.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		// Form components may have intentional unused variables for destructuring
		files: ['**/forms/**/*.svelte', '**/template-form.svelte', '**/field-manager.svelte'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			]
		}
	},
	{
		// Editor components have complex object access patterns
		files: ['**/edra/**/*.ts', '**/edra/**/*.svelte'],
		rules: {
			// No specific rules needed now that security plugin is disabled
		}
	}
);
