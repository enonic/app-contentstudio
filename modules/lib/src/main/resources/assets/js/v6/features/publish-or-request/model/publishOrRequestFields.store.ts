// State of the fields on the second step of the publish or request dialog: what the user
// entered, and whether each field shows and is required. Kept apart from the dialog store,
// so typing in a field does not run again what is derived from the items.
// The commands that change this state live in `./commands/fields`.

import { computed, map } from 'nanostores';

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

// TODO: [#11792] Follow what the user may do and what the other fields hold.
/** Whether each field shows and is required. For now every field shows and none is required. */
export const $publishOrRequestFieldStates = computed(
    $publishOrRequestFields,
    (): PublishOrRequestFieldStates => OPTIONAL_FIELD_STATES,
);

/** True when the assignees are asked for: the field is required, or the user ticked it. */
export const $isPublishOrRequestAssignOpen = computed(
    [$publishOrRequestFieldStates, $publishOrRequestFields],
    ({ assign }, { assignChecked }): boolean => isFieldOpen(assign, assignChecked),
);

/** True when the schedule is asked for: the field is required, or the user ticked it. */
export const $isPublishOrRequestScheduleOpen = computed(
    [$publishOrRequestFieldStates, $publishOrRequestFields],
    ({ schedule }, { scheduleChecked }): boolean => isFieldOpen(schedule, scheduleChecked),
);

// *
// * Internal
// *

const OPTIONAL_FIELD_STATE: PublishOrRequestFieldState = { visible: true, required: false };

const OPTIONAL_FIELD_STATES: PublishOrRequestFieldStates = {
    assign: OPTIONAL_FIELD_STATE,
    schedule: OPTIONAL_FIELD_STATE,
    title: OPTIONAL_FIELD_STATE,
    comment: OPTIONAL_FIELD_STATE,
};

// A hidden field is never open. A required one is open whatever the user ticked.
function isFieldOpen({ visible, required }: PublishOrRequestFieldState, checked: boolean): boolean {
    return visible && (required || checked);
}
