import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    $isPublishOrRequestAssignOpen,
    $isPublishOrRequestScheduleOpen,
    $publishOrRequestFieldStates,
    $publishOrRequestFields,
    INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE,
} from './publishOrRequestFields.store';

describe('publish or request fields store', () => {
    beforeEach(() => {
        $publishOrRequestFields.set({ ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE });
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
        it('should show every field and require none', () => {
            const optional = { visible: true, required: false };

            expect($publishOrRequestFieldStates.get()).toEqual({
                assign: optional,
                schedule: optional,
                title: optional,
                comment: optional,
            });
        });

        it('should stay the same value while the user types', () => {
            const before = $publishOrRequestFieldStates.get();

            $publishOrRequestFields.setKey('comment', 'Typed');

            expect($publishOrRequestFieldStates.get()).toBe(before);
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
