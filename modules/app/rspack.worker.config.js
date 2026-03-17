const {rspack} = require('@rspack/core');
const path = require('path');

// const isDev = process.env.NODE_ENV === 'development';
const isDev = true;

module.exports = {
    mode: isDev ? 'development' : 'production',

    entry: path.resolve(__dirname, 'src/main/resources/assets/shared-socket/index.ts'),

    output: {
        path: path.resolve(__dirname, 'build/resources/main/assets'),
        filename: 'shared-socket.js',
        library: {
            type: 'module'
        },
        module: true,
    },

    experiments: {
        outputModule: true,
    },

    devtool: isDev ? 'inline-source-map' : false,

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                        target: 'ES2023',
                    },
                },
            }
        ]
    },

    optimization: {
        minimize: true,
        minimizer: [new rspack.SwcJsMinimizerRspackPlugin()],
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },
};
