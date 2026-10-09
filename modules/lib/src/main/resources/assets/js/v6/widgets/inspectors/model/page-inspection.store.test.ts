import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PageTemplate } from '../../../../app/content/PageTemplate';
import type { Descriptor } from '../../../../app/page/Descriptor';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context } from './inspectionTestUtils';

const { loadPageTemplatesByCanRender, loadPageControllers, loadPageDescriptor } = vi.hoisted(() => ({
    loadPageTemplatesByCanRender: vi.fn(),
    loadPageControllers: vi.fn(),
    loadPageDescriptor: vi.fn(),
}));
vi.mock('../api/pageInspection.api', () => ({
    loadPageTemplatesByCanRender,
    loadPageControllers,
    loadPageDescriptor,
}));
vi.mock('./page-editor/store', () => {
    const $contentContext = atom<PageEditorContentContext | null>(null);
    return {
        $contentContext,
        $contentScopeKey: computed($contentContext, (ctx) =>
            ctx ? `${ctx.contentId.toString()}:${ctx.sitePath}` : null,
        ),
        $page: atom(null),
        $pageVersion: atom(0),
        $pageEditorLifecycle: atom({ isPageLocked: false, isPageRenderable: true }),
        $hasDefaultPageTemplate: atom(false),
    };
});
vi.mock('../../../shared/socket/socket.store', () => ({
    $contentCreated: atom(null),
    $contentUpdated: atom(null),
    $contentDeleted: atom(null),
}));

import { $contentContext, $page } from './page-editor/store';
import { $contentUpdated } from '../../../shared/socket/socket.store';
import {
    $arePageControllersResolved,
    $arePageTemplatesResolved,
    $isPageInspectionLoading,
    $isPageInspectionEmpty,
    $pageConfigDescriptor,
    $pageControllerOptions,
    $pageTemplateOptions,
    cleanupPageInspection,
    initPageInspectionService,
} from './page-inspection.store';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $currentPage = $page as unknown as WritableAtom<unknown>;
const $updated = $contentUpdated as WritableAtom<unknown>;
type TemplateResult = Result<PageTemplate[], Error>;

