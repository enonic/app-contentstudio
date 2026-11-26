// State of the fields on the second step of the publish or request dialog: what the user
// entered, and whether each field shows and is required. Kept apart from the dialog store,
// so typing in a field does not run again what is derived from the items.
// The commands that change this state live in `./commands/fields`.

import { computed, map } from 'nanostores';
import {
    $hasPublishOrRequestBlockedItems,
    $publishOrRequestCapability,
    type PublishOrRequestCapability,
} from './publishOrRequestDialog.store';

export type PublishOrRequestFieldsStore = {
    // Assign to: the user's choice to assign, kept while the field is required
    assignChecked: boolean;
    assigneeIds: string[];

    // Scheduled publish: the user's choice to schedule
    scheduleChecked: boolean;
    scheduleFrom: Date | undefined;
    scheduleTo: Date | undefined;

    // What the schedule inputs report about the text typed in them
    scheduleFromError: string | undefined;
    scheduleToError: string | undefined;

    // Title and comment
    title: string;
    comment: string;
};

/** Whether a field shows, and whether it must be filled. A required checkbox field has no checkbox. */
export type PublishOrRequestFieldState = {
    visible: boolean;
    required: boolean;
};

export type PublishOrRequestFieldStates = Record<
    'assign' | 'schedule' | 'title' | 'comment',
    PublishOrRequestFieldState
>;

export const INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE: PublishOrRequestFieldsStore = {
    // Assign to: the user's choice to assign, kept while the field is required
    assignChecked: false,
    assigneeIds: [],

    // Scheduled publish: the user's choice to schedule
    scheduleChecked: false,
    scheduleFrom: undefined,
    scheduleTo: undefined,

    // What the schedule inputs report about the text typed in them
    scheduleFromError: undefined,
    scheduleToError: undefined,

    // Title and comment
    title: '',
    comment: '',
};

export const $publishOrRequestFields = map<PublishOrRequestFieldsStore>({
    ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE,
});

/** True when the assignees are asked for: the field is required, or the user ticked it. */
export const $isPublishOrRequestAssignOpen = computed(
    [$publishOrRequestCapability, $hasPublishOrRequestBlockedItems, $publishOrRequestFields],
    (capability, hasBlockedItems, { assignChecked }): boolean =>
        isFieldOpen(getAssignFieldState(capability, hasBlockedItems), assignChecked),
);

/** True when the schedule is asked for: the field is required, or the user ticked it. */
export const $isPublishOrRequestScheduleOpen = computed($publishOrRequestFields, ({ scheduleChecked }): boolean =>
    isFieldOpen(OPTIONAL_FIELD_STATE, scheduleChecked),
);

// TODO: [#11792] Make the schedule, the title and the comment follow their rules.
/**
 * Whether each field shows and is required. It reads no typed value, so typing in a field
 * leaves it as it is.
 */
export const $publishOrRequestFieldStates = computed(
    [$publishOrRequestCapability, $hasPublishOrRequestBlockedItems],
    (capability, hasBlockedItems): PublishOrRequestFieldStates => ({
        assign: getAssignFieldState(capability, hasBlockedItems),
        schedule: OPTIONAL_FIELD_STATE,
        title: OPTIONAL_FIELD_STATE,
        comment: OPTIONAL_FIELD_STATE,
    }),
);

// *
// * Internal
// *

// The three states a field can be in. Shared, so a state that did not change is the same object.
const HIDDEN_FIELD_STATE: PublishOrRequestFieldState = { visible: false, required: false };
const OPTIONAL_FIELD_STATE: PublishOrRequestFieldState = { visible: true, required: false };
const REQUIRED_FIELD_STATE: PublishOrRequestFieldState = { visible: true, required: true };

// Hidden from who cannot request; required for who cannot publish everything that is listed.
function getAssignFieldState(
    capability: PublishOrRequestCapability,
    hasBlockedItems: boolean,
): PublishOrRequestFieldState {
    if (capability === 'publish' || capability === 'none') return HIDDEN_FIELD_STATE;

    return capability === 'request' || hasBlockedItems ? REQUIRED_FIELD_STATE : OPTIONAL_FIELD_STATE;
}

// A hidden field is never open. A required one is open whatever the user ticked.
function isFieldOpen({ visible, required }: PublishOrRequestFieldState, checked: boolean): boolean {
    return visible && (required || checked);
}
