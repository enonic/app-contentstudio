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

export const $arePageControllersResolved = atom<boolean>(false);

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
        if (!isResolved) return false;
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
    [
        $pageTemplateOptions,
        $pageControllerOptions,
        $selectedPageOptionKey,
        $arePageTemplatesResolved,
        $arePageControllersResolved,
    ],
    (templates, controllers, selectedKey, templatesResolved, controllersResolved): boolean => {
        if (!templatesResolved || !controllersResolved) return false;
        if (selectedKey !== AUTO_KEY) return false;
        return templates.length === 0 && controllers.length === 0;
    },
);

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];
let activeSiteModel: SiteModel | null | undefined;
let activeScopeKey: string | null = null;
let activeListIdentityKey: string | null = null;
let descriptorRequestId = 0;

function listIdentityKey(): string | null {
    const ctx = $contentContext.get();
    return ctx
        ? JSON.stringify([ctx.contentId.toString(), ctx.contentTypeName.toString(), ctx.siteId?.toString() ?? null])
        : null;
}

function affectsPageInspection(summary: ContentSummary, ctx: PageEditorContentContext): boolean {
    const id = summary.getContentId().toString();
    if (id === ctx.contentId.toString()) return true;
    if (ctx.siteId && id === ctx.siteId.toString()) return true;
    if (ctx.sitePath && summary.getType().isPageTemplate()) {
        return summary.getPath().toString().startsWith(`${ctx.sitePath}/`);
    }
    return false;
}

async function loadTemplatesAndControllers(ctx: PageEditorContentContext): Promise<void> {
    const scopeKey = $contentScopeKey.get();
    if (!scopeKey || scopeKey !== activeScopeKey) return;
    const requestIdentityKey = activeListIdentityKey;

    $isPageInspectionLoading.set(true);
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    const { signal } = controller;

    try {
        const { loadPageTemplatesByCanRender, loadPageControllers } = await import('../api/pageInspection.api');
        if (signal.aborted) return;

        const [templateResult, controllerResult] = await Promise.all([
            ctx.siteId ? loadPageTemplatesByCanRender(ctx.siteId, ctx.contentTypeName, signal) : null,
            loadPageControllers(ctx.contentId, signal),
        ]);

        if (signal.aborted || requestIdentityKey !== activeListIdentityKey) return;
        if (!ctx.siteId || templateResult?.isOk()) {
            $pageTemplateOptions.set(templateResult?.isOk() ? templateResult.value : []);
            $arePageTemplatesResolved.set(true);
        }
        if (controllerResult.isOk()) {
            $pageControllerOptions.set(controllerResult.value);
            $arePageControllersResolved.set(true);
        }
    } catch {
        // Keep the last successful options on a failed refresh.
    } finally {
        if (!signal.aborted) {
            abortController = null;
            $isPageInspectionLoading.set(false);
        }
    }
}

function unbindPageInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    abortController?.abort();
    abortController = null;
    ++descriptorRequestId;
    activeSiteModel = undefined;
    $isPageInspectionLoading.set(false);
}

function clearPageInspectionOptions(): void {
    $pageTemplateOptions.set([]);
    $arePageTemplatesResolved.set(false);
    $pageControllerOptions.set([]);
    $arePageControllersResolved.set(false);
    $pageConfigDescriptor.set(null);
}

