import { render, waitFor } from '@testing-library/preact';
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../../../../../../app/settings/data/project/Project';
import { $projects } from '../../../../../entities/project/projects.store';
import { ProjectDag } from './ProjectDag';

vi.mock('@enonic/ui', () => ({
    cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    Skeleton: ({ className }: { className?: string }): ReactElement => (
        <div data-testid="skeleton" className={className} />
    ),
    IconButton: ({ 'aria-label': label }: { 'aria-label'?: string }): ReactElement => (
        <button type="button" aria-label={label} />
    ),
}));

function project(name: string, parents?: string[]): Project {
    return Project.create().setName(name).setDisplayName(name).setParents(parents).build();
}

function setProjects(loaded: boolean, projects: Project[]): void {
    $projects.set({
        projects,
        activeProjectId: undefined,
        loaded,
        resolved: loaded,
        loadError: false,
        noProjectMode: false,
    });
}

function getViewport(container: Element): Element | null {
    return container.querySelector('[data-component="ProjectDag"] > div');
}

function getTransform(container: Element): string | undefined {
    const layer = getViewport(container)?.firstElementChild;
    return layer instanceof HTMLElement ? layer.style.transform : undefined;
}

function wheelOverGraph(container: Element): void {
    getViewport(container)?.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true }));
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ProjectDag', () => {
    it('should still react to the wheel after the loading state ends', async () => {
        const projects = [project('default'), project('layer', ['default'])];
        setProjects(false, projects);

        const { container } = render(<ProjectDag />);
        setProjects(true, [...projects]);
        await waitFor(() => expect(getTransform(container)).toBeDefined());

        const before = getTransform(container);
        wheelOverGraph(container);

        await waitFor(() => expect(getTransform(container)).not.toBe(before));
    });
});
