import { transformFile } from '@swc/core';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

const SRC = 'src/main/resources';
const OUT = 'build/resources/main';

// Server-side controllers/services live in lib/ and shared/ — mirrors the
// include of the previous `tsc --project lib/tsconfig.json` build:server step.
const SERVER_DIRS = ['lib', 'shared'];

const files = SERVER_DIRS.flatMap((dir) =>
    readdirSync(join(SRC, dir), { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith('.ts') && !d.name.endsWith('.d.ts'))
        .map((d) => join(d.parentPath, d.name)),
);

await Promise.all(
    files.map(async (file) => {
        const { code } = await transformFile(file, {
            // Ignore the project .swcrc (that config targets the rspack client build and
            // excludes these paths); use only the inline server config below.
            swcrc: false,
            configFile: false,
            // XP server runs on Nashorn (ES5 + partial ES6), NOT GraalJS — must downlevel
            // ES2020+ syntax (optional chaining, nullish coalescing) to ES5. swc fully lowers
            // const/let/arrows/classes to ES5, which esbuild cannot. Matches the ES5 target of
            // the previous `tsc` build:server.
            jsc: {
                parser: { syntax: 'typescript' },
                target: 'es5',
            },
            // Per-file CommonJS transpile (no bundling): preserves the require() graph and leaves
            // XP runtime modules (/lib/xp/*, /lib/http-client, /lib/license) as external requires.
            module: { type: 'commonjs' },
            sourceMaps: false,
            minify: false,
        });

        const outPath = join(OUT, relative(SRC, file)).replace(/\.ts$/, '.js');
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, code);
    }),
);
