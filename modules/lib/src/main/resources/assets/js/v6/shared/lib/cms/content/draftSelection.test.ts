import { describe, expect, it } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import {
    type DraftSelectionState,
    commitDraftSelection,
    isDraftSelectionSynced,
    revertDraftSelection,
    withIdExcluded,
} from './draftSelection';

const id = (value: string): ContentId => new ContentId(value);
const ids = (...values: string[]): ContentId[] => values.map(id);
const toStrings = (list: ContentId[]): string[] => list.map((item) => item.toString());

const state = (overrides: Partial<DraftSelectionState> = {}): DraftSelectionState => ({
    excludeChildrenIds: [],
    excludedDependantIds: [],
    appliedExcludeChildrenIds: [],
    appliedExcludedDependantIds: [],
    ...overrides,
});

describe('draftSelection', () => {
    describe('isDraftSelectionSynced', () => {
        it('should be true when both axes match the applied selection', () => {
            const result = isDraftSelectionSynced(
                state({
                    excludeChildrenIds: ids('a'),
                    appliedExcludeChildrenIds: ids('a'),
                    excludedDependantIds: ids('dep'),
                    appliedExcludedDependantIds: ids('dep'),
                }),
            );

            expect(result).toBe(true);
        });

        it('should be false when the children axis diverges', () => {
            expect(isDraftSelectionSynced(state({ excludeChildrenIds: ids('a') }))).toBe(false);
        });

        it('should be false when the dependant axis diverges', () => {
            expect(isDraftSelectionSynced(state({ excludedDependantIds: ids('dep') }))).toBe(false);
        });

        it('should ignore ordering differences', () => {
            const result = isDraftSelectionSynced(
                state({
                    excludeChildrenIds: ids('a', 'b'),
                    appliedExcludeChildrenIds: ids('b', 'a'),
                }),
            );

            expect(result).toBe(true);
        });
    });

    describe('commitDraftSelection', () => {
        it('should advance the applied fields to the draft', () => {
            const result = commitDraftSelection(
                state({ excludeChildrenIds: ids('a'), excludedDependantIds: ids('dep') }),
            );

            expect(toStrings(result.appliedExcludeChildrenIds)).toEqual(['a']);
            expect(toStrings(result.appliedExcludedDependantIds)).toEqual(['dep']);
        });
    });

    describe('revertDraftSelection', () => {
        it('should restore the draft fields from the applied selection', () => {
            const result = revertDraftSelection(
                state({
                    excludeChildrenIds: ids('a'),
                    excludedDependantIds: ids('dep'),
                    appliedExcludeChildrenIds: ids('b'),
                    appliedExcludedDependantIds: [],
                }),
            );

            expect(toStrings(result.excludeChildrenIds)).toEqual(['b']);
            expect(result.excludedDependantIds).toHaveLength(0);
        });

        it('should round-trip with commitDraftSelection', () => {
            const staged = state({ excludeChildrenIds: ids('a'), appliedExcludeChildrenIds: ids('b') });
            const committed = { ...staged, ...commitDraftSelection(staged) };

            expect(isDraftSelectionSynced(committed)).toBe(true);
            expect(isDraftSelectionSynced({ ...staged, ...revertDraftSelection(staged) })).toBe(true);
        });
    });

    describe('withIdExcluded', () => {
        it('should add an id that is not excluded yet', () => {
            expect(toStrings(withIdExcluded(ids('a'), id('b'), true))).toEqual(['a', 'b']);
        });

        it('should remove an id that is currently excluded', () => {
            expect(toStrings(withIdExcluded(ids('a', 'b'), id('a'), false))).toEqual(['b']);
        });

        it('should return the same reference when the id is already excluded', () => {
            const current = ids('a');

            expect(withIdExcluded(current, id('a'), true)).toBe(current);
        });

        it('should return the same reference when the id is already absent', () => {
            const current = ids('a');

            expect(withIdExcluded(current, id('b'), false)).toBe(current);
        });
    });
});
