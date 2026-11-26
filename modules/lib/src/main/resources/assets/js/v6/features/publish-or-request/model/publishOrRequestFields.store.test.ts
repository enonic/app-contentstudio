import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from './publishOrRequestDialog.store';
import {
    $isPublishOrRequestAssignOpen,
    $isPublishOrRequestScheduleOpen,
    $publishOrRequestFieldStates,
    $publishOrRequestFields,
    INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE,
} from './publishOrRequestFields.store';

const { mockCanRequestPublish } = vi.hoisted(() => ({ mockCanRequestPublish: vi.fn() }));

vi.mock('../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: mockCanRequestPublish },
}));

const HIDDEN = { visible: false, required: false };
const OPTIONAL = { visible: true, required: false };
const REQUIRED = { visible: true, required: true };

const MAIN_ITEM = { getId: () => 'main', getContentId: () => new ContentId('main') } as unknown as ContentSummary;

// One main item and what the user cannot publish. The role is read when the dialog state
// changes, so it is set before the state.
const setDialog = (canRequest: boolean, blocked: string[] = []): void => {
    mockCanRequestPublish.mockReturnValue(canRequest);
    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        items: [MAIN_ITEM],
        notPublishableIds: blocked.map((id) => new ContentId(id)),
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
        it('should stay the same value while the user types and ticks', () => {
            const before = $publishOrRequestFieldStates.get();

            $publishOrRequestFields.setKey('comment', 'Typed');
            $publishOrRequestFields.setKey('assignChecked', true);

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

        it('should show the other fields and require none of them', () => {
            expect($publishOrRequestFieldStates.get()).toMatchObject({
                schedule: OPTIONAL,
                title: OPTIONAL,
                comment: OPTIONAL,
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
    });
});
