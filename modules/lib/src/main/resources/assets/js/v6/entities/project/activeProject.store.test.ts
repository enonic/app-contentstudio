import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Project } from '../../../app/settings/data/project/Project';
import { $activeProject, onActiveProjectChanged, setActiveProject } from './activeProject.store';

function createProject(name: string): Readonly<Project> {
    const project = {
        getName: () => name,
        getDisplayName: () => name,
        getLanguage: () => '',
    };

    return project as unknown as Readonly<Project>;
}

describe('activeProject.store', () => {
    const handler = vi.fn();
    let unsubscribe: () => void;

    beforeEach(() => {
        setActiveProject(undefined);
        handler.mockClear();
        unsubscribe = onActiveProjectChanged(handler);
    });

    afterEach(() => {
        unsubscribe();
        vi.restoreAllMocks();
    });

    it('should notify handlers when the first project is set', () => {
        const project = createProject('default');

        setActiveProject(project);

        expect($activeProject.get()).toBe(project);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(project);
    });

    it('should notify handlers when the project is switched', () => {
        setActiveProject(createProject('default'));
        handler.mockClear();

        const other = createProject('other');
        setActiveProject(other);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(other);
    });

    it('should not notify handlers when the same project gets a new instance', () => {
        setActiveProject(createProject('default'));
        handler.mockClear();

        const reloaded = createProject('default');
        setActiveProject(reloaded);

        expect($activeProject.get()).toBe(reloaded);
        expect(handler).not.toHaveBeenCalled();
    });

    it('should not notify handlers when the project is cleared', () => {
        setActiveProject(createProject('default'));
        handler.mockClear();

        setActiveProject(undefined);

        expect($activeProject.get()).toBeUndefined();
        expect(handler).not.toHaveBeenCalled();
    });
});
