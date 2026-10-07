import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

/**
 * Forbids files in `src/lib/<layer>` from importing the given outer layers
 * (via `$lib/...` or relative paths) and the given packages.
 */
function layerBoundary(layer, forbiddenLayers, forbiddenPackages = []) {
	const message = `The ${layer} layer must not depend on: ${[...forbiddenLayers, ...forbiddenPackages].join(', ')}.`;
	const patterns = [
		{
			regex: `^(\\$lib/|(\\.\\.?/)+)(.*/)?(${forbiddenLayers.join('|')})(/|$)`,
			message
		}
	];
	if (forbiddenPackages.length > 0) patterns.push({ group: forbiddenPackages, message });

	return {
		files: [`src/lib/${layer}/**`],
		rules: { 'no-restricted-imports': ['error', { patterns }] }
	};
}

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	// Clean architecture: dependencies may only point inwards
	// (infra -> adapters -> application -> domain).
	layerBoundary('domain', ['application', 'adapters', 'infra'], ['nats.ws', 'svelte']),
	layerBoundary('application', ['adapters', 'infra'], ['nats.ws', 'svelte']),
	layerBoundary('adapters', ['infra']),
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
