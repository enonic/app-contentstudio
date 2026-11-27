import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from './publishOrRequestDialog.store';
import {
    $isPublishOrRequestAssignOpen,
    $isPublishOrRequestScheduleOpen,
    $publishOrRequestAction,
    $publishOrRequestFieldStates,
    $publishOrRequestFields,
    $publishOrRequestScheduleProblem,
    INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE,
} from './publishOrRequestFields.store';

const { mockCanRequestPublish } = vi.hoisted(() => ({ mockCanRequestPublish: vi.fn() }));

vi.mock('../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: mockCanRequestPublish },
}));

const HIDDEN = { visible: false, required: false };
const OPTIONAL = { visible: true, required: false };
const REQUIRED = { visible: true, required: true };

const NOW = new Date('2030-01-10T12:00:00Z');
const YESTERDAY = new Date('2030-01-09T12:00:00Z');
const TOMORROW = new Date('2030-01-11T12:00:00Z');
const NEXT_WEEK = new Date('2030-01-17T12:00:00Z');

const MAIN_ITEM = { getId: () => 'main', getContentId: () => new ContentId('main') } as unknown as ContentSummary;

// One main item that can be scheduled, and what the user cannot publish. The role is read
// when the dialog state changes, so it is set before the state.
const setDialog = (canRequest: boolean, blocked: string[] = []): void => {
    mockCanRequestPublish.mockReturnValue(canRequest);
    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        items: [MAIN_ITEM],
        notPublishableIds: blocked.map((id) => new ContentId(id)),
        schedulable: true,
    });
};

