import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { $mode } from '../../../shared/app-state/mode.store';
import { $activeProject } from '../../project/activeProject.store';
import { clearAllContentCaches, setContent } from './content.commands';
import { $activeId, $selection, setActive, setSelection } from './content-selection.store';
import { $contextContent, setBrowseContextTarget } from './context-content.store';

const createContent = (id: string): ContentSummary => ({ getId: () => id }) as unknown as ContentSummary;

const A = createContent('a');
const B = createContent('b');
const C = createContent('c');

let unsubscribe: () => void;

beforeEach(() => {
    $activeProject.set({ getName: () => 'default' } as unknown as Project);
    clearAllContentCaches();
    [A, B, C].forEach((content) => setContent(content));
    $selection.set(new Set());
    $activeId.set(null);
    $mode.set('browser');
    unsubscribe = $contextContent.subscribe(() => undefined);
});

afterEach(() => {
    unsubscribe();
    $mode.set(null);
});

describe('setBrowseContextTarget', () => {
    it('should show the target over a checkbox selection', () => {
        setSelection(['a']);
        setActive('b');
        expect($contextContent.get()).toBe(A);

        setBrowseContextTarget('b');

        expect($contextContent.get()).toBe(B);
    });

    it('should fall back to the current item when the selection changes', () => {
        setSelection(['a']);
        setBrowseContextTarget('b');

        setSelection(['a', 'c']);

        expect($contextContent.get()).toBe(C);
    });

    it('should fall back to the current item when the active item changes', () => {
        setSelection(['a']);
        setBrowseContextTarget('b');

        setActive('c');

        expect($contextContent.get()).toBe(A);
    });

    it('should ignore a target that is not cached', () => {
        setSelection(['a']);

        setBrowseContextTarget('missing');

        expect($contextContent.get()).toBe(A);
    });
});
