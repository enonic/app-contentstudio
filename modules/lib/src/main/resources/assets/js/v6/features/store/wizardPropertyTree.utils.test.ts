import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
    type ChangedPathsStore,
    addStringOccurrence,
    removeStringOccurrence,
    setStringValue,
} from './wizardPropertyTree.utils';

function createChangedPathsStore(): ChangedPathsStore & {value: Record<string, number>} {
    const store = {
        value: {} as Record<string, number>,
        get(): Record<string, number> {
            return store.value;
        },
        setKey(key: string, val: number | undefined): void {
            if (val === undefined) {
                const {[key]: _, ...rest} = store.value;
                store.value = rest;
            } else {
                store.value = {...store.value, [key]: val};
            }
        },
    };
    return store;
}

describe('setStringValue', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns false and clears path when clearing absent persisted field', () => {
        const draft = new PropertyTree();
        const persisted = new PropertyTree();
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('title', 1);

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('title'), '');

        expect(result).toBe(false);
        expect(changedPaths.value.title).toBeUndefined();
    });

    it('returns false and clears path when persisted field is explicit empty and draft matches', () => {
        const draft = new PropertyTree();
        draft.setStringByPath(PropertyPath.fromString('title'), '');
        const persisted = new PropertyTree();
        persisted.setStringByPath(PropertyPath.fromString('title'), '');
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('title', 1);

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('title'), '');

        expect(result).toBe(false);
        expect(changedPaths.value.title).toBeUndefined();
    });

    it('returns false when draft value already equals new value (no-op)', () => {
        const draft = new PropertyTree();
        draft.setStringByPath(PropertyPath.fromString('title'), 'hello');
        const persisted = new PropertyTree();
        persisted.setStringByPath(PropertyPath.fromString('title'), 'original');
        const changedPaths = createChangedPathsStore();

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('title'), 'hello');

        expect(result).toBe(false);
    });

    it('returns true and bumps path when value differs from persisted', () => {
        const draft = new PropertyTree();
        draft.setStringByPath(PropertyPath.fromString('title'), 'original');
        const persisted = new PropertyTree();
        persisted.setStringByPath(PropertyPath.fromString('title'), 'original');
        const changedPaths = createChangedPathsStore();

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('title'), 'changed');

        expect(result).toBe(true);
        expect(changedPaths.value.title).toBe(1);
        expect(draft.getString(PropertyPath.fromString('title'))).toBe('changed');
    });

    it('returns true and clears path when reverted to persisted value', () => {
        const draft = new PropertyTree();
        draft.setStringByPath(PropertyPath.fromString('title'), 'changed');
        const persisted = new PropertyTree();
        persisted.setStringByPath(PropertyPath.fromString('title'), 'original');
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('title', 1);

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('title'), 'original');

        expect(result).toBe(true);
        expect(changedPaths.value.title).toBeUndefined();
    });

    it('removes property and reconciles array when clearing indexed element to absent', () => {
        const draft = new PropertyTree();
        draft.addString('tags', 'a');
        draft.addString('tags', 'b');
        draft.addString('tags', 'extra');
        const persisted = new PropertyTree();
        persisted.addString('tags', 'a');
        persisted.addString('tags', 'b');
        const changedPaths = createChangedPathsStore();

        const result = setStringValue(draft, persisted, changedPaths, PropertyPath.fromString('tags[2]'), '');

        expect(result).toBe(true);
        expect(draft.getRoot().getPropertyArray('tags')?.getSize()).toBe(2);
        expect(changedPaths.value.tags).toBeUndefined();
        expect(changedPaths.value['tags[2]']).toBeUndefined();
    });

    it('restores null when clearing field whose persisted value is null', () => {
        const path = PropertyPath.fromString('title');
        const draft = new PropertyTree();
        draft.setStringByPath(path, 'Temporary');
        const persisted = new PropertyTree();
        persisted.setString('title', 0, null as unknown as string);
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('title', 1);

        const result = setStringValue(draft, persisted, changedPaths, path, '');

        expect(result).toBe(true);
        expect(draft.getProperty(path.toString())?.hasNullValue()).toBe(true);
        expect(changedPaths.value.title).toBeUndefined();
    });
});

