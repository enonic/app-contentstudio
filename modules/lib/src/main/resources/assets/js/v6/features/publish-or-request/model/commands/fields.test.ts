import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $publishOrRequestFields, INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE } from '../publishOrRequestFields.store';
import {
    setPublishOrRequestAssignChecked,
    setPublishOrRequestAssignees,
    setPublishOrRequestComment,
    setPublishOrRequestScheduleChecked,
    setPublishOrRequestScheduleFrom,
    setPublishOrRequestScheduleFromError,
    setPublishOrRequestScheduleTo,
    setPublishOrRequestScheduleToError,
    setPublishOrRequestTitle,
} from './fields';

const FROM = new Date('2030-01-01T08:00:00Z');
const TO = new Date('2030-02-01T08:00:00Z');

describe('publish or request dialog fields commands', () => {
    beforeEach(() => {
        $publishOrRequestFields.set({ ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('assign to', () => {
        it('should keep whether the field is ticked', () => {
            setPublishOrRequestAssignChecked(true);

            expect($publishOrRequestFields.get().assignChecked).toBe(true);
        });

        it('should keep the assignees when the field is unticked', () => {
            setPublishOrRequestAssignChecked(true);
            setPublishOrRequestAssignees(['user:system:a']);

            setPublishOrRequestAssignChecked(false);

            expect($publishOrRequestFields.get()).toMatchObject({
                assignChecked: false,
                assigneeIds: ['user:system:a'],
            });
        });

        it('should replace the assignees', () => {
            setPublishOrRequestAssignees(['user:system:a']);

            setPublishOrRequestAssignees(['user:system:b', 'user:system:c']);

            expect($publishOrRequestFields.get().assigneeIds).toEqual(['user:system:b', 'user:system:c']);
        });

        it('should keep its own copy of the assignees', () => {
            const assigneeIds = ['user:system:a'];

            setPublishOrRequestAssignees(assigneeIds);
            assigneeIds.push('user:system:b');

            expect($publishOrRequestFields.get().assigneeIds).toEqual(['user:system:a']);
        });
    });

    describe('scheduled publish', () => {
        it('should keep whether the field is ticked', () => {
            setPublishOrRequestScheduleChecked(true);

            expect($publishOrRequestFields.get().scheduleChecked).toBe(true);
        });

        it('should keep the dates when the field is unticked', () => {
            setPublishOrRequestScheduleChecked(true);
            setPublishOrRequestScheduleFrom(FROM);
            setPublishOrRequestScheduleTo(TO);

            setPublishOrRequestScheduleChecked(false);

            expect($publishOrRequestFields.get()).toMatchObject({
                scheduleChecked: false,
                scheduleFrom: FROM,
                scheduleTo: TO,
            });
        });

        it('should clear a date', () => {
            setPublishOrRequestScheduleFrom(FROM);
            setPublishOrRequestScheduleTo(TO);

            setPublishOrRequestScheduleFrom(undefined);
            setPublishOrRequestScheduleTo(undefined);

            expect($publishOrRequestFields.get().scheduleFrom).toBeUndefined();
            expect($publishOrRequestFields.get().scheduleTo).toBeUndefined();
        });

        it('should keep what each input reports, one apart from the other', () => {
            setPublishOrRequestScheduleFromError('Bad from');
            setPublishOrRequestScheduleToError('Bad to');

            setPublishOrRequestScheduleFromError(undefined);

            expect($publishOrRequestFields.get().scheduleFromError).toBeUndefined();
            expect($publishOrRequestFields.get().scheduleToError).toBe('Bad to');
        });
    });

    describe('title and comment', () => {
        it('should set the title as typed', () => {
            setPublishOrRequestTitle(' Spring campaign ');

            expect($publishOrRequestFields.get().title).toBe(' Spring campaign ');
        });

        it('should set the comment as typed', () => {
            setPublishOrRequestComment('Ready to go\n');

            expect($publishOrRequestFields.get().comment).toBe('Ready to go\n');
        });
    });

    it('should leave the other fields as they are', () => {
        setPublishOrRequestTitle('Title');

        setPublishOrRequestComment('Comment');

        expect($publishOrRequestFields.get()).toEqual({
            ...INITIAL_PUBLISH_OR_REQUEST_FIELDS_STATE,
            title: 'Title',
            comment: 'Comment',
        });
    });
});
