const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'js/main': './js/main.ts',
        'lib/vendors': './lib/index.js',
        'styles/main': './styles/main.less',
        'lib/ckeditor/plugins/pasteModeSwitcher/plugin': './lib/ckeditor/plugins/pasteModeSwitcher/plugin.raw.js',
        'page-editor/js/editor': './js/page-editor.ts',
        'page-editor/lib/vendors': './page-editor/lib/index.js',
        'page-editor/styles/main': './page-editor/styles/main.less',
        // html editor css imported separately in the HTMLAreaBuilder for legacy mode
        'styles/html-editor': './styles/inputtype/text/htmlarea/html-editor.less'
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js',
        assetModuleFilename: './[file]'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css']
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
                test: /\.tsx?$/,
                use: [{loader: 'ts-loader', options: {configFile: 'tsconfig.json'}}]
            },
            {
                test: /\.less$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../'}},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ]
            },
            {
                test: /^((?!icomoon).)*\.(svg|png|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[base]'
                }
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    compress: {
                        drop_console: false
                    },
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
                    minChunks: 2,
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
                {from: 'icons/fonts/icomoon.*', to: 'page-editor/[file]'}
            ]
        }),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'eval-source-map',
    performance: {hints: false}
};
