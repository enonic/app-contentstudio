import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { PageTemplate } from '../../../../app/content/PageTemplate';
import type { Descriptor } from '../../../../app/page/Descriptor';
import type { SiteModel } from '../../../../app/site/SiteModel';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentContext,
    $contentScopeKey,
    $hasDefaultPageTemplate,
    $page,
    $pageEditorLifecycle,
    $pageVersion,
} from './page-editor/store';
import type { PageEditorContentContext } from './page-editor/types';
import { isSameInspectionOwner } from './page-editor/inspectionScope';
import { listenForSiteModelChanges } from './siteModelInspection';
import {
    $contentCreated,
    $contentDeleted,
    $contentUpdated,
    type ContentEvent,
} from '../../../shared/socket/socket.store';

export const AUTO_KEY = '__auto__';

//
// * State
//

export const $pageTemplateOptions = atom<PageTemplate[]>([]);

export const $pageControllerOptions = atom<Descriptor[]>([]);

export const $pageConfigDescriptor = atom<Descriptor | null>(null);

export const $isPageInspectionLoading = atom<boolean>(false);

export const $arePageTemplatesResolved = atom<boolean>(false);

//
// * Computed
//

export const $selectedPageOptionKey = computed([$page, $pageVersion], (page): string | null => {
    if (!page) return AUTO_KEY;
    if (page.hasController()) return page.getController().toString();
    if (page.hasTemplate()) return page.getTemplate().toString();
    return AUTO_KEY;
});

// A template outside the loaded options was deleted, or its application is no
// longer assigned to the site. Either way the reference is dead.
export const $isSelectedTemplateMissing = computed(
    [$page, $pageVersion, $selectedPageOptionKey, $pageTemplateOptions, $arePageTemplatesResolved],
    (page, _version, selectedKey, templates, isResolved): boolean => {
        if (!isResolved) {
            return false;
        }
        if (selectedKey == null || selectedKey === AUTO_KEY) return false;
        if (page?.hasController() || !page?.hasTemplate()) return false;

        return !templates.some((template) => template.getKey().toString() === selectedKey);
    },
);

export const $isCustomizeVisible = computed(
    [$pageEditorLifecycle, $contentContext, $page, $pageVersion, $hasDefaultPageTemplate, $isSelectedTemplateMissing],
    (lifecycle, ctx, page, _version, hasDefaultTemplate, isTemplateMissing): boolean => {
        if (!ctx || !lifecycle.isPageLocked || !lifecycle.isPageRenderable) return false;
        // Only a template-driven page can be detached from its template.
        if (page?.hasController() || isTemplateMissing) return false;
        if (!hasDefaultTemplate && !page?.hasTemplate()) return false;

        return !ctx.isInherited || !ctx.isDataInherited;
    },
);

export const $isPageInspectionEmpty = computed(
    [$pageTemplateOptions, $pageControllerOptions, $isPageInspectionLoading, $selectedPageOptionKey],
    (templates, controllers, isLoading, selectedKey): boolean => {
        if (isLoading && templates.length === 0 && controllers.length === 0) {
            return false;
        }
        if (selectedKey !== AUTO_KEY) return false;
        return templates.length === 0 && controllers.length === 0;
    },
);

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];
let activeSiteModel: SiteModel | null = null;
let detachSiteModel = (): void => {};
let retryNeeded = false;
const reloadDebounced = createDebounce(() => void loadTemplatesAndControllers(), 300);

function affectsPageInspection(summary: ContentSummary, ctx: PageEditorContentContext): boolean {
    const id = summary.getContentId().toString();
    if (id === ctx.contentId.toString()) return true;
    if (ctx.siteId && id === ctx.siteId.toString()) return true;
    if (ctx.sitePath && summary.getType().isPageTemplate()) {
        return summary.getPath().toString().startsWith(`${ctx.sitePath}/`);
    }
    return false;
}

