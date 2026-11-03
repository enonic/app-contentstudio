import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { render } from '@testing-library/preact';
import { atom } from 'nanostores';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentName } from '../../../../app/content/ContentName';
import { ContentPath } from '../../../../app/content/ContentPath';
import { type ContentSummary, ContentSummaryBuilder } from '../../../../app/content/ContentSummary';
import type { ContextWidget } from '../model/contextWidget.types';
import { setActiveWidget, setContextWidgets } from '../model/contextWidgets.store';
import { ContextPanelView } from './ContextPanelView';

vi.mock('@enonic/ui', () => ({
    cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../widget/WidgetsSelector', () => ({
    WidgetsSelector: (): ReactElement => <div data-component="WidgetsSelector" />,
}));

vi.mock('../widget/details', () => ({
    DetailsWidget: (): ReactElement => <div data-component="DetailsWidget" />,
}));

vi.mock('../widget/versions/VersionsWidget', () => ({
    VersionsWidget: (): ReactElement => <div data-component="VersionsWidget" />,
}));

vi.mock('../widget/dependencies', () => ({
    DependenciesWidget: (): ReactElement => <div data-component="DependenciesWidget" />,
}));

vi.mock('../widget/import-content', () => ({
    ImportContentWidget: (): ReactElement => <div data-component="ImportContentWidget" />,
}));

vi.mock('./ExternalContextWidget', () => ({
    ExternalContextWidget: ({ content }: { content?: ContentSummary | null }): ReactElement => (
        <div data-component="ExternalContextWidget" data-content-id={content?.getId()} />
    ),
}));

const createContent = (id: string): ContentSummary =>
    new ContentSummaryBuilder()
        .setId(id)
        .setContentId(new ContentId(id))
        .setName(new ContentName(id))
        .setDisplayName(id)
        .setPath(ContentPath.create().fromString(`/${id}`).build())
        .setType(ContentTypeName.FOLDER)
        .build();

const DETAILS: ContextWidget = {
    key: 'com.example.app:details',
    name: 'details',
    applicationKey: 'com.example.app',
    title: 'Details',
    description: '',
    requiresContent: true,
};

const EXTERNAL: ContextWidget = {
    key: 'com.example.app:external',
    name: 'external',
    applicationKey: 'com.example.app',
    title: 'External',
    description: '',
    url: 'https://example.test/widget',
};

const ArchiveDetails = (): ReactElement => <div data-component="ArchiveDetails" />;

describe('ContextPanelView', () => {
    beforeEach(() => {
        setContextWidgets([DETAILS, EXTERNAL], DETAILS.key);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should show the empty state when Studio has no context content', () => {
        render(<ContextPanelView selector={false} />);

        expect(document.querySelector('[data-component="PreviewLabel"]')).not.toBeNull();
        expect(document.querySelector('[data-component="DetailsWidget"]')).toBeNull();
    });

    it('should render the host widget with content from the host store', () => {
        const $content = atom<ContentSummary | null>(createContent('archived'));

        render(
            <ContextPanelView selector={false} config={{ widgets: { details: ArchiveDetails }, content: $content }} />,
        );

        expect(document.querySelector('[data-component="ArchiveDetails"]')).not.toBeNull();
        expect(document.querySelector('[data-component="DetailsWidget"]')).toBeNull();
    });

    it('should hand the host content to the external widget', () => {
        const $content = atom<ContentSummary | null>(createContent('archived'));
        setActiveWidget(EXTERNAL.key);

        render(<ContextPanelView selector={false} config={{ content: $content }} />);

        const external = document.querySelector('[data-component="ExternalContextWidget"]');
        expect(external?.getAttribute('data-content-id')).toBe('archived');
    });

    it('should show the empty state when the host store is empty', () => {
        const $content = atom<ContentSummary | null>(null);

        render(
            <ContextPanelView selector={false} config={{ widgets: { details: ArchiveDetails }, content: $content }} />,
        );

        expect(document.querySelector('[data-component="PreviewLabel"]')).not.toBeNull();
        expect(document.querySelector('[data-component="ArchiveDetails"]')).toBeNull();
    });
});
