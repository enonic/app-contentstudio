module.exports = {
    extends: '@enonic/eslint-config',
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    'rules': {
        'new-cap': ['warn', {'capIsNewExceptions': ['Q']}],
        // TODO: Remove rules, during the refactoring
        // === DEFAULT RULES ===
        'prefer-const': ['off'],
        'no-plusplus': ['off'],
        'no-extra-boolean-cast': ['off'],
        'no-prototype-builtins': ['off'],
        'no-useless-escape': ['off'],
        'no-empty-pattern': ['off'],
        '@typescript-eslint/no-unsafe-member-access': ['off'],
        '@typescript-eslint/no-inferrable-types': ['off'],
        '@typescript-eslint/ban-types': ['off'],
        '@typescript-eslint/no-unsafe-return': ['off'],
        '@typescript-eslint/no-unsafe-argument': ['off'],
        '@typescript-eslint/no-unsafe-assignment': ['off'],
        '@typescript-eslint/no-unsafe-call': ['off'],
        '@typescript-eslint/no-floating-promises': ['off'],
        '@typescript-eslint/restrict-plus-operands': ['off'],
        '@typescript-eslint/no-implied-eval': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-empty-interface': ['off'],
        '@typescript-eslint/restrict-template-expressions': ['off'],

        // === CUSTOM RULES ===

        // '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
        '@typescript-eslint/explicit-function-return-type': ['off'],

        // 'comma-dangle': ['error', 'always-multiline'],
        'comma-dangle': ['off'],

        // '@typescript-eslint/member-ordering': ['error'],
        '@typescript-eslint/member-ordering': ['off'],

        // 'spaced-comment': ['error', 'always', {'exceptions': ['-', '+']}],
        'spaced-comment': ['off'],

        // '@typescript-eslint/no-use-before-define': ['error', {'functions': false, 'classes': true}],
        '@typescript-eslint/no-use-before-define': ['off'],

        // '@typescript-eslint/unbound-method': ['error', {ignoreStatic: true}],
        '@typescript-eslint/unbound-method': ['off'],
    },
    'env': {
        'browser': true,
        'es6': true,
    }
};
