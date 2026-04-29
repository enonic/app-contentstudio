import {atom, computed} from 'nanostores';
import type {PageTemplate} from '../../../app/content/PageTemplate';
import type {Descriptor} from '../../../app/page/Descriptor';
import {createDebounce} from '../utils/timing/createDebounce';
import {$contentContext, $page, $pageEditorLifecycle, $pageVersion} from './page-editor/store';
import type {PageEditorContentContext} from './page-editor/types';
import {$contentUpdated} from './socket.store';

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

export const $isPageInspectionEmpty = computed(
    [$pageTemplateOptions, $pageControllerOptions, $isPageInspectionLoading],
    (templates, controllers, isLoading): boolean => {
        if (isLoading) return false;
        return templates.length === 0 && controllers.length === 0;
    },
);

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];

async function loadTemplatesAndControllers(ctx: PageEditorContentContext): Promise<void> {
    $isPageInspectionLoading.set(true);
    abortController?.abort();
    abortController = new AbortController();
    const {signal} = abortController;

    try {
        const {loadPageTemplatesByCanRender, loadPageControllers} = await import('../api/pageInspection');

        const [templates, controllers] = await Promise.all([
            ctx.siteId ? loadPageTemplatesByCanRender(ctx.siteId, ctx.contentTypeName) : Promise.resolve([]),
            loadPageControllers(ctx.contentId),
        ]);

        if (!signal.aborted) {
            $pageTemplateOptions.set(templates);
            $pageControllerOptions.set(controllers);
        }
    } catch {
        // Aborted or failed
    } finally {
        if (!signal.aborted) {
            $isPageInspectionLoading.set(false);
        }
    }
}

export function initPageInspectionService(): void {
    cleanupPageInspection();

    // Load templates and controllers when content context becomes available
    const unsubContext = $contentContext.subscribe((ctx) => {
        if (!ctx) return;
        void loadTemplatesAndControllers(ctx);
    });
    cleanups.push(unsubContext);

    // Reload when the current content, the site, or a descendant page-template is updated.
    // Site updates may add or remove applications, changing available templates and controllers.
    const reloadDebounced = createDebounce(() => {
        const ctx = $contentContext.get();
        if (ctx) void loadTemplatesAndControllers(ctx);
    }, 300);

    const unsubContentUpdated = $contentUpdated.subscribe((event) => {
        if (!event) return;

        const ctx = $contentContext.get();
        if (!ctx) return;

        const contentIdStr = ctx.contentId.toString();
        const siteIdStr = ctx.siteId?.toString();
        const sitePath = ctx.sitePath;

        const shouldReload = event.data.some((summary) => {
            const id = summary.getContentId().toString();
            if (id === contentIdStr) return true;
            if (siteIdStr && id === siteIdStr) return true;
            if (sitePath && summary.getType().isPageTemplate()) {
                return summary.getPath().toString().startsWith(`${sitePath}/`);
            }
            return false;
        });

        if (shouldReload) reloadDebounced();
    });
    cleanups.push(() => {
        reloadDebounced.cancel();
        unsubContentUpdated();
    });

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