export function initPageInspectionService(siteModel?: SiteModel | null): void {
    const nextSiteModel = siteModel ?? null;
    if (activeSiteModel !== undefined && activeSiteModel === nextSiteModel) {
        if (
            !$isPageInspectionLoading.get() &&
            (!$arePageTemplatesResolved.get() || !$arePageControllersResolved.get())
        ) {
            const ctx = $contentContext.get();
            if (ctx) void loadTemplatesAndControllers(ctx);
        }
        return;
    }

    const previousScope = activeScopeKey;
    unbindPageInspection();
    activeSiteModel = nextSiteModel;

    cleanups.push(
        $contentScopeKey.subscribe((scopeKey) => {
            if (scopeKey === activeScopeKey) return;
            const nextIdentityKey = listIdentityKey();
            const sameIdentity = nextIdentityKey !== null && nextIdentityKey === activeListIdentityKey;
            activeScopeKey = scopeKey;
            activeListIdentityKey = nextIdentityKey;
            if (sameIdentity) return;
            abortController?.abort();
            abortController = null;
            $isPageInspectionLoading.set(false);
            ++descriptorRequestId;
            clearPageInspectionOptions();
            const ctx = $contentContext.get();
            if (scopeKey && ctx) void loadTemplatesAndControllers(ctx);
        }),
    );

    // Reload when the current content, the site, or a descendant page-template is updated.
    const reloadDebounced = createDebounce(() => {
        const ctx = $contentContext.get();
        if (ctx) void loadTemplatesAndControllers(ctx);
    }, 300);

    const onContentCreatedOrUpdated = (event: ContentEvent | null): void => {
        if (!event) return;

        const ctx = $contentContext.get();
        if (!ctx) return;

        if (event.data.some((summary) => affectsPageInspection(summary, ctx))) reloadDebounced();
    };

    const unsubContentCreated = $contentCreated.listen(onContentCreatedOrUpdated);
    const unsubContentUpdated = $contentUpdated.listen(onContentCreatedOrUpdated);
    const unsubContentDeleted = $contentDeleted.listen((event) => {
        if (!event) return;

        const ctx = $contentContext.get();

        if (!ctx?.sitePath) return;

        const isUnderSite = event.data.some((item) => item.getPath()?.toString().startsWith(`${ctx.sitePath}/`));

        if (isUnderSite) reloadDebounced();
    });

    cleanups.push(() => {
        reloadDebounced.cancel();
        unsubContentCreated();
        unsubContentUpdated();
        unsubContentDeleted();
    });

    // Reload when applications change in the SiteConfigurator dialog before any server round-trip.
    if (siteModel) {
        const onSiteModelChange = (): void => reloadDebounced();
        siteModel.onApplicationAdded(onSiteModelChange);
        siteModel.onApplicationRemoved(onSiteModelChange);
        siteModel.onSiteModelUpdated(onSiteModelChange);
        cleanups.push(() => {
            siteModel.unApplicationAdded(onSiteModelChange);
            siteModel.unApplicationRemoved(onSiteModelChange);
            siteModel.unSiteModelUpdated(onSiteModelChange);
        });
    }

    // Load descriptor when controller changes
    let lastRequestKey: string | null = null;

    const unsubPage = computed([$page, $pageVersion, $contentScopeKey], (page, _version, scopeKey) => ({
        controllerKey: page?.hasController() ? page.getController().toString() : null,
        scopeKey,
    })).subscribe(({ controllerKey, scopeKey }) => {
        const requestKey = controllerKey && scopeKey ? JSON.stringify([scopeKey, controllerKey]) : null;
        if (requestKey === lastRequestKey) return;
        lastRequestKey = requestKey;
        const requestId = ++descriptorRequestId;

        if (!requestKey) {
            $pageConfigDescriptor.set(null);
            return;
        }

        void (async () => {
            try {
                const { loadPageDescriptor } = await import('../api/pageInspection.api');
                if (requestId !== descriptorRequestId) return;
                const descriptor = await loadPageDescriptor(controllerKey).unwrapOr(undefined);
                if (requestId === descriptorRequestId) $pageConfigDescriptor.set(descriptor ?? null);
            } catch {
                if (requestId === descriptorRequestId) $pageConfigDescriptor.set(null);
            }
        })();
    });
    cleanups.push(unsubPage);

    if (previousScope === activeScopeKey && previousScope !== null) {
        const ctx = $contentContext.get();
        if (ctx) void loadTemplatesAndControllers(ctx);
    }
}

export function cleanupPageInspection(): void {
    unbindPageInspection();
    activeScopeKey = null;
    activeListIdentityKey = null;
    clearPageInspectionOptions();
}