describe('page inspection service', () => {
    afterEach(() => {
        vi.useRealTimers();
        cleanupPageInspection();
        $context.set(null);
        $currentPage.set(null);
        $updated.set(null);
        loadPageTemplatesByCanRender.mockReset();
        loadPageControllers.mockReset();
        loadPageDescriptor.mockReset();
    });

    it.each(['template', 'controller'] as const)(
        'does not report an empty page after initial %s load fails and retries on re-init',
        async (failedType) => {
            loadPageTemplatesByCanRender
                .mockResolvedValueOnce(failedType === 'template' ? err(new Error('templates unavailable')) : ok([]))
                .mockResolvedValueOnce(ok([]));
            loadPageControllers
                .mockResolvedValueOnce(failedType === 'controller' ? err(new Error('controllers unavailable')) : ok([]))
                .mockResolvedValueOnce(ok([]));

            $context.set(context());
            initPageInspectionService();
            await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));

            expect($isPageInspectionEmpty.get()).toBe(false);
            expect($arePageTemplatesResolved.get()).toBe(failedType !== 'template');
            expect($arePageControllersResolved.get()).toBe(failedType !== 'controller');

            initPageInspectionService();
            await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));

            expect($isPageInspectionEmpty.get()).toBe(true);
            expect(loadPageTemplatesByCanRender).toHaveBeenCalledTimes(2);
            expect(loadPageControllers).toHaveBeenCalledTimes(2);
        },
    );

    it('keeps a confirmed empty page state during a background refresh', async () => {
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([]));
        loadPageControllers.mockResolvedValueOnce(ok([]));
        $context.set(context());
        initPageInspectionService();
        await vi.waitFor(() => expect($isPageInspectionEmpty.get()).toBe(true));

        const pending = deferred<TemplateResult>();
        loadPageTemplatesByCanRender.mockReturnValueOnce(pending.promise);
        loadPageControllers.mockResolvedValueOnce(ok([]));
        vi.useFakeTimers();
        $updated.set({ timestamp: 1, data: [{ getContentId: () => ({ toString: () => 'content-id' }) }] });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();

        expect($isPageInspectionLoading.get()).toBe(true);
        expect($isPageInspectionEmpty.get()).toBe(true);
        pending.resolve(ok([]));
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
    });

    it('keeps page options on a same-content save and while a socket refresh fails', async () => {
        const template = { getKey: () => ({ toString: () => 'app:template' }) } as PageTemplate;
        const controller = { getKey: () => ({ toString: () => 'app:page' }) } as Descriptor;
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([template]));
        loadPageControllers.mockResolvedValueOnce(ok([controller]));
        $context.set(context());
        initPageInspectionService();
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));

        $context.set(context());
        initPageInspectionService();
        expect(loadPageTemplatesByCanRender).toHaveBeenCalledTimes(1);
        expect(loadPageControllers).toHaveBeenCalledTimes(1);
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($pageControllerOptions.get()).toEqual([controller]);

        const pending = deferred<TemplateResult>();
        loadPageTemplatesByCanRender.mockReturnValueOnce(pending.promise);
        loadPageControllers.mockResolvedValueOnce(err(new Error('controllers unavailable')));
        vi.useFakeTimers();
        $updated.set({
            timestamp: 1,
            data: [{ getContentId: () => ({ toString: () => 'content-id' }) }],
        });
        await vi.advanceTimersByTimeAsync(300);
        vi.useRealTimers();
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($pageControllerOptions.get()).toEqual([controller]);

        pending.resolve(err(new Error('templates unavailable')));
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($pageControllerOptions.get()).toEqual([controller]);
        expect($arePageTemplatesResolved.get()).toBe(true);
    });

    it('clears a true scope change and accepts confirmed empty results', async () => {
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([{} as PageTemplate]));
        loadPageControllers.mockResolvedValueOnce(ok([{} as Descriptor]));
        $context.set(context());
        initPageInspectionService();
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));

        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([]));
        loadPageControllers.mockResolvedValueOnce(ok([]));
        $context.set(context('other-content', '/other-site'));
        expect($pageTemplateOptions.get()).toEqual([]);
        expect($arePageTemplatesResolved.get()).toBe(false);
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
        expect($arePageTemplatesResolved.get()).toBe(true);
    });

    it('keeps page options without reloading on a site path change', async () => {
        const template = {} as PageTemplate;
        const controller = {} as Descriptor;
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([template]));
        loadPageControllers.mockResolvedValueOnce(ok([controller]));
        $context.set(context());
        initPageInspectionService();
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));

        $context.set(context('content-id', '/renamed-site'));
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($pageControllerOptions.get()).toEqual([controller]);
        expect(loadPageTemplatesByCanRender).toHaveBeenCalledTimes(1);
        expect(loadPageControllers).toHaveBeenCalledTimes(1);
    });

    it('ignores a late controller descriptor after the selected key changes', async () => {
        const first = deferred<Descriptor | undefined>();
        const second = { getKey: () => ({ toString: () => 'app:second' }) } as Descriptor;
        loadPageTemplatesByCanRender.mockResolvedValue(ok([]));
        loadPageControllers.mockResolvedValue(ok([]));
        loadPageDescriptor
            .mockReturnValueOnce({ unwrapOr: () => first.promise })
            .mockReturnValueOnce({ unwrapOr: async () => second });

        $context.set(context());
        initPageInspectionService();
        await vi.waitFor(() => expect(loadPageControllers).toHaveBeenCalledTimes(1));
        $currentPage.set({ hasController: () => true, getController: () => ({ toString: () => 'app:first' }) });
        await vi.waitFor(() => expect(loadPageDescriptor).toHaveBeenCalledTimes(1));

        $currentPage.set({ hasController: () => true, getController: () => ({ toString: () => 'app:second' }) });
        await vi.waitFor(() => expect($pageConfigDescriptor.get()).toBe(second));
        first.resolve({} as Descriptor);
        await Promise.resolve();
        expect($pageConfigDescriptor.get()).toBe(second);
    });
});
