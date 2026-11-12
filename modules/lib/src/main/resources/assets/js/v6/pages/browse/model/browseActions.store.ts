import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { type ContentPermission } from '../../../entities/content/api/permittedActions.api';
import { $noProjectMode } from '../../../entities/project';
import { isOnline, isPublished } from '../../../shared/lib/cms/content/status';
import { $isPreviewResolved } from '../../../widgets/preview-panel/model/previewResolution.store';

export type BrowseActionId =
    | 'new'
    | 'edit'
    | 'archive'
    | 'duplicate'
    | 'move'
    | 'sort'
    | 'preview'
    | 'publish'
    | 'publishTree'
    | 'unpublish'
    | 'markAsReady'
    | 'requestPublish'
    | 'createIssue'
    | 'search';

export type BrowseAction = {
    id: BrowseActionId;
    shortcut?: string;
    /** Fires from text fields too. */
    global?: boolean;
};

export type BrowseActionState = {
    labelKey: string;
    enabled: boolean;
    visible: boolean;
};

export type BrowseActionsState = Record<BrowseActionId, BrowseActionState>;

/** What the server has to say about the current items; filled in by the service. */
export type BrowseActionFacts = {
    items: readonly ContentSummary[];
    permissions: readonly ContentPermission[];
    /** Whether the type of the single current item allows children; `undefined` until checked. */
    childrenAllowed?: boolean;
    contentTypeMissing?: boolean;
    /** Whether any current item has unpublished descendants; `undefined` until checked. */
    hasUnpublishedChildren?: boolean;
};

export type BrowseActionEnvironment = {
    /** A long-running legacy operation is in progress. */
    stashed: boolean;
    noProject: boolean;
    previewResolved: boolean;
    canRequestPublish: boolean;
};

const isApplePlatform = (): boolean =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '');

export const BROWSE_ACTIONS: readonly BrowseAction[] = [
    { id: 'new', shortcut: 'alt+n' },
    { id: 'edit', shortcut: 'mod+e' },
    { id: 'archive', shortcut: 'mod+del' },
    { id: 'duplicate' },
    { id: 'move', shortcut: 'alt+m' },
    { id: 'sort' },
    { id: 'preview', shortcut: isApplePlatform() ? 'alt+space' : 'mod+alt+space', global: true },
    { id: 'publish', shortcut: 'ctrl+alt+p' },
    { id: 'publishTree' },
    { id: 'unpublish' },
    { id: 'markAsReady' },
    { id: 'requestPublish' },
    { id: 'createIssue' },
    { id: 'search', shortcut: 'shift+f' },
];

const LABEL_KEYS: Record<BrowseActionId, string> = {
    new: 'action.new',
    edit: 'action.edit',
    archive: 'action.delete',
    duplicate: 'action.duplicate',
    move: 'action.move',
    sort: 'action.sort',
    preview: 'action.preview',
    publish: 'action.publish',
    publishTree: 'action.publishTree',
    unpublish: 'action.unpublish',
    markAsReady: 'action.markAsReady',
    requestPublish: 'action.requestPublish',
    createIssue: 'action.createIssue',
    search: '',
};

//
// * State
//

type ItemsSummary = {
    empty: boolean;
    single: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canModify: boolean;
    canPublish: boolean;
    anyDeletable: boolean;
    anyEditable: boolean;
    anyPublished: boolean;
    anyValidNonOnline: boolean;
    anyCanBeMarkedAsReady: boolean;
    anyInProgress: boolean;
    allValid: boolean;
    allOnline: boolean;
    allLeafs: boolean;
    allReadOnly: boolean;
    readyForPublishing: boolean;
    publishTreeAllowed: boolean;
};

export function canBeMarkedAsReady(content: ContentSummary): boolean {
    return !isOnline(content) && content.isValid() && !content.isReady();
}

