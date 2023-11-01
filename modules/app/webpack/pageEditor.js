const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');

module.exports = {
    pageEditorConfig: function(dirname, isProd, swcConfig) {
        return {
            context: path.join(dirname, '/src/main/resources/assets'),
            entry: {
                'page-editor/js/editor': './js/page-editor.ts',
            },
            // CAUTION: In the pageEditor everything MUST be bundled, so no externals!
            // externals: [],
            output: {
                path: path.join(dirname, '/build/resources/main/assets'),
                filename: './[name].js',
                assetModuleFilename: './[file]',
                // Attempt to avoid Error: Conflict: Multiple chunks emit assets to the same filename
                // NOPE, didn't help
                // chunkFilename: '[id].[hash:8].js'
            },
            resolve: {
                extensions: [
                    '.ts', '.js',
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
                            path.resolve(dirname, 'node_modules/fine-uploader/'),
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
            },
            plugins: [
                new ProvidePlugin({
                    $: 'jquery',
                    jQuery: 'jquery',
                    'window.$': 'jquery',
                    'window.jQuery': 'jquery'
                }),
                new CircularDependencyPlugin({
                    exclude: /a\.js|node_modules/,
                    failOnError: true
                }),
            ],
            mode: isProd ? 'production' : 'development',
            devtool: isProd ? false : 'source-map',
            performance: {hints: false}
        }
    }
}
