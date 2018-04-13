module.exports = {
    extends: ['airbnb-base/legacy', 'prettier'],
    plugins: ['prettier'],
    rules: {
        'comma-dangle': ['error', 'never'],
        'no-underscore-dangle': ['off'],
        'func-names': ['off'],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'vars-on-top': 'off',
        'global-require': 'off',
        'no-use-before-define': ['error', { functions: false }],
        'linebreak-style': ['off'],
        'prettier/prettier': [
            'error',
            {
                printWidth: 80,
                singleQuote: true,
                tabWidth: 4
            }
        ]
    },
    env: {
        node: true
    },
    globals: {
        Java: false,
        resolve: false,
        log: true,
        env: true,
        app: true
    }
};
