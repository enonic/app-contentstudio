module.exports = {
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 2019,
        'project': 'tsconfig.json',
        'tsconfigRootDir': '.',
    },
    'rules': {
        'max-len': ['error', {'code': 140, 'comments': 180}],
        'block-spacing': ['error', 'always'],
        'space-before-function-paren': ['error', {'anonymous': 'always', 'named': 'never'}],
        'space-in-parens': ['error', 'never'],
        'object-curly-spacing': ['error', 'never'],
        'lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
        'arrow-spacing': ['error', {'before': true, 'after': true}],
        'array-bracket-spacing': ['error', 'never'],
        'computed-property-spacing': ['error', 'never'],
        'template-curly-spacing': ['error', 'never'],
        'object-property-newline': ['off', {'allowMultiplePropertiesPerLine': true}],
        'quotes': ['error', 'single', {'avoidEscape': true}],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['off'],
        'semi': 'off',
        '@typescript-eslint/semi': ['error'],
        'no-control-regex': 'off',

        // Codacy linting
        'complexity': ['warn', {'max': 4}],

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
        '@typescript-eslint/no-unsafe-assignment': ['off'],
        '@typescript-eslint/no-unsafe-call': ['off'],
        '@typescript-eslint/no-floating-promises': ['off'],
        '@typescript-eslint/restrict-plus-operands': ['off'],
        '@typescript-eslint/no-implied-eval': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-empty-interface': ['off'],

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
