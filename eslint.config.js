'use strict';

// ESLint flat config. The rules are the same as in the former .eslintrc,
// except that eslint-plugin-import is no longer used (see the PR that added this file).
// eslint-plugin-lodash still calls context methods that ESLint 10 removed, so
// fixupPluginRules from @eslint/compat adds those methods back for its rules.

const { fixupPluginRules } = require('@eslint/compat');
const js = require('@eslint/js');
const lodashPlugin = require('eslint-plugin-lodash');
const promise = require('eslint-plugin-promise');
const globals = require('globals');

const lodash = fixupPluginRules(lodashPlugin);

module.exports = [
	{
		ignores: ['coverage/', '.nyc_output/', 'node_modules/'],
	},
	js.configs.recommended,
	{
		plugins: {
			lodash,
			promise,
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'commonjs',
			globals: {
				...globals.node,
				...globals.mocha,
			},
		},
		rules: {
			...lodashPlugin.configs.recommended.rules,
			indent: ['error', 'tab', { MemberExpression: 'off' }],
			'no-trailing-spaces': 'error',
			// ESLint 9 changed the default of caughtErrors to 'all'. 'none' keeps the ESLint 6 behavior.
			'no-unused-vars': ['error', { caughtErrors: 'none' }],
			semi: ['error', 'always'],
			'promise/always-return': 'error',
			'promise/no-return-wrap': 'error',
			'promise/param-names': 'error',
			'promise/catch-or-return': 'error',
			'promise/no-native': 'off',
			'promise/no-nesting': 'off',
			'promise/no-promise-in-callback': 'warn',
			'promise/no-callback-in-promise': 'warn',
			'promise/avoid-new': 'warn',
			'lodash/import-scope': 'off',
			'lodash/preferred-alias': 'off',
			'lodash/prop-shorthand': 'off',
			'lodash/prefer-lodash-method': ['error', { ignoreObjects: ['BbPromise'] }],
		},
	},
];
