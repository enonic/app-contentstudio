import { ContentTypeSummaryBuilder } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { type ContentSummary, ContentSummaryBuilder } from '../../../../../../app/content/ContentSummary';
import { Project } from '../../../../../../app/settings/data/project/Project';
import { createDeferredPromise, flushPromises } from '../../../../../shared/lib/test/dialog.store.test.utils';

const {
    mockGetAvailableContentTypes,
    mockOpenNewContentDialog,
    mockFire,
    newContentEvents,
    $activeProject,
    $contextContent,
} = await vi.hoisted(async () => {
    const { atom } = await import('nanostores');
    const newContentEvents: unknown[][] = [];
    return {
        mockGetAvailableContentTypes: vi.fn(),
        mockOpenNewContentDialog: vi.fn(),
        mockFire: vi.fn(),
        newContentEvents,
        $activeProject: atom<Readonly<Project> | undefined>(undefined),
        $contextContent: atom<ContentSummary | null>(null),
    };
});

vi.mock('@enonic/ui', () => ({
    Button: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
        <button {...props}>{children}</button>
    ),
    cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));
vi.mock('../../../../../../app/create/NewContentEvent', () => ({
    NewContentEvent: class {
        constructor(...args: unknown[]) {
            newContentEvents.push(args);
        }

        fire = mockFire;
    },
}));
vi.mock('../../../../../../app/util/ContentTypesHelper', () => ({
    ContentTypesHelper: { getAvailableContentTypes: mockGetAvailableContentTypes },
}));
vi.mock('../../../../../widgets/context-panel/model/contextContent.store', () => ({ $contextContent }));
vi.mock('../../../../../entities/project', () => ({ $activeProject }));
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));
vi.mock('../../../../../shared/socket/socket.store', async () => {
    const { atom } = await import('nanostores');
    return { $contentCreated: atom(null) };
});
vi.mock('../../../../new-content/model/newContentDialog.store', async () => {
    const { map } = await import('nanostores');
    return { $newContentDialog: map({ open: false }), openNewContentDialog: mockOpenNewContentDialog };
});

import { ContentSelectorInputAddButton } from './ContentSelectorInputAddButton';

const createContentType = (name: string) => {
    const builder = new ContentTypeSummaryBuilder();
    builder.name = name;
    builder.title = name;
    return builder.build();
};

const person = createContentType('com.app:person');
const movie = createContentType('com.app:movie');
const image = createContentType('media:image');

const parent = new ContentSummaryBuilder()
    .setId('parent')
    .setContentId(new ContentId('parent'))
    .setPath(ContentPath.create().fromString('/parent').build())
    .build();

const activeProject = Project.create().setName('active-project').build();
const allowedContentTypes = ['com.app:person'];

const renderButton = () =>
    render(
        <ContentSelectorInputAddButton
            disabled={false}
            allowedContentTypes={allowedContentTypes}
            selection={[]}
            onSelectionChange={vi.fn()}
        />,
    );

const clickAdd = async () => {
    fireEvent.click(screen.getByRole('button'));
    await flushPromises();
};

describe('ContentSelectorInputAddButton', () => {
    beforeEach(() => {
        $activeProject.set(activeProject);
        $contextContent.set(parent);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        newContentEvents.length = 0;
    });

    it('should load the available types for the active project, the parent and the allowed names', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([person, movie]);

        renderButton();
        await clickAdd();

        expect(mockGetAvailableContentTypes).toHaveBeenCalledOnce();
        expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
            contentId: parent.getContentId(),
            allowedContentTypes,
            project: activeProject,
        });
    });

    it('should open the wizard directly when a single non-media type is allowed', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([person]);

        renderButton();
        await clickAdd();

        expect(newContentEvents).toEqual([[person, parent]]);
        expect(mockFire).toHaveBeenCalledOnce();
        expect(mockOpenNewContentDialog).not.toHaveBeenCalled();
    });

    it('should open the dialog with the loaded types when several types are allowed', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([person, movie]);

        renderButton();
        await clickAdd();

        expect(mockFire).not.toHaveBeenCalled();
        expect(mockOpenNewContentDialog).toHaveBeenCalledOnce();
        expect(mockOpenNewContentDialog).toHaveBeenCalledWith(parent, {
            allowedContentTypes,
            contentTypes: [person, movie],
        });
    });

    it('should open the dialog when the single allowed type is a media type', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([image]);

        renderButton();
        await clickAdd();

        expect(mockFire).not.toHaveBeenCalled();
        expect(mockOpenNewContentDialog).toHaveBeenCalledWith(parent, { allowedContentTypes, contentTypes: [image] });
    });

    it('should open the dialog without preloaded types when the request fails', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mockGetAvailableContentTypes.mockRejectedValue(new Error('boom'));

        renderButton();
        await clickAdd();

        expect(error).toHaveBeenCalledOnce();
        expect(mockFire).not.toHaveBeenCalled();
        expect(mockOpenNewContentDialog).toHaveBeenCalledWith(parent, { allowedContentTypes, contentTypes: undefined });
    });

    it('should be disabled while the types are loading', async () => {
        const deferred = createDeferredPromise<unknown[]>();
        mockGetAvailableContentTypes.mockReturnValue(deferred.promise);

        renderButton();
        const button = screen.getByRole('button');

        expect(button.hasAttribute('disabled')).toBe(false);

        await clickAdd();
        expect(button.hasAttribute('disabled')).toBe(true);

        deferred.resolve([person, movie]);
        await flushPromises();
        expect(button.hasAttribute('disabled')).toBe(false);
        expect(mockOpenNewContentDialog).toHaveBeenCalledOnce();
    });
});