describe('publish or request fields store', () => {
    beforeEach(() => {
        $publishOrRequestFields.set({ ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE });
        // A user who can publish everything listed and can request too.
        setDialog(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('$publishOrRequestFields', () => {
        it('should start with nothing ticked and nothing entered', () => {
            expect($publishOrRequestFields.get()).toEqual({
                assignChecked: false,
                assigneeIds: [],
                scheduleChecked: false,
                scheduleFrom: undefined,
                scheduleTo: undefined,
                scheduleFromError: undefined,
                scheduleToError: undefined,
                title: '',
                comment: '',
            });
        });
    });

    describe('$publishOrRequestFieldStates', () => {
        it('should stay the same value while the user types', () => {
            const before = $publishOrRequestFieldStates.get();

            $publishOrRequestFields.setKey('title', 'Typed');
            $publishOrRequestFields.setKey('comment', 'Typed');

            expect($publishOrRequestFieldStates.get()).toBe(before);
        });

        it('should stay the same value while the user picks assignees and dates', () => {
            $publishOrRequestFields.setKey('assignChecked', true);
            $publishOrRequestFields.setKey('scheduleChecked', true);
            const before = $publishOrRequestFieldStates.get();

            $publishOrRequestFields.setKey('assigneeIds', ['user:system:a']);
            $publishOrRequestFields.setKey('scheduleFrom', TOMORROW);
            $publishOrRequestFields.setKey('scheduleTo', NEXT_WEEK);

            expect($publishOrRequestFieldStates.get()).toBe(before);
        });

        describe('assign', () => {
            it('should be optional for a user who can publish everything listed and can request', () => {
                expect($publishOrRequestFieldStates.get().assign).toEqual(OPTIONAL);
            });

            it('should be required for a user who can only request', () => {
                setDialog(true, ['main']);

                expect($publishOrRequestFieldStates.get().assign).toEqual(REQUIRED);
            });

            it('should be required while a dependency the user cannot publish is listed', () => {
                setDialog(true, ['dependency']);

                expect($publishOrRequestFieldStates.get().assign).toEqual(REQUIRED);
            });

            it('should be optional again once that dependency is gone', () => {
                setDialog(true, ['dependency']);

                $publishOrRequestDialog.setKey('notPublishableIds', []);

                expect($publishOrRequestFieldStates.get().assign).toEqual(OPTIONAL);
            });

            it('should be hidden for a user who can only publish', () => {
                setDialog(false);

                expect($publishOrRequestFieldStates.get().assign).toEqual(HIDDEN);
            });

            it('should stay hidden for that user while a dependency they cannot publish is listed', () => {
                setDialog(false, ['dependency']);

                expect($publishOrRequestFieldStates.get().assign).toEqual(HIDDEN);
            });

            it('should be hidden for a user who can neither publish nor request', () => {
                setDialog(false, ['main']);

                expect($publishOrRequestFieldStates.get().assign).toEqual(HIDDEN);
            });
        });

        describe('schedule', () => {
            it('should be optional while something to publish can be scheduled', () => {
                expect($publishOrRequestFieldStates.get().schedule).toEqual(OPTIONAL);
            });

            it('should be hidden while nothing to publish can be scheduled', () => {
                $publishOrRequestDialog.setKey('schedulable', false);

                expect($publishOrRequestFieldStates.get().schedule).toEqual(HIDDEN);
            });

            it('should be optional for a user who can only request', () => {
                setDialog(true, ['main']);

                expect($publishOrRequestFieldStates.get().schedule).toEqual(OPTIONAL);
            });
        });

        describe('title', () => {
            it('should be hidden while "Assign to" is unticked', () => {
                expect($publishOrRequestFieldStates.get().title).toEqual(HIDDEN);
            });

            it('should be required once "Assign to" is ticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);

                expect($publishOrRequestFieldStates.get().title).toEqual(REQUIRED);
            });

            it('should be hidden again once "Assign to" is unticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);

                $publishOrRequestFields.setKey('assignChecked', false);

                expect($publishOrRequestFieldStates.get().title).toEqual(HIDDEN);
            });

            it('should be required while "Assign to" is required, ticked or not', () => {
                setDialog(true, ['main']);

                expect($publishOrRequestFieldStates.get().title).toEqual(REQUIRED);
            });

            it('should be hidden while "Assign to" is hidden, even if ticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);

                setDialog(false);

                expect($publishOrRequestFieldStates.get().title).toEqual(HIDDEN);
            });

            it('should not follow the schedule checkbox', () => {
                $publishOrRequestFields.setKey('scheduleChecked', true);

                expect($publishOrRequestFieldStates.get().title).toEqual(HIDDEN);
            });
        });

        describe('comment', () => {
            it('should be optional while neither "Assign to" nor "Scheduled publish" is ticked', () => {
                expect($publishOrRequestFieldStates.get().comment).toEqual(OPTIONAL);
            });

            it('should be required once "Assign to" is ticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);

                expect($publishOrRequestFieldStates.get().comment).toEqual(REQUIRED);
            });

            it('should be required once "Scheduled publish" is ticked', () => {
                $publishOrRequestFields.setKey('scheduleChecked', true);

                expect($publishOrRequestFieldStates.get().comment).toEqual(REQUIRED);
            });

            it('should stay required while one of the two is still ticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);
                $publishOrRequestFields.setKey('scheduleChecked', true);

                $publishOrRequestFields.setKey('assignChecked', false);

                expect($publishOrRequestFieldStates.get().comment).toEqual(REQUIRED);
            });

            it('should be optional again once both are unticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);
                $publishOrRequestFields.setKey('scheduleChecked', true);

                $publishOrRequestFields.setKey('assignChecked', false);
                $publishOrRequestFields.setKey('scheduleChecked', false);

                expect($publishOrRequestFieldStates.get().comment).toEqual(OPTIONAL);
            });

            it('should be required while "Assign to" is required, ticked or not', () => {
                setDialog(true, ['main']);

                expect($publishOrRequestFieldStates.get().comment).toEqual(REQUIRED);
            });

            it('should be optional while both are hidden, even if ticked', () => {
                $publishOrRequestFields.setKey('assignChecked', true);
                $publishOrRequestFields.setKey('scheduleChecked', true);

                setDialog(false);
                $publishOrRequestDialog.setKey('schedulable', false);

                expect($publishOrRequestFieldStates.get().comment).toEqual(OPTIONAL);
            });
        });
    });

    describe('$isPublishOrRequestAssignOpen', () => {
        it('should be false while the user has not ticked the field', () => {
            expect($isPublishOrRequestAssignOpen.get()).toBe(false);
        });

        it('should be true once the user ticks the field', () => {
            $publishOrRequestFields.setKey('assignChecked', true);

            expect($isPublishOrRequestAssignOpen.get()).toBe(true);
        });

        it('should not follow the schedule checkbox', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);

            expect($isPublishOrRequestAssignOpen.get()).toBe(false);
        });

        it('should be true while the field is required, ticked or not', () => {
            setDialog(true, ['dependency']);

            expect($isPublishOrRequestAssignOpen.get()).toBe(true);
        });

        it('should be false while the field is hidden, even if ticked', () => {
            $publishOrRequestFields.setKey('assignChecked', true);

            setDialog(false);

            expect($isPublishOrRequestAssignOpen.get()).toBe(false);
        });

        it('should go back to a ticked field once it is no longer required', () => {
            $publishOrRequestFields.setKey('assignChecked', true);
            setDialog(true, ['dependency']);

            $publishOrRequestDialog.setKey('notPublishableIds', []);

            expect($publishOrRequestFields.get().assignChecked).toBe(true);
            expect($isPublishOrRequestAssignOpen.get()).toBe(true);
        });

        it('should go back to an unticked field once it is no longer required', () => {
            setDialog(true, ['dependency']);

            $publishOrRequestDialog.setKey('notPublishableIds', []);

            expect($publishOrRequestFields.get().assignChecked).toBe(false);
            expect($isPublishOrRequestAssignOpen.get()).toBe(false);
        });
    });

    describe('$isPublishOrRequestScheduleOpen', () => {
        it('should be false while the user has not ticked the field', () => {
            expect($isPublishOrRequestScheduleOpen.get()).toBe(false);
        });

        it('should be true once the user ticks the field', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);

            expect($isPublishOrRequestScheduleOpen.get()).toBe(true);
        });

        it('should not follow the assign checkbox', () => {
            $publishOrRequestFields.setKey('assignChecked', true);

            expect($isPublishOrRequestScheduleOpen.get()).toBe(false);
        });

        it('should be false while the field is hidden, even if ticked', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);

            $publishOrRequestDialog.setKey('schedulable', false);

            expect($isPublishOrRequestScheduleOpen.get()).toBe(false);
        });

        it('should go back to a ticked field once it shows again', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);
            $publishOrRequestDialog.setKey('schedulable', false);

            $publishOrRequestDialog.setKey('schedulable', true);

            expect($publishOrRequestFields.get().scheduleChecked).toBe(true);
            expect($isPublishOrRequestScheduleOpen.get()).toBe(true);
        });
    });

    describe('$publishOrRequestAction', () => {
        it('should be publish while nothing is ticked', () => {
            expect($publishOrRequestAction.get()).toBe('publish');
        });

        it('should be schedule once "Scheduled publish" is ticked', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);

            expect($publishOrRequestAction.get()).toBe('schedule');
        });

        it('should be request once "Assign to" is ticked', () => {
            $publishOrRequestFields.setKey('assignChecked', true);

            expect($publishOrRequestAction.get()).toBe('request');
        });

        it('should be request while both are ticked', () => {
            $publishOrRequestFields.setKey('assignChecked', true);
            $publishOrRequestFields.setKey('scheduleChecked', true);

            expect($publishOrRequestAction.get()).toBe('request');
        });

        it('should go back to schedule once "Assign to" is unticked', () => {
            $publishOrRequestFields.setKey('assignChecked', true);
            $publishOrRequestFields.setKey('scheduleChecked', true);

            $publishOrRequestFields.setKey('assignChecked', false);

            expect($publishOrRequestAction.get()).toBe('schedule');
        });

        it('should be request for a user who can only request, ticked or not', () => {
            setDialog(true, ['main']);

            expect($publishOrRequestAction.get()).toBe('request');
        });

        it('should be request while a dependency the user cannot publish is listed', () => {
            setDialog(true, ['dependency']);

            expect($publishOrRequestAction.get()).toBe('request');
        });

        it('should be publish for a user who can only publish, even with "Assign to" ticked', () => {
            $publishOrRequestFields.setKey('assignChecked', true);

            setDialog(false);

            expect($publishOrRequestAction.get()).toBe('publish');
        });

        it('should be publish while nothing can be scheduled, even with "Scheduled publish" ticked', () => {
            $publishOrRequestFields.setKey('scheduleChecked', true);

            $publishOrRequestDialog.setKey('schedulable', false);

            expect($publishOrRequestAction.get()).toBe('publish');
        });

        it('should not follow what the user types and picks', () => {
            $publishOrRequestFields.setKey('title', 'Typed');
            $publishOrRequestFields.setKey('comment', 'Typed');
            $publishOrRequestFields.setKey('assigneeIds', ['user:system:a']);
            $publishOrRequestFields.setKey('scheduleFrom', TOMORROW);

            expect($publishOrRequestAction.get()).toBe('publish');
        });
    });

    describe('$publishOrRequestScheduleProblem', () => {
        const setSchedule = (from: Date | undefined, to: Date | undefined): void => {
            $publishOrRequestFields.set({
                ...$publishOrRequestFields.get(),
                scheduleChecked: true,
                scheduleFrom: from,
                scheduleTo: to,
            });
        };

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should find nothing wrong while no date is entered', () => {
            setSchedule(undefined, undefined);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should find nothing wrong with "online from" alone, even in the past', () => {
            setSchedule(YESTERDAY, undefined);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should find nothing wrong with "online to" after "online from"', () => {
            setSchedule(TOMORROW, NEXT_WEEK);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should find nothing wrong with a coming "online to" alone', () => {
            setSchedule(undefined, TOMORROW);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should tell when "online to" has passed', () => {
            setSchedule(undefined, YESTERDAY);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-in-past');
        });

        it('should tell when "online to" is now', () => {
            setSchedule(undefined, NOW);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-in-past');
        });

        it('should tell that "online to" has passed rather than that it is before "online from"', () => {
            setSchedule(TOMORROW, YESTERDAY);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-in-past');
        });

        it('should tell when "online to" is before "online from"', () => {
            setSchedule(NEXT_WEEK, TOMORROW);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-not-after-from');
        });

        it('should tell when "online to" is "online from"', () => {
            setSchedule(TOMORROW, TOMORROW);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-not-after-from');
        });

        it('should find nothing wrong while the field is unticked', () => {
            setSchedule(NEXT_WEEK, TOMORROW);

            $publishOrRequestFields.setKey('scheduleChecked', false);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should find nothing wrong while the field is hidden', () => {
            setSchedule(NEXT_WEEK, TOMORROW);

            $publishOrRequestDialog.setKey('schedulable', false);

            expect($publishOrRequestScheduleProblem.get()).toBeUndefined();
        });

        it('should tell again once the field is ticked again', () => {
            setSchedule(NEXT_WEEK, TOMORROW);
            $publishOrRequestFields.setKey('scheduleChecked', false);

            $publishOrRequestFields.setKey('scheduleChecked', true);

            expect($publishOrRequestScheduleProblem.get()).toBe('to-not-after-from');
        });
    });
});