async function loadTemplatesAndControllers(): Promise<void> {
    const ctx = $contentContext.get();
    const scopeKey = $contentScopeKey.get();
    if (!ctx || !scopeKey) {
        return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    const { signal } = controller;
    $isPageInspectionLoading.set(true);
    let failed = false;

    try {
        const { loadPageTemplatesByCanRender, loadPageControllers } = await import('../api/pageInspection.api');
        if (signal.aborted || $contentScopeKey.get() !== scopeKey) {
            return;
        }

        await Promise.all([
            (async () => {
                if (!ctx.siteId) {
                    $pageTemplateOptions.set([]);
                    $arePageTemplatesResolved.set(true);
                    return;
                }
                try {
                    const result = await loadPageTemplatesByCanRender(ctx.siteId, ctx.contentTypeName, signal);
                    if (signal.aborted || $contentScopeKey.get() !== scopeKey) {
                        return;
                    }
                    if (result.isErr()) {
                        failed = true;
                        return;
                    }
                    $pageTemplateOptions.set(result.value);
                    $arePageTemplatesResolved.set(true);
                } catch {
                    // Keep previously loaded templates.
                    failed = true;
                }
            })(),
            (async () => {
                try {
                    const result = await loadPageControllers(ctx.contentId, signal);
                    if (!signal.aborted && $contentScopeKey.get() === scopeKey && result.isOk()) {
                        $pageControllerOptions.set(result.value);
                    } else if (!signal.aborted && $contentScopeKey.get() === scopeKey) {
                        failed = true;
                    }
                } catch {
                    // Keep previously loaded controllers.
                    failed = true;
                }
            })(),
        ]);
        if (!signal.aborted && $contentScopeKey.get() === scopeKey) {
            retryNeeded = failed;
        }
    } catch {
        // Keep previously loaded options if the API module cannot load.
        if (!signal.aborted && $contentScopeKey.get() === scopeKey) {
            retryNeeded = true;
        }
    } finally {
        if (abortController === controller) {
            abortController = null;
            $isPageInspectionLoading.set(false);
        }
    }
}

export function initPageInspectionService(siteModel?: SiteModel | null): void {
    const wasStarted = cleanups.length > 0;
    if (!wasStarted) {
        let previousContext: ReturnType<typeof $contentContext.get> = null;
        cleanups.push(
            $contentScopeKey.subscribe((scopeKey) => {
                const context = $contentContext.get();
                const sameOwner = isSameInspectionOwner(previousContext, context);
                previousContext = context;
                abortController?.abort();
                abortController = null;
                if (!sameOwner) {
                    $pageTemplateOptions.set([]);
                    $pageControllerOptions.set([]);
                }
                $arePageTemplatesResolved.set(false);
                retryNeeded = false;
                $isPageInspectionLoading.set(false);
                if (scopeKey) {
                    void loadTemplatesAndControllers();
                }
            }),
        );

        const onContentCreatedOrUpdated = (event: ContentEvent | null): void => {
            if (!event) {
                return;
            }

            const ctx = $contentContext.get();
            if (!ctx) {
                return;
            }

            if (event.data.some((summary) => affectsPageInspection(summary, ctx))) {
                reloadDebounced();
            }
        };

        const unsubContentCreated = $contentCreated.listen(onContentCreatedOrUpdated);
        const unsubContentUpdated = $contentUpdated.listen(onContentCreatedOrUpdated);
        const unsubContentDeleted = $contentDeleted.listen((event) => {
            if (!event) {
                return;
            }

            const ctx = $contentContext.get();

            if (!ctx?.sitePath) {
                return;
            }

            const isUnderSite = event.data.some((item) => item.getPath()?.toString().startsWith(`${ctx.sitePath}/`));

            if (isUnderSite) {
                reloadDebounced();
            }
        });

        cleanups.push(unsubContentCreated, unsubContentUpdated, unsubContentDeleted);

        let lastControllerKey: string | null = null;
        let requestId = 0;
        cleanups.push(
            computed([$page, $pageVersion, $contentScopeKey], (page, _version, scopeKey) =>
                page?.hasController() && scopeKey ? `${scopeKey}::${page.getController().toString()}` : null,
            ).subscribe((key) => {
                if (key === lastControllerKey) {
                    return;
                }
                lastControllerKey = key;
                const currentRequest = ++requestId;
                if (!key) {
                    $pageConfigDescriptor.set(null);
                    return;
                }
                const descriptorKey = $page.get()?.getController().toString();
                void (async () => {
                    try {
                        const { loadPageDescriptor } = await import('../api/pageInspection.api');
                        const descriptor = await loadPageDescriptor(descriptorKey).unwrapOr(undefined);
                        if (currentRequest === requestId) {
                            $pageConfigDescriptor.set(descriptor ?? null);
                        }
                    } catch {
                        if (currentRequest === requestId) {
                            $pageConfigDescriptor.set(null);
                        }
                    }
                })();
            }),
            () => {
                requestId++;
            },
        );
    }

    // Reload when applications change in the SiteConfigurator dialog before any server round-trip.
    if ((siteModel ?? null) !== activeSiteModel) {
        detachSiteModel();
        activeSiteModel = siteModel ?? null;
        detachSiteModel = siteModel ? listenForSiteModelChanges(siteModel, reloadDebounced) : () => {};
        if (wasStarted) {
            void loadTemplatesAndControllers();
        }
    } else if (wasStarted && !abortController && (retryNeeded || !$arePageTemplatesResolved.get())) {
        void loadTemplatesAndControllers();
    }
}

export function cleanupPageInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    detachSiteModel();
    detachSiteModel = () => {};
    activeSiteModel = null;
    reloadDebounced.cancel();
    retryNeeded = false;

    abortController?.abort();
    abortController = null;

    $pageTemplateOptions.set([]);
    $arePageTemplatesResolved.set(false);
    $pageControllerOptions.set([]);
    $pageConfigDescriptor.set(null);
    $isPageInspectionLoading.set(false);
}
