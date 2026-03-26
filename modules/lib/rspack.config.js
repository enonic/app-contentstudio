const {rspack} = require('@rspack/core');
const fs = require('fs');
const path = require('path');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));
// Remove `module` and `exclude` — Rspack handles module format and file filtering natively
const {module: _module, exclude: _exclude, ...swcOptions} = swcConfig;

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    cache: true,
    experiments: {
        cache: {
            type: 'persistent',
            buildDependencies: [__filename],
            storage: {
                type: 'filesystem',
                directory: path.resolve(__dirname, 'node_modules/.cache/rspack'),
            },
        },
    },
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'styles/contentlib': './styles/main.less',
        'lib/ckeditor/plugins/pasteModeSwitcher/plugin': './lib/ckeditor/plugins/pasteModeSwitcher/plugin.raw.js',
        'lib/ckeditor/plugins/findAndReplace/plugin': './lib/ckeditor/plugins/findAndReplace/plugin.ts',
        // html editor css imported separately in the HTMLAreaBuilder for legacy mode
        'styles/html-editor': './styles/inputtype/text/htmlarea/html-editor.less',
        'lib/ckeditor': ['./lib/ckepath.js', './lib/ckeditor/ckeditor.js']
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js'
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
                    {loader: rspack.CssExtractRspackPlugin.loader, options: {publicPath: '../'}},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ],
                type: 'javascript/auto',
            },
            {
                test: /^((?!icomoon-studio-lib|flag-icons).)*\.(svg|png|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            },
            {
                test: /^.*flag-icons.*(flags).*(1x1|4x3).*\.svg$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/flags/[name][ext]'
                }
            },
            {
                test: /\.(woff|woff2)$/i,
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
                // Exclude pre-built CKEditor — already minified, re-minimizing
                // breaks it (SWC adds "use strict" + mangles names into collisions)
                exclude: /ckeditor\.js$/,
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
        new rspack.CircularDependencyRspackPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
    ],
    amd: {},
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    performance: {hints: false}
};
