import { atom, computed } from 'nanostores';
import type { ContentState } from '../../../../app/content/ContentState';
import { $contentType, $wizardContentPathExists, $wizardContentState, $wizardHasChanges } from './wizardContent.store';

//
// * Wizard Actions Store
//
// The state of the wizard actions (enabled, visible), derived from the facts
// about the edited content. The legacy `ContentWizardActions` writes the facts
// and mirrors the result into its lib-admin-ui `Action` objects.
//

export type WizardActionId =
    | 'save'
    | 'saveAndClose'
    | 'archive'
    | 'duplicate'
    | 'move'
    | 'publish'
    | 'publishTree'
    | 'unpublish'
    | 'markAsReady'
    | 'requestPublish'
    | 'openRequest'
    | 'createIssue'
    | 'reset'
    | 'localize';

export type WizardActionState = {
    enabled: boolean;
    visible: boolean;
};

export type WizardActionsState = Record<WizardActionId, WizardActionState>;

/** The persisted content, known once the wizard treats the content as existing. */
export type WizardPersistedFacts = {
    unnamed: boolean;
    deletable: boolean;
    editable: boolean;
    dataInherited: boolean;
    canDelete: boolean;
};

/** The content summary with its publish status, known once the wizard is rendered. */
export type WizardSummaryFacts = {
    online: boolean;
    published: boolean;
    hasChildren: boolean;
    inProgress: boolean;
    dataInherited: boolean;
    hasOriginProject: boolean;
};

export type WizardActionFacts = {
    /** Absent while the wizard treats the content as new. */
    persisted?: WizardPersistedFacts;
    canModify: boolean;
    canPublish: boolean;
    summary?: WizardSummaryFacts;
    /** `false` once the server says the user may not create under the parent. */
    parentCanCreate?: boolean;
    /** `undefined` until the server answers for the current summary. */
    hasUnpublishedChildren?: boolean;
    existsInParentProject: boolean;
    deleteOnly: boolean;
    hasPublishRequest: boolean;
};

/** What the commands are doing right now. */
export type WizardActionActivity = {
    /** The action that is saving the content before it opens its dialog. */
    busy?: WizardActionId;
    /** The Save action is saving. */
    saving: boolean;
    /** The Save action has saved at least once and the last save did not fail. */
    saved: boolean;
};

export type WizardSaveLabel = 'save' | 'saving' | 'saved';

export type WizardActionEnvironment = {
    hasChanges: boolean;
    pathExists: boolean;
    contentState: ContentState | null;
    hasContentType: boolean;
    canRequestPublish: boolean;
    stashed: boolean;
    activity?: WizardActionActivity;
};

const SAVING: ReadonlySet<WizardActionId> = new Set(['save', 'saveAndClose']);

const ACTION_IDS: readonly WizardActionId[] = [
    'save',
    'saveAndClose',
    'archive',
    'duplicate',
    'move',
    'publish',
    'publishTree',
    'unpublish',
    'markAsReady',
    'requestPublish',
    'openRequest',
    'createIssue',
    'reset',
    'localize',
];

// Held back while a long-running operation on the content is in progress.
const STASHABLE: ReadonlySet<WizardActionId> = new Set([
    'archive',
    'duplicate',
    'move',
    'publish',
    'publishTree',
    'unpublish',
]);

export const INITIAL_WIZARD_ACTION_FACTS: WizardActionFacts = {
    canModify: true,
    canPublish: true,
    existsInParentProject: false,
    deleteOnly: false,
    hasPublishRequest: false,
};

type PublishFacts = {
    valid: boolean;
    canBePublished: boolean;
    canPublishTree: boolean;
};

function resolvePublishFacts(facts: WizardActionFacts, env: WizardActionEnvironment): PublishFacts {
    const { summary, canModify, canPublish } = facts;
    const valid = env.contentState != null && env.contentState !== 'invalid';
    // A user who may not modify the content cannot finish it, so work in progress stays unpublished.
    const publishable = valid && env.hasContentType && canPublish && !(summary?.inProgress && !canModify);

    return {
        valid,
        canBePublished: publishable && summary != null && !summary.online,
        canPublishTree: publishable && summary != null && summary.hasChildren,
    };
}

/** Whether the unpublished descendants of the content have to be known to resolve the actions. */
export function needsUnpublishedChildrenCheck(facts: WizardActionFacts, env: WizardActionEnvironment): boolean {
    if (!facts.summary?.hasChildren) return false;

    const { valid, canPublishTree } = resolvePublishFacts(facts, env);

    return canPublishTree || (valid && env.canRequestPublish);
}

