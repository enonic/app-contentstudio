const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
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
        filename: './[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{loader: 'ts-loader', options: {configFile: 'tsconfig.build.json'}}]
            },
            {
                test: /\.less$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../', hmr: !isProd}},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ]
            },
            {
                test: /\.(eot|woff|woff2|ttf)$|icomoon.svg/,
                use: 'file-loader?name=fonts/[name].[ext]'
            },
            {
                test: /^((?!icomoon).)*\.(svg|png|jpg|gif)$/,
                use: 'file-loader?name=img/[name].[ext]'
            }
        ]
    },
    performance: {
        hints: false
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: !isProd,
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
            name(module, chunks, cacheGroupKey) {
                const allChunksNames = chunks.map((item) => item.name.split('/').reduceRight(name => name)).join('~');
                return `js/${cacheGroupKey}.${allChunksNames}`;
            },
            cacheGroups: {
                default: false,
                common: {
                    test: /[\\/]resources[\\/]assets[\\/]/,
                    reuseExistingChunk: true,
                    minChunks: 2
                },
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    reuseExistingChunk: true,
                    minChunks: 2,
                    priority: -10,
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
                {from: 'icons/fonts/icomoon.*', to: 'page-editor/fonts/[name].[ext]'}
            ]
        }),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
        new ErrorLoggerPlugin({showColumn: false})
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map'
};
