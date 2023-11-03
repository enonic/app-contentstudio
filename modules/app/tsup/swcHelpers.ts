import type { Options } from '.';

import {
    DIR_DST_ASSETS,
    DIR_SRC_ASSETS
} from './constants';

export default function buildAssetConfig(): Options {
    return {
        bundle: true,
        dts: false, // d.ts files are use useless at runtime
        entry: {
            'js/swcHelpers': 'js/swcHelpers.ts',
        },
        // esbuildOptions(options, context) {},
        // esbuildPlugins: [],
        format: ['esm'],
        minify: process.env.NODE_ENV !== 'development',
        // noExternal: [],
        outDir: DIR_DST_ASSETS,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        splitting: false,
        sourcemap: process.env.NODE_ENV === 'development',
        tsconfig: `${DIR_SRC_ASSETS}/tsconfig.json`,
    };
}