export function resolveWizardActions(facts: WizardActionFacts, env: WizardActionEnvironment): WizardActionsState {
    const { persisted, summary, canModify, canPublish, deleteOnly, hasPublishRequest } = facts;
    const { valid, canBePublished, canPublishTree } = resolvePublishFacts(facts, env);
    const hasUnpublishedChildren = facts.hasUnpublishedChildren === true;
    const canSave = env.hasChanges && !env.pathExists;
    const inherited = facts.existsInParentProject && summary?.hasOriginProject === true;
    const canBeReset = inherited && summary?.dataInherited === false;
    const canBeLocalized = inherited && summary?.dataInherited === true;
    const publishing = summary != null && !deleteOnly;

    const enabled: Record<WizardActionId, boolean> = {
        save: persisted ? canSave && persisted.editable && canModify && !persisted.dataInherited : canSave,
        saveAndClose: canModify,
        archive: persisted ? persisted.deletable && persisted.canDelete : true,
        duplicate: !deleteOnly && facts.parentCanCreate !== false,
        move: !deleteOnly && persisted != null && !persisted.unnamed,
        publish: publishing && canBePublished,
        publishTree: publishing && canPublishTree && hasUnpublishedChildren,
        unpublish: publishing && summary?.published === true && canPublish,
        markAsReady: summary != null && env.contentState === 'in-progress' && canModify,
        requestPublish:
            summary != null && env.canRequestPublish && valid && (!summary.online || hasUnpublishedChildren),
        openRequest: summary != null && hasPublishRequest,
        createIssue: publishing,
        reset: canModify && canBeReset,
        localize: canModify && canBeLocalized,
    };

    const visible: Partial<Record<WizardActionId, boolean>> = {
        save: !persisted?.dataInherited,
        openRequest: hasPublishRequest,
        reset: canBeReset,
        localize: canBeLocalized,
    };

    const result = {} as WizardActionsState;

    const { busy, saving = false } = env.activity ?? {};

    for (const id of ACTION_IDS) {
        const held = (env.stashed && STASHABLE.has(id)) || busy === id || (saving && SAVING.has(id));

        result[id] = {
            enabled: enabled[id] && !held,
            visible: visible[id] ?? true,
        };
    }

    return result;
}

/** What the Save button says: the legacy label rules, without the action object. */
export function resolveSaveLabel(saveEnabled: boolean, env: WizardActionEnvironment): WizardSaveLabel {
    const { saving = false, saved = false } = env.activity ?? {};

    if (saving) return 'saving';

    return env.hasChanges || saveEnabled || !saved ? 'save' : 'saved';
}

export const $wizardActionFacts = atom<WizardActionFacts>(INITIAL_WIZARD_ACTION_FACTS);

const INITIAL_ACTIVITY: WizardActionActivity = { saving: false, saved: false };

const $wizardActionActivity = atom<WizardActionActivity>(INITIAL_ACTIVITY);

export function patchWizardActionActivity(patch: Partial<WizardActionActivity>): void {
    $wizardActionActivity.set({ ...$wizardActionActivity.get(), ...patch });
}

const $wizardActionsStashed = atom(false);

const $canRequestPublish = atom(false);

export function patchWizardActionFacts(patch: Partial<WizardActionFacts>): void {
    $wizardActionFacts.set({ ...$wizardActionFacts.get(), ...patch });
}

export function resetWizardActionFacts(): void {
    $wizardActionFacts.set(INITIAL_WIZARD_ACTION_FACTS);
    $wizardActionsStashed.set(false);
    $canRequestPublish.set(false);
    $wizardActionActivity.set(INITIAL_ACTIVITY);
}

export function setWizardActionsStashed(stashed: boolean): void {
    $wizardActionsStashed.set(stashed);
}

/** Whether the user may request publishing in the active project; the legacy project helper is not reactive. */
export function setWizardCanRequestPublish(canRequestPublish: boolean): void {
    $canRequestPublish.set(canRequestPublish);
}

export const $wizardActionEnvironment = computed(
    [
        $wizardHasChanges,
        $wizardContentPathExists,
        $wizardContentState,
        $contentType,
        $canRequestPublish,
        $wizardActionsStashed,
        $wizardActionActivity,
    ],
    (
        hasChanges,
        pathExists,
        contentState,
        contentType,
        canRequestPublish,
        stashed,
        activity,
    ): WizardActionEnvironment => ({
        hasChanges,
        pathExists: pathExists.exists,
        contentState,
        hasContentType: contentType != null,
        canRequestPublish,
        stashed,
        activity,
    }),
);

export const $wizardActions = computed(
    [$wizardActionFacts, $wizardActionEnvironment],
    (facts, env): WizardActionsState => resolveWizardActions(facts, env),
);

export const $wizardSaveLabel = computed([$wizardActions, $wizardActionEnvironment], (actions, env): WizardSaveLabel =>
    resolveSaveLabel(actions.save.enabled, env),
);
