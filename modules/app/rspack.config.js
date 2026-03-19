const {rspack} = require('@rspack/core');
const fs = require('fs');
const path = require('path');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));
// Remove `module` and `exclude` — Rspack handles module format and file filtering natively
const {module: _module, exclude: _exclude, ...swcOptions} = swcConfig;

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'js/main': './js/main.ts',
        'js/settings': './js/settings.ts',
        'page-editor/js/editor': './js/page-editor.ts',
        'styles/extensions/stats': './styles/extensions/stats.less'
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js',
        assetModuleFilename: './[file]'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.less', '.css'],
        conditionNames: ['import', 'node', 'default'],
        alias: {
            'preact': path.resolve(__dirname, 'node_modules/preact'),
            'preact/hooks': path.resolve(__dirname, 'node_modules/preact/hooks'),
            'react': path.resolve(__dirname, 'node_modules/preact/compat'),
            'react-dom': path.resolve(__dirname, 'node_modules/preact/compat'),
            'react/jsx-runtime': path.resolve(__dirname, 'node_modules/preact/jsx-runtime'),
            'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/preact/jsx-dev-runtime')
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'builtin:swc-loader',
                        options: {
                            ...swcOptions,
                            sourceMaps: isProd ? false : 'inline',
                            inlineSourcesContent: !isProd,
                        },
                    },
                ],
            },
            {
                test: /\.(?:less|css)$/,
                use: [
                    {loader: rspack.CssExtractRspackPlugin.loader},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ],
                type: 'javascript/auto',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext][query]'
                }
            }
        ]
    },
    optimization: {
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin({
                minimizerOptions: {
                    mangle: {
                        keepClassNames: true,
                        keepFnNames: true,
                    },
                },
            })
        ],
    },
    plugins: [
        new rspack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
        }),
        new rspack.CssExtractRspackPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new rspack.CopyRspackPlugin({
            patterns: [
                {from: 'icons/fonts/icomoon-studio-app.*', to: 'page-editor/fonts/[name][ext]'}
            ]
        }),
        new rspack.CircularDependencyRspackPlugin({
            exclude: /node_modules|v6[\\/]features[\\/]shared[\\/]form[\\/]/,
            failOnError: true
        }),
    ],
    amd: {},
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    performance: {hints: false}
};
