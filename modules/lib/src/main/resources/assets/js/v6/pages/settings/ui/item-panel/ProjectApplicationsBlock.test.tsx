import { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { cleanup, render, screen } from '@testing-library/preact';
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../../../../../app/settings/data/project/Project';
import { ProjectViewItem } from '../../../../../app/settings/view/ProjectViewItem';
import { $applications, loadApplications } from '../../../../entities/application/applications.store';
import { type Application } from '../../../../entities/application';
import { ProjectApplicationsBlock } from './ProjectApplicationsBlock';

vi.mock('@enonic/ui', () => ({
    cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    Separator: ({ label }: { label: string }): ReactElement => <h3>{label}</h3>,
}));

vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string, ...values: unknown[]) => [key, ...values].join(':'),
}));

vi.mock('../../../../entities/application/applications.store', async () => {
    const { map } = await import('nanostores');
    return {
        $applications: map({ applications: [], loading: false, loaded: false }),
        loadApplications: vi.fn(),
        reloadApplications: vi.fn(),
    };
});

function app(key: string, displayName: string, description?: string): Application {
    return { key, displayName, description, state: 'started' };
}

function item(appKeys: string[]): ProjectViewItem {
    const siteConfigs = appKeys.map((key) =>
        ApplicationConfig.create().setApplicationKey(ApplicationKey.fromString(key)).build(),
    );
    const project = Project.create().setName('default').setDisplayName('Default').setSiteConfigs(siteConfigs).build();
    return ProjectViewItem.create().setData(project).build();
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    $applications.set({ applications: [], loading: false, loaded: false });
});

describe('ProjectApplicationsBlock', () => {
    it('renders nothing when the project has no applications', () => {
        const { container } = render(<ProjectApplicationsBlock item={item([])} />);

        expect(container.firstChild).toBeNull();
    });

    it('leaves the portal config out', () => {
        const { container } = render(<ProjectApplicationsBlock item={item(['portal'])} />);

        expect(container.firstChild).toBeNull();
    });

    it('lists the installed applications by name, description and in the project order', () => {
        $applications.set({
            applications: [
                app('com.features', 'Features App', 'Features description'),
                app('com.all', 'All Content Types App', 'All description'),
            ],
            loading: false,
            loaded: true,
        });

        render(<ProjectApplicationsBlock item={item(['com.features', 'com.all'])} />);

        expect(screen.getByText('settings.items.wizard.step.applications')).toBeTruthy();
        const names = screen.getAllByRole('listitem').map((li) => li.textContent);
        expect(names).toEqual(['Features AppFeatures description', 'All Content Types AppAll description']);
    });

    it('shows an application this node does not run by its key as unavailable', () => {
        render(<ProjectApplicationsBlock item={item(['com.missing'])} />);

        expect(screen.getByText('com.missing')).toBeTruthy();
        expect(screen.getByText('text.application.not.available:com.missing')).toBeTruthy();
    });

    it('requests the applications on mount', () => {
        render(<ProjectApplicationsBlock item={item(['com.features'])} />);

        expect(loadApplications).toHaveBeenCalledTimes(1);
    });
});
