const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const fs = require('fs');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const settings = require('./webpack/settings');
const pageEditor = require('./webpack/pageEditor');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const GETTER_ROOT = '_static';
const HASH_DELIMITER = '-';

module.exports = [
    {
        context: path.join(__dirname, '/src/main/resources/assets'),
        entry: {
            'js/main': './js/main.ts',
            'page-editor/styles/main': './page-editor/styles/main.less',
            'styles/widgets/stats': './styles/widgets/stats.less'
        },
        externals: [
            {
                dompurify: 'DOMPurify',
                hasher: 'hasher',
                jquery: 'jQuery',
                lodash: '_',
                mousetrap: 'Mousetrap',
                'mousetrap/plugins/global-bind/mousetrap-global-bind': 'Mousetrap',
                q: 'Q',
                signals: 'signals'
            },
            function ({
                context,
                request,
                dependencyType,
                contextInfo: {
                    issuer,
                    // issuerLayer,
                    // compiler
                }
            }, callback) {
                if (request.startsWith('.')) {
                    return callback(); // Continue without externalizing the import
                }
                if (issuer.endsWith('.js')||issuer.endsWith('.ts')) {
                    if (
                        request.startsWith('@enonic/lib-admin-ui')
                        || request.startsWith('lib-contentstudio')
                        || request.startsWith('fine-uploader')
                        || request === 'jsondiffpatch'
                    ) {
                        // Continue without externalizing the import
                        return callback();
                    }
                    if (request.startsWith('@enonic/legacy-slickgrid')) {
                        // The external is a global variable called `Slick`.
                        return callback(null, 'Slick');
                    }
                    if (
                        request.startsWith('jquery-simulate')
                        || request.startsWith('jquery-ui')
                    ) {
                        // The external is a global variable called `jQuery`.
                        return callback(null, 'jQuery');
                    }
                }
                if (
                    issuer.endsWith('.less')
                ) {
                    // Continue without externalizing the import
                    return callback();
                }
                console.error('Main: Not externalizing unhandeled import', {
                    context,
                    request,
                    dependencyType,
                    issuer
                });
                return callback(); // Continue without externalizing the import
            }
        ],
        output: {
            path: path.join(__dirname, '/build/resources/main/assets'),
            filename: './[name].js',
            assetModuleFilename: './[file]'
        },
        resolve: {
            extensions: [
                '.ts', '.js',
                '.less', '.css'
            ],
            conditionNames: ['import', 'node', 'default']
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    enforce: 'pre',
                    use: ['source-map-loader'],
                    exclude: [
                        path.resolve(__dirname, 'node_modules/fine-uploader/'),
                    ],
                },
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'swc-loader',
                            options: {
                                ...swcConfig,
                                sourceMaps: isProd ? false : 'inline',
                                inlineSourcesContent: !isProd,
                            },
                        },
                    ],
                },
                {
                    test: /\.less$/,
                    use: [
                        {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../'}},
                        {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                        {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                        {loader: 'less-loader', options: {sourceMap: !isProd}},
                    ]
                }
            ]
        },
        optimization: {
            minimize: false,
            // minimizer: [
            //     new TerserPlugin({
            //         terserOptions: {
            //             keep_classnames: true,
            //             keep_fnames: true
            //         }
            //     })
            // ],
            // splitChunks: {
            //     chunks: 'all',
            //     cacheGroups: {
            //         default: false,
            //         defaultVendors: {
            //             test: /[\\/]node_modules[\\/]/,
            //             //test: /[\\/]node_modules[\\/](?!(@enonic[\\/].+|dompurify|lib-contentstudio.+|mousetrap|q))$/,
            //             reuseExistingChunk: true,
            //             minChunks: 1,
            //             priority: -10,
            //             filename: 'js/main.vendors.js'
            //         }
            //     }
            // }
        },
        plugins: [
            new ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.$': 'jquery',
                'window.jQuery': 'jquery'
            }),
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: './styles/[id].css'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {from: 'icons/fonts/icomoon-studio-app.*', to: 'page-editor/fonts/[file]'},
                    // {
                    //     from: path.join(__dirname, 'node_modules/@enonic/legacy-slickgrid/lib/*.js'),
                    //     to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/jquery/[name]${HASH_DELIMITER}[contenthash][ext]`
                    //     // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/jquery/[name][ext]`
                    // },
                    {
                        // from: path.join(__dirname, 'node_modules/@enonic/legacy-slickgrid/*.js'),
                        from: path.join(__dirname, 'node_modules/@enonic/legacy-slickgrid/index.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/slickgrid/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/slickgrid/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/dompurify/dist/*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/dompurify/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/dompurify/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/hasher/dist/js/*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/hasher/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/hasher/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/jquery/dist/*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/jquery/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/jquery/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/jquery-simulate/jquery.simulate.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/jquery-simulate/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/jquery-simulate/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/jquery-ui-dist/*.(css|js)'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/jquery-ui-dist/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/jquery-ui-dist/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/lodash/lodash*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/lodash/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/lodash/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/mousetrap/mousetrap*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/mousetrap/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/mousetrap/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/mousetrap/plugins/global-bind/mousetrap*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/mousetrap/plugins/global-bind/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/mousetrap/plugins/global-bind/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/q/*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/q/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/q/[name][ext]`
                    },
                    {
                        from: path.join(__dirname, 'node_modules/signals/dist/*.js'),
                        to: `${path.join(__dirname, 'build/resources/main', GETTER_ROOT)}/signals/[name]${HASH_DELIMITER}[contenthash][ext]`
                        // to: `${path.join(__dirname, 'build/resources/main', 'assets')}/signals/[name][ext]`
                    }
                ]
            }),
            new CircularDependencyPlugin({
                exclude: /a\.js|node_modules/,
                failOnError: true
            }),
            new WebpackAssetsManifest({
                output: path.join(__dirname, 'build/resources/main', GETTER_ROOT, 'manifest.json'),
                transform: (manifest) => {
                    const newManifest = {};
                    for (const [key, value] of Object.entries(manifest)) {
                        if (key.startsWith(`../${GETTER_ROOT}/`)) {
                            const newKey = key.replace(`../${GETTER_ROOT}/`, '');
                            const newValue = value.replace(`../${GETTER_ROOT}/`, '');
                            newManifest[newKey] = newValue;
                        }
                    }
                    return newManifest;
                }
            }),
        ],
        mode: isProd ? 'production' : 'development',
        devtool: isProd ? false : 'source-map',
        performance: {hints: false}
    },
    settings.settingsConfig(__dirname, isProd, swcConfig),
    pageEditor.pageEditorConfig(__dirname, isProd, swcConfig)
];
