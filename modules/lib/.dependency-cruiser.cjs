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
 * The law runs at error severity (#10967). Two grandfathered exemptions remain,
 * both enumerated below and expected to shrink to nothing:
 *
 * 1. FORM2_HOLDOUT — features/shared (form, selectors, lists, buckets, status,
 *    hooks) relocates together with the in-flight form2 migration; it is exempt
 *    both as source and target until then.
 * 2. KNOWN_DEBT_FILES — files with documented cross-slice edges that need design
 *    work, not relocation: widget interaction through the context-widgets
 *    registry, page-editor coupling to the wizard form model, publish-from-issue
 *    flow, and the project dialog updating the settings tree. These files are
 *    exempt from the error rules; the same edges are reported at warn severity
 *    by the known-cross-slice-debt rule so they stay visible.
 */

const V6 = 'src/main/resources/assets/js/v6';

// Highest to lowest; the array order defines the import direction.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

// Relocates with the form2 migration; exempt as source and target until then.
const FORM2_HOLDOUT = `^${V6}/features/shared/`;

// Test files are not architecture: they may reach across slices for mocks,
// fixtures, and assertions, so they are exempt as import sources.
const TEST_FILES = '\\.test\\.';

// Documented cross-slice debt, grouped by design theme (see header). The from
// files are exempt from the error rules; each theme surfaces its actual edges
// through a warn rule so the debt stays visible until the design work removes it.
const KNOWN_DEBT = [
    {
        name: 'debt-widget-interaction',
        comment:
            'Widgets coordinate through the context-widgets registry and inspect panel state; needs an interaction contract below the widgets layer',
        from: [
            `^${V6}/widgets/browse-grid/ContentTreeListItem.tsx`,
            `^${V6}/widgets/browse-toolbar/ContentWizardToolbar.tsx`,
            `^${V6}/widgets/browse-toolbar/ContextToggle.tsx`,
            `^${V6}/widgets/context-panel/widget/details/DetailsWidgetTemplateSection.tsx`,
            `^${V6}/widgets/preview-panel/ui/PreviewToolbarRefreshItem.tsx`,
            `^${V6}/widgets/preview-panel/ui/PreviewToolbarVersionHistoryItem.tsx`,
            `^${V6}/widgets/preview-panel/ui/PreviewToolbarWidgetSelector.tsx`,
            `^${V6}/widgets/inspectors/model/page-editor/bridge.ts`,
            `^${V6}/widgets/inspectors/ui/page-editor/PageEditorExtension.tsx`,
            `^${V6}/widgets/inspectors/ui/page-editor/inspect/text/TextEditor.tsx`,
        ],
        to: [
            `^${V6}/widgets/context-panel/(model/|openContextWidget)`,
            `^${V6}/widgets/inspectors/(model/inspect-panel|model/liveViewWidgets|api/details)`,
        ],
    },
    {
        name: 'debt-page-editor-wizard-model',
        comment:
            'Page editor and toolbar read the wizard form model; the edited-content state should sink below the widgets layer',
        from: [
            `^${V6}/widgets/browse-toolbar/ContentWizardToolbar.tsx`,
            `^${V6}/widgets/inspectors/model/liveViewWidgets.store.ts`,
            `^${V6}/widgets/inspectors/model/page-editor/commands.ts`,
            `^${V6}/widgets/inspectors/ui/page-editor/inspect/page/PageInspectionPanel.tsx`,
        ],
        to: [`^${V6}/pages/wizard/model/`],
    },
    {
        name: 'debt-publish-from-issue',
        comment: 'Issue details drives the publish dialog; publish-from-issue needs an entity-level command',
        from: [`^${V6}/features/issues/ui/issue/IssueDialogDetailsContent.tsx`],
        to: [`^${V6}/features/publish/`],
    },
    {
        name: 'debt-project-dialog-settings-tree',
        comment:
            'Project dialog updates the settings tree after create/edit; the tree should react to project events instead',
        from: [`^${V6}/features/manage-project/model/projectDialog.store.ts`],
        to: [`^${V6}/pages/settings/model/`],
    },
    {
        name: 'debt-context-content-read',
        comment: 'Link dialog reads the context panel subject; the current-content concept belongs to entities/content',
        from: [`^${V6}/features/rich-text-inserts/ui/htmlarea-link/ContentTabPanel.tsx`],
        to: [`^${V6}/widgets/context-panel/model/contextContent`],
    },
];

const KNOWN_DEBT_FILES = [...new Set(KNOWN_DEBT.flatMap((d) => d.from))];

const FROM_EXEMPT = [FORM2_HOLDOUT, TEST_FILES, ...KNOWN_DEBT_FILES];

// One rule per layer below app: importing any layer above it is a violation.
const noUpwardImports = LAYERS.slice(1).map((layer, i) => ({
    name: `${layer}-imports-downward-only`,
    comment: `${layer} may import only from layers strictly below it (${LAYERS.slice(i + 2).join(', ') || 'nothing'})`,
    severity: 'error',
    from: { path: `^${V6}/${layer}/`, pathNot: FROM_EXEMPT },
    to: { path: `^${V6}/(${LAYERS.slice(0, i + 1).join('|')})/`, pathNot: FORM2_HOLDOUT },
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
    severity: 'error',
    from: { path: `^${V6}/${layer}/([^/]+)/`, pathNot: FROM_EXEMPT },
    to: {
        path: `^${V6}/${layer}/`,
        pathNot:
            layer === 'entities'
                ? [`^${V6}/entities/$1/`, `^${V6}/entities/project/`]
                : [`^${V6}/${layer}/$1/`, FORM2_HOLDOUT],
    },
}));

// Keep the grandfathered edges visible without failing the build.
const knownDebtRules = KNOWN_DEBT.map(({ name, comment, from, to }) => ({
    name,
    comment: `${comment}; fix the design, then remove the entry from KNOWN_DEBT`,
    severity: 'warn',
    from: { path: `(${from.join('|')})` },
    to: { path: `(${to.join('|')})` },
}));

module.exports = {
    forbidden: [...noUpwardImports, ...noSidewaysImports, ...knownDebtRules],
    options: {
        // The law governs v6-internal edges only; legacy app/ and node_modules are out of scope.
        includeOnly: `^${V6}/`,
        tsConfig: { fileName: 'tsconfig.json' },
        tsPreCompilationDeps: true,
    },
};
