import type { Options } from '.';

import { globSync } from 'glob';
import {
    DIR_SRC,
    DIR_SRC_ASSETS,
    DIR_SRC_STATIC
} from './constants';


export default function buildServerConfig(): Options {
    const entry = globSync(`${DIR_SRC}/**/*.ts`, {
        absolute: false,
        ignore: globSync(`${DIR_SRC}/**/*.d.ts`).concat(
            globSync(`${DIR_SRC_ASSETS}/**/*.ts`),
            globSync(`${DIR_SRC_STATIC}/**/*.ts`)
        )
    });

    return {
        bundle: true, // Needed for @enonic/lib-admin-ui
        dts: false, // d.ts files are use useless at runtime
        entry,
        esbuildOptions(options, context) {
            options.chunkNames = '_chunks/[name]-[hash]';
            options.mainFields = ['module', 'main'];
        },
        esbuildPlugins: [],
        external: [
            /^\//,
            // '/lib/cache',
            // '/lib/enonic/static',
            // /^\/lib\/guillotine/,
            // '/lib/graphql',
            // '/lib/graphql-connection',
            // '/lib/http-client',
            // '/lib/license',
            // '/lib/mustache',
            // '/lib/router',
            // '/lib/util',
            // '/lib/vanilla',
            // '/lib/text-encoding',
            // '/lib/thymeleaf',
            // /^\/lib\/xp\//,
        ],
        format: 'cjs',
        inject: [],
        minify: false, // Minifying server files makes debugging harder

        // TIP: Command to check if there are any bad requires left behind
        // grep -r 'require("' build/resources/main | grep -v 'require("/'|grep -v chunk
        noExternal: [],

        platform: 'neutral',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        shims: false, // https://tsup.egoist.dev/#inject-cjs-and-esm-shims

        splitting: false, // In order for tests to work

        sourcemap: false,
        target: 'es5',
        tsconfig: `${DIR_SRC}/tsconfig.json`,
    };
}

