import {atom, computed} from 'nanostores';
import type {PageTemplate} from '../../../app/content/PageTemplate';
import type {Descriptor} from '../../../app/page/Descriptor';
import {$contentContext, $page, $pageEditorLifecycle, $pageVersion} from './page-editor/store';

//
// * State
//

export const $pageTemplateOptions = atom<PageTemplate[]>([]);

export const $pageControllerOptions = atom<Descriptor[]>([]);

export const $pageConfigDescriptor = atom<Descriptor | null>(null);

export const $isPageInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedPageOptionKey = computed(
    [$page, $pageVersion],
    (page): string | null => {
        if (!page) return '__auto__';
        if (page.hasController()) return page.getController().toString();
        if (page.hasTemplate()) return page.getTemplate().toString();
        return '__auto__';
    },
);

export const $isCustomizeVisible = computed(
    [$pageEditorLifecycle, $contentContext],
    (lifecycle, ctx): boolean => {
        if (!ctx || !lifecycle.isPageLocked || !lifecycle.isPageRenderable) return false;
        return !ctx.isInherited || !ctx.isDataInherited;
    },
);

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];

export function initPageInspectionService(): void {
    cleanupPageInspection();

    // Load templates and controllers when content context becomes available
    const unsubContext = $contentContext.subscribe((ctx) => {
        if (!ctx) return;

        $isPageInspectionLoading.set(true);
        abortController?.abort();
        abortController = new AbortController();

        void (async () => {
            try {
                const {loadPageTemplatesByCanRender, loadPageControllers} = await import('../api/pageInspection');

                const [templates, controllers] = await Promise.all([
                    ctx.siteId ? loadPageTemplatesByCanRender(ctx.siteId, ctx.contentTypeName) : Promise.resolve([]),
                    loadPageControllers(ctx.contentId),
                ]);

                if (!abortController.signal.aborted) {
                    $pageTemplateOptions.set(templates);
                    $pageControllerOptions.set(controllers);
                }
            } catch {
                // Aborted or failed
            } finally {
                $isPageInspectionLoading.set(false);
            }
        })();
    });
    cleanups.push(unsubContext);

    // Load descriptor when controller changes
    let lastControllerKey: string | null = null;

    const unsubPage = computed([$page, $pageVersion], (page) => page).subscribe((page) => {
        const controllerKey = page?.hasController() ? page.getController().toString() : null;

        if (controllerKey === lastControllerKey) return;
        lastControllerKey = controllerKey;

        if (!controllerKey) {
            $pageConfigDescriptor.set(null);
            return;
        }

        void (async () => {
            try {
                const {loadPageDescriptor} = await import('../api/pageInspection');
                const descriptor = await loadPageDescriptor(controllerKey);
                $pageConfigDescriptor.set(descriptor ?? null);
            } catch {
                $pageConfigDescriptor.set(null);
            }
        })();
    });
    cleanups.push(unsubPage);
}

export function cleanupPageInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;

    abortController?.abort();
    abortController = null;

    $pageTemplateOptions.set([]);
    $pageControllerOptions.set([]);
    $pageConfigDescriptor.set(null);
    $isPageInspectionLoading.set(false);
}