function summarize({ items, permissions }: BrowseActionFacts, stashed: boolean): ItemsSummary {
    const empty = items.length === 0;
    const canDelete = permissions.includes('DELETE') && !stashed;
    const canModify = permissions.includes('MODIFY') && !stashed;
    const canPublish = permissions.includes('PUBLISH') && !stashed;
    const allOnline = !empty && items.every(isOnline);
    const allLeafs = !empty && items.every((item) => !item.hasChildren());
    const anyValidNonOnline = items.some((item) => !isOnline(item) && item.isValid());
    const anyInProgress = items.some((item) => item.isInProgress());
    const mayPublish = !empty && !stashed && canPublish && (canModify || !anyInProgress);

    return {
        empty,
        single: items.length === 1,
        canCreate: permissions.includes('CREATE'),
        canDelete,
        canModify,
        canPublish,
        anyDeletable: items.some((item) => item.isDeletable()),
        anyEditable: items.some((item) => item.isEditable()),
        anyPublished: items.some(isPublished),
        anyValidNonOnline,
        anyCanBeMarkedAsReady: items.some(canBeMarkedAsReady),
        anyInProgress,
        allValid: items.every((item) => item.isValid()),
        allOnline,
        allLeafs,
        allReadOnly: items.every((item) => item.isReadOnly()),
        readyForPublishing: mayPublish && !allOnline && anyValidNonOnline,
        publishTreeAllowed: mayPublish && !allLeafs,
    };
}

/** Whether the single current item needs its content type checked for allowing children. */
export function needsChildrenAllowedCheck({ items, permissions }: BrowseActionFacts): boolean {
    return items.length === 1 && permissions.includes('CREATE');
}

/**
 * Whether the current items need a check for unpublished descendants.
 * Never depends on the stash: nothing asks again when it lifts, and the answer would be missing then.
 */
export function needsUnpublishedChildrenCheck(facts: BrowseActionFacts, canRequestPublish: boolean): boolean {
    const summary = summarize(facts, false);
    if (summary.empty || summary.allLeafs) return false;
    if (summary.publishTreeAllowed) return true;

    return summary.allOnline && summary.allValid && canRequestPublish;
}

export function resolveBrowseActions(facts: BrowseActionFacts, env: BrowseActionEnvironment): BrowseActionsState {
    const { items, childrenAllowed, contentTypeMissing = false, hasUnpublishedChildren } = facts;
    const s = summarize(facts, env.stashed);
    const idle = !env.stashed;
    const some = !s.empty;
    const childrenBlocked = s.single && childrenAllowed === false;
    const isPageTemplate = s.single && items[0].getType().isPageTemplate();
    const canRequest = s.allValid && env.canRequestPublish;

    const enabled: Record<BrowseActionId, boolean> = {
        new: s.canCreate && (s.empty || s.single) && !isPageTemplate && !childrenBlocked,
        edit: some && s.anyEditable,
        archive: some && idle && s.anyDeletable && s.canDelete,
        duplicate: some && idle && s.canCreate,
        move: some && idle && s.canDelete,
        sort: s.single && s.canCreate && !childrenBlocked,
        preview: some && env.previewResolved,
        publish: s.readyForPublishing && !contentTypeMissing,
        publishTree: s.publishTreeAllowed && !contentTypeMissing && hasUnpublishedChildren !== false,
        unpublish: some && idle && s.canPublish && s.anyPublished,
        markAsReady: some && s.allValid && s.canModify && s.anyCanBeMarkedAsReady,
        requestPublish: some && canRequest && (!s.allOnline || hasUnpublishedChildren === true),
        createIssue: true,
        search: true,
    };

    const visible: Partial<Record<BrowseActionId, boolean>> = {
        publish: s.empty || enabled.publish || contentTypeMissing,
        unpublish: some && enabled.unpublish,
    };

    const result = {} as BrowseActionsState;

    for (const { id } of BROWSE_ACTIONS) {
        const survivesStash = id === 'new' || id === 'search';

        result[id] = {
            labelKey: LABEL_KEYS[id],
            enabled: enabled[id] && !env.noProject && (idle || survivesStash),
            visible: visible[id] ?? true,
        };
    }

    if (some && s.allReadOnly) {
        result.edit.labelKey = 'action.open';
    }

    return result;
}

export const $browseActionFacts = atom<BrowseActionFacts>({ items: [], permissions: [] });

const $browseActionsStashed = atom(false);

/** Holds every action but New and Search back while a legacy long-running operation is in progress. */
export function setBrowseActionsStashed(stashed: boolean): void {
    $browseActionsStashed.set(stashed);
}

export const $browseActions = computed(
    [$browseActionFacts, $browseActionsStashed, $noProjectMode, $isPreviewResolved],
    (facts, stashed, noProject, previewResolved): BrowseActionsState =>
        resolveBrowseActions(facts, {
            stashed,
            noProject,
            previewResolved,
            canRequestPublish: ProjectHelper.canRequestPublish(),
        }),
);
