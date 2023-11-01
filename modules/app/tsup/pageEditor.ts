import type { Options } from '.';

// import esbuildPluginExternalGlobal from 'esbuild-plugin-external-global';
// import CopyWithHashPlugin from '@enonic/esbuild-plugin-copy-with-hash';
import {
    DIR_DST_ASSETS,
    DIR_SRC_ASSETS
} from './constants';

export default function buildAssetConfig(): Options {
    return {
        bundle: true,
        dts: false, // d.ts files are use useless at runtime
        // entry: {
        //     'page-editor/js/editor': `${DIR_SRC_ASSETS}/js/page-editor.ts`,
        // },
        esbuildOptions(options, context) {
            // options.banner = {
            //     js: `const jQuery = $;` // jQuery UI seems to need this
            // };
            options.outbase = DIR_SRC_ASSETS;
        },
        // esbuildPlugins: [],
        format: [
            'cjs'
        ],
        inject: [
            // https://github.com/evanw/esbuild/issues/1664#issuecomment-938321780
            `${DIR_SRC_ASSETS}/js/pageEditorInjections.ts`, // This makes $ and jQuery local to the bundle, rather than using the global ones.
            // 'jquery-ui-dist/jquery-ui.min.js',
            // 'jquery-simulate/jquery.simulate.js'
            // 'jquery',
            // 'jquery-ui',
            'jquery-ui/ui/widgets/draggable',
            'jquery-ui/ui/widgets/droppable',
            'jquery-simulate',
        ],
        minify: process.env.NODE_ENV !== 'development',

        // TIP: Command to check if there are any bad requires left behind
        // grep -r 'require("' build/resources/main/assets | grep -v 'require("/'|grep -v chunk
        noExternal: [ // Same as dependencies in package.json
            /.+/ // Bundle everything!
            // /@enonic\/lib-admin-ui/,
            // // 'chart.js',
            // 'dompurify',
            // // 'enonic-admin-artifacts',
            // /^jquery/,
            // // 'jquery',
            // // 'jquery-simulate',
            // // 'jquery-ui', // Does this provide jquery-ui/ui/widgets/mouse to jquery-ui/ui/widgets/draggable? Nope
            // 'mousetrap',
            // /^lib-contentstudio/,
            // 'q'
        ],
        outDir: DIR_DST_ASSETS,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        splitting: false,
        sourcemap: process.env.NODE_ENV === 'development',
        tsconfig: `${DIR_SRC_ASSETS}/tsconfig.json`,
    };
}
