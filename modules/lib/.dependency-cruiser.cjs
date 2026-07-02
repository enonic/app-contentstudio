/**
 * v6 Feature-Sliced Design import law (#10961).
 *
 * Layers, highest to lowest — a layer may import only from layers strictly below it:
 *
 *   app → pages → widgets → features → entities → shared
 *
 * Same-layer slices never import each other; cross-slice communication drops to a
 * lower layer (a shared store or an entity).
 *
 * Legacy role dirs still under the old features/ umbrella (store/, views/, services/,
 * api/, utils/, lib/, hooks/, layout/, shared/) are exempt as import *sources* until
 * their phase migrates them (#10963–#10966). The exemption and the warn severity are
 * removed in Phase 5 (#10967).
 */

const V6 = 'src/main/resources/assets/js/v6';

// Highest to lowest; the array order defines the import direction.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

// Not-yet-migrated role dirs under the old features/ umbrella.
const LEGACY_UMBRELLA = `^${V6}/features/(store|views|services|api|utils|lib|hooks|layout|shared)/`;

// Test files are not architecture: they may reach across slices for mocks,
// fixtures, and assertions, so they are exempt as import sources.
const TEST_FILES = '\\.test\\.';

// One rule per layer below app: importing any layer above it is a violation.
const noUpwardImports = LAYERS.slice(1).map((layer, i) => ({
    name: `${layer}-imports-downward-only`,
    comment: `${layer} may import only from layers strictly below it (${LAYERS.slice(i + 2).join(', ') || 'nothing'})`,
    severity: 'warn',
    from: { path: `^${V6}/${layer}/`, pathNot: [LEGACY_UMBRELLA, TEST_FILES] },
    to: { path: `^${V6}/(${LAYERS.slice(0, i + 1).join('|')})/` },
}));

// Slices on the same layer must not import each other ($1 = the importing slice).
// shared is segment-based (ui/lib/api may use each other) and app is a single
// composition root, so neither needs a sideways rule.
// Documented exception: every entity may read entities/project — the project is
// the partitioning key for entity state (the content cache is per-project), so
// sibling reads of the project slice are inherent, not accidental coupling.
const noSidewaysImports = ['pages', 'widgets', 'features', 'entities'].map((layer) => ({
    name: `${layer}-no-same-layer-imports`,
    comment: 'Same-layer slices must not import each other; drop shared state to a lower layer',
    severity: 'warn',
    from: { path: `^${V6}/${layer}/([^/]+)/`, pathNot: [LEGACY_UMBRELLA, TEST_FILES] },
    to: {
        path: `^${V6}/${layer}/`,
        pathNot: layer === 'entities' ? [`^${V6}/entities/$1/`, `^${V6}/entities/project/`] : `^${V6}/${layer}/$1/`,
    },
}));

module.exports = {
    forbidden: [...noUpwardImports, ...noSidewaysImports],
    options: {
        // The law governs v6-internal edges only; legacy app/ and node_modules are out of scope.
        includeOnly: `^${V6}/`,
        tsConfig: { fileName: 'tsconfig.json' },
        tsPreCompilationDeps: true,
    },
};
