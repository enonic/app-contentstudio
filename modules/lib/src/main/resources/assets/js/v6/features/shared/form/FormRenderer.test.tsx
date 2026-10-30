import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { PropertySet, PropertyTree } from '@enonic/input-types/data';
import { Form } from '@enonic/input-types/schema';
import { cleanup, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockShowWarning, mockToolkitRenderer, mockHtmlAreaContext } = vi.hoisted(() => ({
    mockShowWarning: vi.fn(),
    mockToolkitRenderer: vi.fn(),
    mockHtmlAreaContext: vi.fn<() => object | undefined>(),
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showWarning: (...args: unknown[]) => mockShowWarning(...args),
}));

vi.mock('@enonic/input-types', () => ({
    FormRenderer: (props: Record<string, unknown>) => {
        mockToolkitRenderer(props);
        return <div data-testid="toolkit-form" />;
    },
    LocaleProvider: ({ locale, children }: { locale?: string; children: ReactNode }) => (
        <div data-testid="locale-provider" data-locale={locale ?? ''}>
            {children}
        </div>
    ),
}));

vi.mock('../../../shared/ui/providers/FormI18nProvider', () => ({
    FormI18nProvider: ({ children }: { children: ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}));

vi.mock('./input-types/html-area', () => ({
    HtmlAreaProvider: ({ children }: { children: ReactNode }) => <div data-testid="html-area-provider">{children}</div>,
    useOptionalHtmlAreaContext: () => mockHtmlAreaContext(),
}));

vi.mock('../hooks/useApplicationKeys', () => ({ useApplicationKeys: () => [] }));
vi.mock('../../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom<{ getLanguage: () => string } | null>(null) };
});
vi.mock('../../../entities/project', async () => {
    const { atom } = await import('nanostores');
    return { $activeProject: atom(undefined) };
});
vi.mock('../../../shared/config/config.store', async () => {
    const { map } = await import('nanostores');
    return { $config: map({ assetsUri: '/assets' }) };
});

import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { $contextContent } from '../../../entities/content';
import { $activeProject } from '../../../entities/project';
import { FormRenderer } from './FormRenderer';

type RenderFormOptions = {
    applicationKey?: ApplicationKey;
    project?: Readonly<Project> | null;
    content?: ContentSummary | null;
};

function renderForm({ applicationKey, project, content }: RenderFormOptions = {}) {
    const propertySet: PropertySet = new PropertyTree().getRoot();
    return render(
        <FormRenderer
            form={new Form()}
            propertySet={propertySet}
            applicationKey={applicationKey}
            project={project}
            content={content}
        />,
    );
}

describe('FormRenderer', () => {
    beforeEach(() => {
        mockShowWarning.mockReset();
        mockToolkitRenderer.mockReset();
        mockHtmlAreaContext.mockReturnValue(undefined);
        ($contextContent as unknown as { set: (v: unknown) => void }).set({ getLanguage: () => 'nb' });
        ($activeProject as unknown as { set: (v: unknown) => void }).set({ getName: () => 'active' });
    });

    afterEach(cleanup);

    it('wraps the toolkit form in the phrases, the content language and an HTML area context', () => {
        renderForm();

        const i18n = screen.getByTestId('i18n-provider');
        const locale = screen.getByTestId('locale-provider');
        const htmlArea = screen.getByTestId('html-area-provider');
        expect(i18n.contains(locale)).toBe(true);
        expect(locale.contains(htmlArea)).toBe(true);
        expect(htmlArea.contains(screen.getByTestId('toolkit-form'))).toBe(true);
        expect(locale.dataset.locale).toBe('nb');
    });

    it('should scope the language to the given content', () => {
        renderForm({
            project: { getName: () => 'scoped' } as unknown as Project,
            content: { getLanguage: () => 'de' } as unknown as ContentSummary,
        });

        expect(screen.getByTestId('locale-provider').dataset.locale).toBe('de');
    });

    it('should fall back to the project language without a content', () => {
        renderForm({
            project: { getName: () => 'scoped', getLanguage: () => 'sv' } as unknown as Project,
            content: null,
        });

        expect(screen.getByTestId('locale-provider').dataset.locale).toBe('sv');
    });

    it('should give the form no language for a content without one, not the project language', () => {
        renderForm({
            project: { getName: () => 'scoped', getLanguage: () => 'ar' } as unknown as Project,
            content: { getLanguage: () => undefined } as unknown as ContentSummary,
        });

        expect(screen.getByTestId('locale-provider').dataset.locale).toBe('');
    });

    it('should give the form no language for an explicit null scope', () => {
        renderForm({ project: null, content: null });

        expect(screen.getByTestId('locale-provider').dataset.locale).toBe('');
    });

    it('keeps the phrases and the language but not a second HTML area context inside an existing one', () => {
        mockHtmlAreaContext.mockReturnValue({});

        renderForm();

        expect(screen.queryByTestId('html-area-provider')).toBeNull();
        const locale = screen.getByTestId('locale-provider');
        expect(screen.getByTestId('i18n-provider').contains(locale)).toBe(true);
        expect(locale.contains(screen.getByTestId('toolkit-form'))).toBe(true);
    });

    it('should mount its own HTML area context inside an existing one when the form sets its own scope', () => {
        mockHtmlAreaContext.mockReturnValue({});

        renderForm({ project: { getName: () => 'scoped', getLanguage: () => 'sv' } as unknown as Project });

        const htmlArea = screen.getByTestId('html-area-provider');
        expect(htmlArea.contains(screen.getByTestId('toolkit-form'))).toBe(true);
    });

    it("routes the form's notifications to a warning and passes the application key by name", () => {
        renderForm({ applicationKey: ApplicationKey.fromString('com.enonic.app.test') });

        const props = mockToolkitRenderer.mock.calls[0]?.[0] as {
            applicationKey?: string;
            notify: (m: string) => void;
        };
        expect(props.applicationKey).toBe('com.enonic.app.test');

        props.notify('Option data is dropped on save');

        expect(mockShowWarning).toHaveBeenCalledWith('Option data is dropped on save', true);
    });
});
