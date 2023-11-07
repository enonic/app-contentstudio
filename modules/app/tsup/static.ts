import type { Options } from '.';

import TsupPluginManifest from '@enonic/tsup-plugin-manifest'
import {
    DIR_DST_STATIC,
    DIR_SRC_STATIC
} from './constants';

export default function buildAssetConfig(): Options {
    return {
        bundle: true,
        dts: false, // d.ts files are use useless at runtime
        entry: {
            'hasher/hasher': `${DIR_SRC_STATIC}/hasher/hasher.ts`,
            'hasher/hasher.min': `${DIR_SRC_STATIC}/hasher/hasher.min.ts`,
            'signals/signals': `${DIR_SRC_STATIC}/signals/signals.ts`,
            'signals/signals.min': `${DIR_SRC_STATIC}/signals/signals.min.ts`,
        },
        // esbuildOptions(options, context) {
        //     options.entryNames = '[dir]/[name]-[hash]'; // Not needed, TsupPluginManifest handles this.
        // },
        esbuildPlugins: [
            TsupPluginManifest({
                // Manipulate the manifest keys and values.
                generate: (entries) => {
                    const newEntries = {} as typeof entries;
                    Object.entries(entries).forEach(([k,v]) => {
                        // console.log(k,v);
                        const ext = v.split('.').pop() as string;
                        const parts = k.replace(`${DIR_SRC_STATIC}/`, '').split('.');
                        parts.pop();
                        parts.push(ext);
                        newEntries[parts.join('.')] = v.replace(`${DIR_DST_STATIC}/`, '');
                    });
                    return newEntries;
                }
            })
        ],
        format: ['esm'],
        minify: false, // The min is already minified, the non-min should not be minified
        // noExternal: [],
        outDir: DIR_DST_STATIC,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        splitting: false,
        sourcemap: false,
        tsconfig: `${DIR_SRC_STATIC}/tsconfig.json`,
    };
}
