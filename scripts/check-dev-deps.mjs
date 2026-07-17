/**
 * Verifies that every bare import in the compiled JS of packages linked from
 * .xp/dev (Gradle-extracted dev-resources) is resolvable from this module.
 *
 * Linked packages (`link:` protocol) are not installed by pnpm, so their bare
 * imports resolve against this module's node_modules. An undeclared dependency
 * surfaces as a bundling error, or worse, a stale duplicate. This check turns
 * that into an actionable message.
 *
 * Only imports actually present in the shipped (non-test) code are required —
 * the linked package's manifest is used solely to cross-check version ranges.
 */
import fs from 'node:fs';
import path from 'node:path';

const moduleDir = process.cwd();
const devDir = path.join(moduleDir, '.xp', 'dev');

// Bundled test helpers are never reachable from the app entry points.
const IGNORED_FILES = /\.(test|test\.utils|stories)\.js$/;
// Linked siblings resolve via their own link: entries; react/react-dom are
// aliased to preact/compat in the rspack configs.
const IGNORED_PACKAGES = new Set(['react', 'react-dom']);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

if (!fs.existsSync(devDir)) {
    console.error(`check-dev-deps: ${devDir} does not exist.`);
    console.error('Run the Gradle build first (it extracts dev-resources into .xp/dev), e.g.:');
    console.error('  ./gradlew pnpmInstall');
    process.exit(1);
}

const consumer = readJson(path.join(moduleDir, 'package.json'));
const declared = {...consumer.dependencies, ...consumer.devDependencies};

const jsFiles = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        if (entry.name === 'node_modules') {
            continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...jsFiles(full));
        } else if (entry.name.endsWith('.js') && !IGNORED_FILES.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
};

// The extracted dist is unminified compiler output, so static import/export
// statements start at the beginning of a line.
const IMPORT_RES = [
    /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm, // import x from 'pkg' / export * from 'pkg'
    /^\s*import\s*['"]([^'"]+)['"]/gm, // side-effect: import 'pkg'
    /(?<![\w$.'"])import\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic: import('pkg')
    /(?<![\w$.'"])require\(\s*['"]([^'"]+)['"]\s*\)/g, // CJS: require('pkg')
];

const toPackageName = (specifier) => {
    const parts = specifier.split('/');
    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

let errors = 0;
let warnings = 0;

for (const entry of fs.readdirSync(devDir)) {
    const pkgDir = path.join(devDir, entry);
    const manifestPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(manifestPath)) {
        continue;
    }
    const manifest = readJson(manifestPath);
    const manifestRanges = {...manifest.dependencies, ...manifest.peerDependencies};

    const used = new Set();
    for (const file of jsFiles(pkgDir)) {
        const source = fs.readFileSync(file, 'utf8');
        for (const re of IMPORT_RES) {
            for (const match of source.matchAll(re)) {
                const specifier = match[1];
                if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
                    used.add(toPackageName(specifier));
                }
            }
        }
    }

    for (const name of [...used].sort()) {
        if (IGNORED_PACKAGES.has(name) || name.startsWith('@enonic/lib-')) {
            continue;
        }
        const declaredRange = declared[name];
        const wantedRange = manifestRanges[name];
        if (!declaredRange) {
            console.error(
                `check-dev-deps: ${manifest.name} imports "${name}"` +
                    (wantedRange ? ` (wants "${wantedRange}")` : '') +
                    `, but ${consumer.name} does not declare it. Add it to package.json.`,
            );
            errors++;
        } else if (wantedRange && wantedRange !== declaredRange && !wantedRange.startsWith('workspace:')) {
            console.warn(
                `check-dev-deps: range mismatch for "${name}": ` +
                    `${manifest.name} wants "${wantedRange}", ${consumer.name} declares "${declaredRange}".`,
            );
            warnings++;
        }
    }
}

if (errors > 0) {
    process.exit(1);
}
if (warnings > 0) {
    console.warn(`check-dev-deps: ${warnings} range mismatch(es) — verify the resolved versions are compatible.`);
}
console.log('check-dev-deps: OK');
