import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { ContentSummaryBuilder } from '../../../../../../app/content/ContentSummary';
import { Project } from '../../../../../../app/settings/data/project/Project';
import { createDeferredPromise, flushPromises } from '../../../../../shared/lib/test/dialog.store.test.utils';
import { type FormScope, FormScopeProvider } from '../../FormScopeContext';

const {
    mockGetAvailableContentTypes,
    mockOpenNewContentDialog,
    mockAddContentInProjectRoot,
    mockFire,
    newContentEvents,
    $activeProject,
} = await vi.hoisted(async () => {
    const { atom } = await import('nanostores');
    const newContentEvents: unknown[][] = [];
    return {
        mockGetAvailableContentTypes: vi.fn(),
        mockOpenNewContentDialog: vi.fn(),
        mockAddContentInProjectRoot: vi.fn(),
        mockFire: vi.fn(),
        newContentEvents,
        $activeProject: atom<Readonly<Project> | undefined>(undefined),
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
vi.mock('../../../../new-content/model/creatableContentTypes', () => ({
    loadCreatableContentTypes: mockGetAvailableContentTypes,
}));
vi.mock('./contentSelectorAdd.service', () => ({ addContentInProjectRoot: mockAddContentInProjectRoot }));
vi.mock('../../../../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom(null) };
});
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
import { type ContentTypeSummary } from '../../../../../entities/schema';
import { type ContentTypeName } from '../../../../../shared/lib/cms/schema/contentTypeName';

const createContentType = (name: ContentTypeName): ContentTypeSummary => {
    return { name, title: name, abstract: false };
};

const person = createContentType('com.app:person');
const movie = createContentType('com.app:movie');
const image = createContentType('media:image');

const parent = new ContentSummaryBuilder()
    .setId('parent')
    .setContentId(new ContentId('parent'))
    .setPath(ContentPath.create().fromString('/parent').build())
    .build();

const scopeProject = Project.create().setName('scope-project').build();
const allowedContentTypes = ['com.app:person'];
const applicationKey = 'com.app';

const renderButton = (scope: FormScope = { project: scopeProject, content: parent }, onSelectionChange = vi.fn()) =>
    render(
        <FormScopeProvider {...scope}>
            <ContentSelectorInputAddButton
                disabled={false}
                allowedContentTypes={allowedContentTypes}
                applicationKey={applicationKey}
                selection={['old-1']}
                onSelectionChange={onSelectionChange}
            />
        </FormScopeProvider>,
    );

const clickAdd = async () => {
    fireEvent.click(screen.getByRole('button'));
    await flushPromises();
};

describe('ContentSelectorInputAddButton', () => {
    beforeEach(() => {
        $activeProject.set(Project.create().setName('active-project').build());
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        newContentEvents.length = 0;
    });

    it('should load the available types for the scope project, the parent and the allowed names', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([person, movie]);

        renderButton();
        await clickAdd();

        expect(mockGetAvailableContentTypes).toHaveBeenCalledOnce();
        expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
            contentId: parent.getContentId(),
            allowedContentTypes,
            project: scopeProject,
        });
    });

    it('should open the wizard directly when a single non-media type is allowed', async () => {
        mockGetAvailableContentTypes.mockResolvedValue([person]);

        renderButton();
        await clickAdd();

        expect(newContentEvents).toEqual([[person.name, parent]]);
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

    it('should render nothing with neither a content nor a project in scope', () => {
        renderButton({ project: null, content: null });

        expect(screen.queryByRole('button')).toBeNull();
    });

    describe('without a content in scope', () => {
        const renderRoot = (onSelectionChange = vi.fn()) =>
            renderButton({ project: scopeProject, content: null }, onSelectionChange);

        const pickedTypeHandler = (): ((type: ContentTypeSummary) => Promise<void>) =>
            mockOpenNewContentDialog.mock.calls[0][1].onTypeSelected;

        const uploadedHandler = (): ((contents: { getId: () => string }[]) => void) =>
            mockOpenNewContentDialog.mock.calls[0][1].onUploaded;

        it('should load the types of the scope project root with the allowed names', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);

            renderRoot();
            await clickAdd();

            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                allowedContentTypes,
                applicationKey,
                project: scopeProject,
            });
        });

        it('should create a single non-media type in the scope project root without the dialog', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person]);
            mockAddContentInProjectRoot.mockResolvedValue('new-1');
            const onSelectionChange = vi.fn();

            renderRoot(onSelectionChange);
            await clickAdd();

            expect(mockAddContentInProjectRoot).toHaveBeenCalledWith(person.name, scopeProject);
            expect(onSelectionChange).toHaveBeenCalledWith(['old-1', 'new-1']);
            expect(mockOpenNewContentDialog).not.toHaveBeenCalled();
            expect(newContentEvents).toEqual([]);
        });

        it('should still open the dialog when the single type is a media type', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([image]);

            renderRoot();
            await clickAdd();

            expect(mockAddContentInProjectRoot).not.toHaveBeenCalled();
            expect(mockOpenNewContentDialog).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({ contentTypes: [image], project: scopeProject }),
            );
        });

        it('should open the dialog in the scope project root without firing a new content event', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);

            renderRoot();
            await clickAdd();

            expect(newContentEvents).toEqual([]);
            expect(mockOpenNewContentDialog).toHaveBeenCalledWith(undefined, {
                allowedContentTypes,
                applicationKey,
                contentTypes: [person, movie],
                project: scopeProject,
                onTypeSelected: expect.any(Function),
                onUploaded: expect.any(Function),
            });
        });

        it('should add what the dialog uploaded to the selection in one change', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);
            const onSelectionChange = vi.fn();

            renderRoot(onSelectionChange);
            await clickAdd();
            uploadedHandler()([{ getId: () => 'm-1' }, { getId: () => 'm-2' }]);

            expect(onSelectionChange).toHaveBeenCalledOnce();
            expect(onSelectionChange).toHaveBeenCalledWith(['old-1', 'm-1', 'm-2']);
        });

        it('should leave the selection alone when nothing was uploaded', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);
            const onSelectionChange = vi.fn();

            renderRoot(onSelectionChange);
            await clickAdd();
            uploadedHandler()([]);

            expect(onSelectionChange).not.toHaveBeenCalled();
        });

        it('should create a picked type in the scope project root and add it to the selection', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);
            mockAddContentInProjectRoot.mockResolvedValue('new-1');
            const onSelectionChange = vi.fn();

            renderRoot(onSelectionChange);
            await clickAdd();
            await pickedTypeHandler()(person);

            expect(mockAddContentInProjectRoot).toHaveBeenCalledWith(person.name, scopeProject);
            expect(onSelectionChange).toHaveBeenCalledWith(['old-1', 'new-1']);
        });

        it('should leave the selection alone when the creation failed', async () => {
            mockGetAvailableContentTypes.mockResolvedValue([person, movie]);
            mockAddContentInProjectRoot.mockResolvedValue(undefined);
            const onSelectionChange = vi.fn();

            renderRoot(onSelectionChange);
            await clickAdd();
            await pickedTypeHandler()(person);

            expect(onSelectionChange).not.toHaveBeenCalled();
        });

        it('should open the dialog with the application key and no preloaded types when the request fails', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined);
            mockGetAvailableContentTypes.mockRejectedValue(new Error('boom'));

            renderRoot();
            await clickAdd();

            expect(mockOpenNewContentDialog).toHaveBeenCalledWith(undefined, {
                allowedContentTypes,
                applicationKey,
                contentTypes: undefined,
                project: scopeProject,
                onTypeSelected: expect.any(Function),
                onUploaded: expect.any(Function),
            });
        });
    });
});
