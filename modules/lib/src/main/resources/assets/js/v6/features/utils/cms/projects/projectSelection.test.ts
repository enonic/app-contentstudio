import {describe, expect, it} from 'vitest';
import {resolveActiveProjectId, resolveActiveProjectIdAfterDeletion} from './projectSelection';

type MockProject = {
    getName(): string;
    getParents(): string[];
};

const createProject = (name: string, parents: string[] = []): MockProject => ({
    getName: () => name,
    getParents: () => parents,
});

describe('resolveActiveProjectId', () => {
    it('should pick the only remaining project', () => {
        expect(resolveActiveProjectId([createProject('alpha')], 'missing')).toBe('alpha');
    });

    it('should use the project from the url when it exists', () => {
        expect(resolveActiveProjectId([createProject('alpha'), createProject('beta')], 'beta')).toBe('beta');
    });

    it('should require manual selection when multiple projects remain and url does not match', () => {
        expect(resolveActiveProjectId([createProject('alpha'), createProject('beta')], 'missing')).toBeUndefined();
    });
});

describe('resolveActiveProjectIdAfterDeletion', () => {
    it('should select the parent project after deleting a child project', () => {
        const remainingProjects = [createProject('parent'), createProject('sibling')];
        const deletedProject = createProject('child', ['parent']);

        expect(resolveActiveProjectIdAfterDeletion(remainingProjects, deletedProject)).toBe('parent');
    });

    it('should select the first remaining project when the deleted project has no parent', () => {
        const remainingProjects = [createProject('alpha'), createProject('beta')];
        const deletedProject = createProject('orphan');

        expect(resolveActiveProjectIdAfterDeletion(remainingProjects, deletedProject)).toBe('alpha');
    });

    it('should return undefined when there are no projects left', () => {
        expect(resolveActiveProjectIdAfterDeletion([], createProject('orphan'))).toBeUndefined();
    });
});