describe('addStringOccurrence', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns false for negative index', () => {
        const draft = new PropertyTree();
        const changedPaths = createChangedPathsStore();

        const result = addStringOccurrence(draft, null, changedPaths, PropertyPath.fromString('tags'), -1);

        expect(result).toBe(false);
    });

    it('appends null and marks changed path when count mismatches persisted', () => {
        const draft = new PropertyTree();
        draft.addString('tags', 'a');
        draft.addString('tags', 'b');
        const persisted = new PropertyTree();
        persisted.addString('tags', 'a');
        persisted.addString('tags', 'b');
        const changedPaths = createChangedPathsStore();

        const result = addStringOccurrence(draft, persisted, changedPaths, PropertyPath.fromString('tags'), 2);

        expect(result).toBe(true);
        expect(draft.getRoot().getPropertyArray('tags')?.getSize()).toBe(3);
        expect(draft.getRoot().getPropertyArray('tags')?.get(2)?.getString()).toBeNull();
        expect(changedPaths.value.tags).toBe(1);
    });

    it('restores null occurrence when persisted value at index is null', () => {
        const draft = new PropertyTree();
        const persisted = new PropertyTree();
        persisted.setString('tags', 0, null as unknown as string);
        const changedPaths = createChangedPathsStore();

        const result = addStringOccurrence(draft, persisted, changedPaths, PropertyPath.fromString('tags'), 0);

        expect(result).toBe(true);
        expect(draft.getRoot().getPropertyArray('tags')?.get(0)?.hasNullValue()).toBe(true);
        expect(changedPaths.value.tags).toBeUndefined();
    });
});

describe('removeStringOccurrence', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns false for negative index', () => {
        const draft = new PropertyTree();
        const changedPaths = createChangedPathsStore();

        const result = removeStringOccurrence(draft, null, changedPaths, PropertyPath.fromString('tags'), -1);

        expect(result).toBe(false);
    });

    it('returns false for out-of-bounds index', () => {
        const draft = new PropertyTree();
        draft.addString('tags', 'a');
        const changedPaths = createChangedPathsStore();

        const result = removeStringOccurrence(draft, null, changedPaths, PropertyPath.fromString('tags'), 5);

        expect(result).toBe(false);
    });

    it('removes at index and clears changed path when back to persisted state', () => {
        const draft = new PropertyTree();
        draft.addString('tags', 'a');
        draft.addString('tags', 'b');
        draft.addString('tags', 'extra');
        const persisted = new PropertyTree();
        persisted.addString('tags', 'a');
        persisted.addString('tags', 'b');
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('tags', 1);

        const result = removeStringOccurrence(draft, persisted, changedPaths, PropertyPath.fromString('tags'), 2);

        expect(result).toBe(true);
        expect(draft.getRoot().getPropertyArray('tags')?.getSize()).toBe(2);
        expect(changedPaths.value.tags).toBeUndefined();
    });

    it('clears stale indexed changed-path keys via reconciliation', () => {
        const draft = new PropertyTree();
        draft.addString('tags', 'a');
        draft.addString('tags', 'b');
        draft.addString('tags', 'c');
        const persisted = new PropertyTree();
        persisted.addString('tags', 'a');
        persisted.addString('tags', 'b');
        persisted.addString('tags', 'c');
        const changedPaths = createChangedPathsStore();
        changedPaths.setKey('tags[1]', 1);
        changedPaths.setKey('tags[2]', 1);

        const result = removeStringOccurrence(draft, persisted, changedPaths, PropertyPath.fromString('tags'), 1);

        expect(result).toBe(true);
        expect(changedPaths.value['tags[1]']).toBeUndefined();
        expect(changedPaths.value['tags[2]']).toBeUndefined();
        // Count mismatch (2 vs 3), so base key should be set
        expect(changedPaths.value.tags).toBe(1);
    });
});
