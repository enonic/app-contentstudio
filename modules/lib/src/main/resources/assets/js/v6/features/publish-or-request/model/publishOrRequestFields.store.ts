// State of the fields on the second step of the publish or request dialog: what the user
// entered, and whether each field shows and is required. Kept apart from the dialog store,
// so typing in a field does not run again what is derived from the items.
// The commands that change this state live in `./commands/fields`.

import { computed, map } from 'nanostores';
import {
    $hasPublishOrRequestBlockedItems,
    $isPublishOrRequestSchedulable,
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

/** What is wrong with the dates of the schedule: "online to" has passed, or is not after "online from". */
export type PublishOrRequestScheduleProblem = 'to-in-past' | 'to-not-after-from';

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

/** True when the schedule is asked for: the field shows and the user ticked it. */
export const $isPublishOrRequestScheduleOpen = computed(
    [$isPublishOrRequestSchedulable, $publishOrRequestFields],
    (schedulable, { scheduleChecked }): boolean => isFieldOpen(getScheduleFieldState(schedulable), scheduleChecked),
);

/**
 * What is wrong with the dates entered, while the schedule is asked for.
 * Checked against the time the fields last changed.
 */
export const $publishOrRequestScheduleProblem = computed(
    [$isPublishOrRequestScheduleOpen, $publishOrRequestFields],
    (isOpen, { scheduleFrom, scheduleTo }): PublishOrRequestScheduleProblem | undefined =>
        isOpen ? getScheduleProblem(scheduleFrom, scheduleTo, new Date()) : undefined,
);

/**
 * Whether each field shows and is required. It reads no typed value, so typing in a field
 * leaves it as it is.
 */
export const $publishOrRequestFieldStates = computed(
    [
        $publishOrRequestCapability,
        $hasPublishOrRequestBlockedItems,
        $isPublishOrRequestSchedulable,
        $isPublishOrRequestAssignOpen,
        $isPublishOrRequestScheduleOpen,
    ],
    (capability, hasBlockedItems, schedulable, isAssignOpen, isScheduleOpen): PublishOrRequestFieldStates => ({
        assign: getAssignFieldState(capability, hasBlockedItems),
        schedule: getScheduleFieldState(schedulable),
        title: getTitleFieldState(isAssignOpen),
        comment: getCommentFieldState(isAssignOpen, isScheduleOpen),
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

// Hidden while nothing to publish can be scheduled. Never required.
function getScheduleFieldState(schedulable: boolean): PublishOrRequestFieldState {
    return schedulable ? OPTIONAL_FIELD_STATE : HIDDEN_FIELD_STATE;
}

// The title of the publish request: asked for with the assignees, and never without them.
function getTitleFieldState(isAssignOpen: boolean): PublishOrRequestFieldState {
    return isAssignOpen ? REQUIRED_FIELD_STATE : HIDDEN_FIELD_STATE;
}

// Always shown. Required with the assignees or the schedule, to say what the request or the
// schedule is about.
function getCommentFieldState(isAssignOpen: boolean, isScheduleOpen: boolean): PublishOrRequestFieldState {
    return isAssignOpen || isScheduleOpen ? REQUIRED_FIELD_STATE : OPTIONAL_FIELD_STATE;
}

// Without "online to" the items stay online, so nothing can be wrong. Without "online from"
// they go online now.
function getScheduleProblem(
    from: Date | undefined,
    to: Date | undefined,
    now: Date,
): PublishOrRequestScheduleProblem | undefined {
    if (to == null) return undefined;
    if (to.getTime() <= now.getTime()) return 'to-in-past';

    return to.getTime() <= (from ?? now).getTime() ? 'to-not-after-from' : undefined;
}

// A hidden field is never open. A required one is open whatever the user ticked.
function isFieldOpen({ visible, required }: PublishOrRequestFieldState, checked: boolean): boolean {
    return visible && (required || checked);
}
