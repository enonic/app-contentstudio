import { Input, InputTypeName, Occurrences } from '@enonic/input-types/schema';
import { cleanup, render, screen } from '@testing-library/preact';
import { atom } from 'nanostores';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../entities/content', () => ({ $contextContent: atom<unknown>(null) }));
vi.mock('../../../entities/project', () => ({ $activeProject: atom<unknown>(undefined) }));

import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { $contextContent } from '../../../entities/content';
import { $activeProject } from '../../../entities/project';
import { FormScopeProvider, useFormScope, useFormScopeRequirement } from './FormScopeContext';

const storeProject = { getName: () => 'store-project' } as unknown as Project;
const storeContent = { getId: () => 'store-content' } as unknown as ContentSummary;
const ownProject = { getName: () => 'own-project' } as unknown as Project;
const ownContent = { getId: () => 'own-content' } as unknown as ContentSummary;

const setStores = (project: Project | undefined, content: ContentSummary | null): void => {
    ($activeProject as unknown as { set: (value: unknown) => void }).set(project);
    ($contextContent as unknown as { set: (value: unknown) => void }).set(content);
};

const Probe = (): ReactElement => {
    const { project, content } = useFormScope();
    return (
        <div
            data-testid="probe"
            data-project={project?.getName() ?? 'none'}
            data-content={content?.getId() ?? 'none'}
        />
    );
};

const probe = (): { project: string; content: string } => {
    const { project, content } = screen.getByTestId('probe').dataset;
    return { project: project ?? '', content: content ?? '' };
};

const testInput = Input.create()
    .setName('myImage')
    .setInputType(new InputTypeName('ImageSelector'))
    .setLabel('My image')
    .setOccurrences(Occurrences.minmax(0, 1))
    .build();

type RequirementProbeProps = { project?: boolean; content?: boolean };

const RequirementProbe = ({ project, content }: RequirementProbeProps): ReactElement => {
    const { enabled, missing } = useFormScopeRequirement(testInput, { project, content });
    return <div data-testid="requirement" data-enabled={enabled} data-missing={missing.join(',')} />;
};

describe('FormScopeContext', () => {
    beforeEach(() => {
        setStores(storeProject, storeContent);
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('useFormScope', () => {
        it('should fall back to the stores without a provider', () => {
            render(<Probe />);

            expect(probe()).toEqual({ project: 'store-project', content: 'store-content' });
        });

        it('should fall back to the stores for keys the provider does not set', () => {
            render(
                <FormScopeProvider>
                    <Probe />
                </FormScopeProvider>,
            );

            expect(probe()).toEqual({ project: 'store-project', content: 'store-content' });
        });

        it('should return none for an explicit null even when the stores have values', () => {
            render(
                <FormScopeProvider project={null} content={null}>
                    <Probe />
                </FormScopeProvider>,
            );

            expect(probe()).toEqual({ project: 'none', content: 'none' });
        });

        it('should return the provided values over the stores', () => {
            render(
                <FormScopeProvider project={ownProject} content={ownContent}>
                    <Probe />
                </FormScopeProvider>,
            );

            expect(probe()).toEqual({ project: 'own-project', content: 'own-content' });
        });

        it('should keep the outer scope in a nested provider without props', () => {
            render(
                <FormScopeProvider project={null} content={null}>
                    <FormScopeProvider>
                        <Probe />
                    </FormScopeProvider>
                </FormScopeProvider>,
            );

            expect(probe()).toEqual({ project: 'none', content: 'none' });
        });

        it('should override only the keys a nested provider sets', () => {
            render(
                <FormScopeProvider project={null} content={null}>
                    <FormScopeProvider project={ownProject}>
                        <Probe />
                    </FormScopeProvider>
                </FormScopeProvider>,
            );

            expect(probe()).toEqual({ project: 'own-project', content: 'none' });
        });
    });

    describe('useFormScopeRequirement', () => {
        it('should be enabled and silent when the scope has what is required', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            render(<RequirementProbe project content />);

            const { enabled, missing } = screen.getByTestId('requirement').dataset;
            expect(enabled).toBe('true');
            expect(missing).toBe('');
            expect(warn).not.toHaveBeenCalled();
        });

        it('should be disabled, list what is missing and warn once per mount', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            const { rerender } = render(
                <FormScopeProvider project={null} content={null}>
                    <RequirementProbe project content />
                </FormScopeProvider>,
            );
            rerender(
                <FormScopeProvider project={null} content={null}>
                    <RequirementProbe project content />
                </FormScopeProvider>,
            );

            const { enabled, missing } = screen.getByTestId('requirement').dataset;
            expect(enabled).toBe('false');
            expect(missing).toBe('project,content');
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0]?.[0]).toBe(
                "ImageSelector 'myImage' is disabled: the form scope has no project and no content.",
            );
        });

        it('should only require what the input asks for', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            render(
                <FormScopeProvider content={null}>
                    <RequirementProbe project />
                </FormScopeProvider>,
            );

            expect(screen.getByTestId('requirement').dataset.enabled).toBe('true');
        });
    });
});
