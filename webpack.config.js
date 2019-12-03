const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'js/bundle': './js/main.ts',
        'lib/_all': './lib/index.js',
        'styles/_all': './styles/main.less',
        'page-editor/js/_all': './js/page-editor.ts',
        'page-editor/lib/_all': './page-editor/lib/index.js',
        'page-editor/styles/_all': './page-editor/styles/main.less',
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
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                terserOptions: {
                    compress: {
                        drop_console: false
                    },
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ]
    },
    plugins: [
        new ErrorLoggerPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new CopyWebpackPlugin([
            { from: 'icons/fonts/icomoon.*', to: 'page-editor/fonts/[name].[ext]' },
            { from: path.join(__dirname, '/node_modules/@webcomponents/html-imports/html-imports.min.*'), to: 'js/[name].[ext]' }
        ]),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        })
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map'
};
