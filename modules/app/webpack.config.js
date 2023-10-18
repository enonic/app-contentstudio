const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const fs = require('fs');
const WebpackAssetsManifest = require('webpack-assets-manifest');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'js/main': './js/main.ts',
        'js/settings': './js/settings.ts',
        'page-editor/js/editor': './js/page-editor.ts',
        'page-editor/styles/main': './page-editor/styles/main.less',
        'styles/widgets/stats': './styles/widgets/stats.less'
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js',
        assetModuleFilename: './[file]'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css'],
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
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                default: false,
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    reuseExistingChunk: true,
                    minChunks: 3,
                    priority: -10,
                    filename: 'js/vendors.main~editor.js'
                }
            }
        }
    },
    plugins: [
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: 'icons/fonts/icomoon-studio-app.*', to: 'page-editor/fonts/[file]'},
                {
                    from: path.join(__dirname, 'node_modules/jquery/dist/*.js'),
                    to: `${path.join(__dirname, 'build/resources/main/static')}/jquery/[name].[contenthash][ext]`
                },
                {
                    from: path.join(__dirname, 'node_modules/jquery-ui-dist/*.(css|js)'),
                    to: `${path.join(__dirname, 'build/resources/main/static')}/jquery-ui-dist/[name].[contenthash][ext]`
                }
            ]
        }),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
        new WebpackAssetsManifest({
            output: path.join(__dirname, 'build/resources/main/static/manifest.json'),
            transform: (manifest) => {
                const newManifest = {};
                for (const [key, value] of Object.entries(manifest)) {
                    if (key.startsWith('../static/')) {
                        const newKey = key.replace('../static/', '');
                        const newValue = value.replace('../static/', '');
                        newManifest[newKey] = newValue;
                    }
                }
                return newManifest;
            }
        })
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    performance: {hints: false}
};
