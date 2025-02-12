const baseConfig = require('@enonic/eslint-config');
const { plugin: tsPlugin } = require('typescript-eslint');
const globals = require('globals');

module.exports = [
    ...baseConfig,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.es2023
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
            'comma-dangle': ['error', 'always-multiline'],
            '@typescript-eslint/member-ordering': ['error'],
            'spaced-comment': ['error', 'always', {'exceptions': ['-', '+']}],
            '@typescript-eslint/no-use-before-define': ['error', {'functions': false, 'classes': true}],
            '@typescript-eslint/unbound-method': ['error', {ignoreStatic: true}],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        }
    }
];
