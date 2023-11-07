import type { Options } from '.';

// import esbuildPluginExternalGlobal from 'esbuild-plugin-external-global';
// import CopyWithHashPlugin from '@enonic/esbuild-plugin-copy-with-hash';
import GlobalsPlugin from 'esbuild-plugin-globals';
import {
    DIR_DST_ASSETS,
    DIR_SRC_ASSETS
} from './constants';

export default function buildAssetConfig(): Options {
    return {
        bundle: true,
        dts: false, // d.ts files are use useless at runtime
        entry: {
            'js/main': `${DIR_SRC_ASSETS}/js/main.ts`,
            // 'js/settings': `${DIR_SRC_ASSETS}/js/settings.ts`,
            // 'page-editor/js/editor': `${DIR_SRC_ASSETS}/js/page-editor.ts`,
        },
        // esbuildOptions(options, context) {
        //     options.banner = {
        //         js: `const jQuery = $;` // jQuery UI Tabbable requires this
        //     };
        // },
        esbuildPlugins: [
            // esbuildPluginExternalGlobal.externalGlobalPlugin({
            //     'jquery': 'window.$'
            // // }),
            GlobalsPlugin({
                '@enonic/legacy-slickgrid.*'(modulename) {
                    return 'Slick';
                },
                'jquery': '$',
                'q': 'Q'
            }),
            // CopyWithHashPlugin({
            //     addHashesToFileNames: false,
            //     context: 'node_modules',
            //     manifest: 'node_modules-manifest.json',
            //     patterns: [
            //         'jquery/dist/*.*',
            //         'jquery-ui-dist/*.*',
            //     ]
            // }),
        ],
        format: [
            'esm'
        ],
        minify: process.env.NODE_ENV !== 'development',

        // TIP: Command to check if there are any bad requires left behind
        // grep -r 'require("' build/resources/main/assets | grep -v 'require("/'|grep -v chunk
        noExternal: [ // Same as dependencies in package.json
            /^@enonic\/lib-admin-ui/,
            /^lib-contentstudio/,
            // It seems these need to be listed here for global plugins to work
            // /^@enonic\/legacy-slickgrid/,
            // 'chart.js',
            // 'dompurify',
            // 'enonic-admin-artifacts',
            'jquery',
            // 'jquery-simulate',
            // 'jquery-ui',
            // 'mousetrap',
            'q'
        ],
        outDir: DIR_DST_ASSETS,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        splitting: false,
        sourcemap: process.env.NODE_ENV === 'development',
        tsconfig: `${DIR_SRC_ASSETS}/tsconfig.json`,
    };
}
