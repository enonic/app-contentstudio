import { atom, computed, type WritableAtom } from 'nanostores';
import { err, ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PageTemplate } from '../../../../app/content/PageTemplate';
import type { Page } from '../../../../app/page/Page';
import type { PageEditorContentContext } from './page-editor/types';
import { deferred, inspectionContext as context, siteModel } from './inspectionTestUtils';

const { loadPageTemplatesByCanRender, loadPageControllers, loadPageDescriptor } = vi.hoisted(() => ({
    loadPageTemplatesByCanRender: vi.fn(),
    loadPageControllers: vi.fn(),
    loadPageDescriptor: vi.fn(),
}));
vi.mock('../api/pageInspection.api', () => ({ loadPageTemplatesByCanRender, loadPageControllers, loadPageDescriptor }));
vi.mock('./page-editor/store', () => {
    const $contentContext = atom<PageEditorContentContext | null>(null);
    return {
        $contentContext,
        $contentScopeKey: computed($contentContext, (ctx) =>
            ctx ? `${ctx.contentId.toString()}:${ctx.sitePath}` : null,
        ),
        $page: atom<Page | null>(null),
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
import {
    $arePageTemplatesResolved,
    $isPageInspectionLoading,
    $isSelectedTemplateMissing,
    $pageTemplateOptions,
} from './page-inspection.store';
import { start as startPageInspectionService, stop as stopPageInspectionService } from './page-inspection.service';

const $context = $contentContext as WritableAtom<PageEditorContentContext | null>;
const $currentPage = $page as WritableAtom<Page | null>;

describe('page inspection scope', () => {
    afterEach(() => {
        stopPageInspectionService();
        $context.set(null);
        $currentPage.set(null);
        loadPageTemplatesByCanRender.mockReset();
        loadPageControllers.mockReset();
        loadPageDescriptor.mockReset();
    });

    it('keeps a selected template through a save and failed refresh, then confirms removal', async () => {
        const template = { getKey: () => ({ toString: () => 'site:template' }) } as PageTemplate;
        $currentPage.set({
            hasController: () => false,
            hasTemplate: () => true,
            getTemplate: () => ({ toString: () => 'site:template' }),
        } as Page);
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([template]));
        loadPageControllers.mockResolvedValue(ok([]));
        const firstModel = siteModel();
        $context.set(context());
        startPageInspectionService(firstModel.value);
        await vi.waitFor(() => expect($pageTemplateOptions.get()).toEqual([template]));
        expect($isSelectedTemplateMissing.get()).toBe(false);

        $context.set(context());
        startPageInspectionService(firstModel.value);
        expect(loadPageTemplatesByCanRender).toHaveBeenCalledTimes(1);

        const pending = deferred<Result<PageTemplate[], Error>>();
        loadPageTemplatesByCanRender.mockReturnValueOnce(pending.promise);
        const replacement = siteModel();
        startPageInspectionService(replacement.value);
        expect(firstModel.listeners.size).toBe(0);
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($isSelectedTemplateMissing.get()).toBe(false);

        pending.resolve(err(new Error('offline')));
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($arePageTemplatesResolved.get()).toBe(true);

        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([]));
        startPageInspectionService(replacement.value);
        await vi.waitFor(() => expect($isSelectedTemplateMissing.get()).toBe(true));
        expect($pageTemplateOptions.get()).toEqual([]);
    });

    it('clears options on a true content scope change', async () => {
        const template = { getKey: () => ({ toString: () => 'site:template' }) } as PageTemplate;
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([template]));
        loadPageControllers.mockResolvedValue(ok([]));
        $context.set(context());
        startPageInspectionService();
        await vi.waitFor(() => expect($pageTemplateOptions.get()).toEqual([template]));

        const pending = deferred<Result<PageTemplate[], Error>>();
        loadPageTemplatesByCanRender.mockReturnValueOnce(pending.promise);
        $context.set(context('different-content'));
        expect($pageTemplateOptions.get()).toEqual([]);
        expect($arePageTemplatesResolved.get()).toBe(false);
        pending.resolve(ok([]));
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
    });

    it('keeps selected template visible while a renamed site reloads', async () => {
        const template = { getKey: () => ({ toString: () => 'site:template' }) } as PageTemplate;
        $currentPage.set({
            hasController: () => false,
            hasTemplate: () => true,
            getTemplate: () => ({ toString: () => 'site:template' }),
        } as Page);
        loadPageTemplatesByCanRender.mockResolvedValueOnce(ok([template]));
        loadPageControllers.mockResolvedValue(ok([]));
        $context.set(context());
        startPageInspectionService();
        await vi.waitFor(() => expect($pageTemplateOptions.get()).toEqual([template]));

        const pending = deferred<Result<PageTemplate[], Error>>();
        loadPageTemplatesByCanRender.mockReturnValueOnce(pending.promise);
        $context.set(context('content-id', '/renamed-site'));
        expect($pageTemplateOptions.get()).toEqual([template]);
        expect($arePageTemplatesResolved.get()).toBe(false);
        expect($isSelectedTemplateMissing.get()).toBe(false);

        pending.resolve(ok([]));
        await vi.waitFor(() => expect($isPageInspectionLoading.get()).toBe(false));
        expect($pageTemplateOptions.get()).toEqual([]);
        expect($isSelectedTemplateMissing.get()).toBe(true);
    });
});
