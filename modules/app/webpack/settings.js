const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');

module.exports = {
    settingsConfig: function(dirname, isProd, swcConfig) {
        return {
            context: path.join(dirname, '/src/main/resources/assets'),
            entry: {
                'js/settings': './js/settings.ts',
            },
            externals: [
                {
                    dompurify: 'DOMPurify',
                    jquery: 'jQuery',
                    mousetrap: 'Mousetrap',
                    'mousetrap/plugins/global-bind/mousetrap-global-bind': 'Mousetrap',
                    q: 'Q'
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
                    if (request.startsWith('.')) { return callback(); } // Continue without externalizing the import
                    if (issuer.endsWith('.js') || issuer.endsWith('.ts')) {
                        if (
                            request.startsWith('@enonic/lib-admin-ui')
                            || request.startsWith('lib-contentstudio')
                        ) {
                            return callback(); // Continue without externalizing the import
                        }
                        if (request.startsWith('@enonic/legacy-slickgrid')) {
                            return callback(null, 'Slick'); // The external is a global variable called `Slick`.
                        }
                        if (request.startsWith('jquery-ui')) {
                            return callback(null, 'jQuery'); // The external is a global variable called `jQuery`.
                        }
                    }
                    console.error('Settings: Not externalizing unhandeled import', {
                        context,
                        request,
                        dependencyType,
                        issuer
                    });
                    // Continue without externalizing the import
                    return callback();
                }
            ],
            output: {
                path: path.join(dirname, '/build/resources/main/assets'),
                filename: './[name].js',
                assetModuleFilename: './[file]'
            },
            resolve: {
                extensions: [
                    '.ts', '.js'
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
            },
            plugins: [
                // new ProvidePlugin({
                //     $: 'jquery',
                //     jQuery: 'jquery',
                //     'window.$': 'jquery',
                //     'window.jQuery': 'jquery'
                // }),
                new CircularDependencyPlugin({
                    exclude: /a\.js|node_modules/,
                    failOnError: true
                }),
            ],
            mode: isProd ? 'production' : 'development',
            devtool: isProd ? false : 'source-map',
            performance: {hints: false}
        };
    }
}
