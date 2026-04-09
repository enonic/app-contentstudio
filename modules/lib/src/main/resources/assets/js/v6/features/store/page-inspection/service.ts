import {computed} from 'nanostores';
import {$contentContext, $page, $pageVersion} from '../page-editor/store';
import {
    $isPageInspectionLoading,
    $pageConfigDescriptor,
    $pageControllerOptions,
    $pageTemplateOptions,
} from './store';

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
                const {loadPageTemplatesByCanRender, loadPageControllers} = await import('../../api/pageInspection');

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
                const {loadPageDescriptor} = await import('../../api/pageInspection');
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
