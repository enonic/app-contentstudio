import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Descriptor } from '../../../../app/page/Descriptor';
import type { Page } from '../../../../app/page/Page';
import { ComponentPath } from '../../../../app/page/region/ComponentPath';
import { DescriptorBasedComponent } from '../../../../app/page/region/DescriptorBasedComponent';
import { FragmentComponent } from '../../../../app/page/region/FragmentComponent';
import type { PageItem } from '../../../../app/page/region/PageItem';
import type { SiteModel } from '../../../../app/site/SiteModel';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { loadComponentDescriptor } from '../api/componentInspection.api';
import type { PageEditorContentContext } from './page-editor/types';
import { $contentContext, $inspectedItem, $pageVersion } from './page-editor/store';

//
// * State
//

export const $partDescriptorOptions = atom<Descriptor[]>([]);

// Keep icons for components already on the page if a refresh briefly omits their descriptor.
export const $partDescriptorIconUrls = atom<ReadonlyMap<string, string>>(new Map());

export const $layoutDescriptorOptions = atom<Descriptor[]>([]);

export const $componentConfigDescriptor = atom<Descriptor | null>(null);

export const $isComponentInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedComponentDescriptorKey = computed([$inspectedItem, $pageVersion], (item): string | null => {
    if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
        return item.getDescriptorKey().toString();
    }
    return null;
});

//
// * API
//

// Returns true when the component at nodeId points at a reference that no longer
// exists: a fragment whose content was removed, or a part/layout whose descriptor
// is missing from the loaded options.
export function isComponentReferenceMissing(
    nodeId: string,
    page: Page | null,
    fragments: ContentSummary[],
    descriptors: Descriptor[],
    isLoading: boolean,
): boolean {
    if (isLoading) return false;

    const component = page?.getComponentByPath(ComponentPath.fromString(nodeId)) ?? null;
    return isReferenceMissing(component, fragments, descriptors);
}

export function isReferenceMissing(
    component: PageItem | null,
    fragments: ContentSummary[],
    descriptors: Descriptor[],
): boolean {
    if (component instanceof FragmentComponent) {
        if (!component.hasFragment()) return false;
        const id = component.getFragment().toString();
        return !fragments.some((f) => f.getId() === id);
    }

    if (component instanceof DescriptorBasedComponent) {
        if (!component.hasDescriptor()) return false;
        const key = component.getDescriptorKey().toString();
        return !descriptors.some((d) => d.getKey().toString() === key);
    }

    return false;
}

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];
let activeSiteModel: SiteModel | null | undefined;
let activeScopeKey: string | null = null;
let activeContentId: string | null = null;
let loadingScopeKey: string | null = null;
let loadedPartScopeKey: string | null = null;
let loadedLayoutScopeKey: string | null = null;
let componentDescriptorRequestId = 0;

function getDescriptorScopeKey(ctx: PageEditorContentContext): string {
    return JSON.stringify([
        ctx.contentId.toString(),
        ctx.contentTypeName.toString(),
        ctx.siteId?.toString() ?? null,
        ctx.sitePath,
    ]);
}

function refreshDescriptors(ctx: PageEditorContentContext, force = false): void {
    const scopeKey = getDescriptorScopeKey(ctx);
    const contentId = ctx.contentId.toString();

    if (activeScopeKey !== scopeKey) {
        if (activeScopeKey !== null) {
            $partDescriptorOptions.set([]);
            $layoutDescriptorOptions.set([]);
            $componentConfigDescriptor.set(null);
        }
        if (activeContentId !== contentId) {
            $partDescriptorIconUrls.set(new Map());
        }
        activeScopeKey = scopeKey;
        activeContentId = contentId;
        loadedPartScopeKey = null;
        loadedLayoutScopeKey = null;
    }

    if (
        !force &&
        (loadingScopeKey === scopeKey || (loadedPartScopeKey === scopeKey && loadedLayoutScopeKey === scopeKey))
    ) {
        return;
    }

    void loadDescriptors(ctx, scopeKey, force);
}

async function loadDescriptors(ctx: PageEditorContentContext, scopeKey: string, force: boolean): Promise<void> {
    const loadParts = force || loadedPartScopeKey !== scopeKey;
    const loadLayouts = force || loadedLayoutScopeKey !== scopeKey;
    loadingScopeKey = scopeKey;
    $isComponentInspectionLoading.set(true);
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;

    try {
        const { loadComponentDescriptors } = await import('../api/componentInspection.api');

        const [partsResult, layoutsResult] = await Promise.all([
            loadParts ? loadComponentDescriptors('part', ctx.contentId) : null,
            loadLayouts ? loadComponentDescriptors('layout', ctx.contentId) : null,
        ]);

        if (signal.aborted) {
            return;
        }

        if (partsResult?.isOk()) {
            const iconUrls = new Map($partDescriptorIconUrls.get());
            for (const descriptor of partsResult.value) {
                const key = descriptor.getKey().toString();
                const iconUrl = descriptor.getIcon();
                if (iconUrl) {
                    iconUrls.set(key, iconUrl);
                } else {
                    iconUrls.delete(key);
                }
            }
            $partDescriptorIconUrls.set(iconUrls);
            $partDescriptorOptions.set(partsResult.value);
            loadedPartScopeKey = scopeKey;
        }
        if (layoutsResult?.isOk()) {
            $layoutDescriptorOptions.set(layoutsResult.value);
            loadedLayoutScopeKey = scopeKey;
        }
    } catch {
        // Keep the last successful options when a request fails.
    } finally {
        if (!signal.aborted) {
            loadingScopeKey = null;
            $isComponentInspectionLoading.set(false);
        }
    }
}

function stopComponentInspectionService(): void {
    for (const fn of cleanups) {
        fn();
    }
    cleanups.length = 0;

    abortController?.abort();
    abortController = null;
    ++componentDescriptorRequestId;
    activeSiteModel = undefined;
    loadingScopeKey = null;
    $isComponentInspectionLoading.set(false);
}

export function initComponentInspectionService(siteModel?: SiteModel | null): void {
    const nextSiteModel = siteModel ?? null;
    if (activeSiteModel !== undefined && activeSiteModel === nextSiteModel) {
        return;
    }

    // A new SiteModel may still describe the same content. Keep visible options
    // and icons until its replacement request finishes.
    stopComponentInspectionService();
    activeSiteModel = nextSiteModel;
    loadedPartScopeKey = null;
    loadedLayoutScopeKey = null;

    const unsubContext = $contentContext.subscribe((ctx) => {
        if (!ctx) return;
        refreshDescriptors(ctx);
    });
    cleanups.push(unsubContext);

    // Reload when applications change in the SiteConfigurator dialog before any server round-trip.
    const reloadDebounced = createDebounce(() => {
        const ctx = $contentContext.get();
        if (ctx) {
            refreshDescriptors(ctx, true);
        }
    }, 300);

    if (siteModel) {
        const onSiteModelChange = (): void => reloadDebounced();
        siteModel.onApplicationAdded(onSiteModelChange);
        siteModel.onApplicationRemoved(onSiteModelChange);
        siteModel.onApplicationStarted(onSiteModelChange);
        siteModel.onApplicationUnavailable(onSiteModelChange);
        siteModel.onApplicationUninstalled(onSiteModelChange);
        siteModel.onSiteModelUpdated(onSiteModelChange);
        cleanups.push(() => {
            reloadDebounced.cancel();
            siteModel.unApplicationAdded(onSiteModelChange);
            siteModel.unApplicationRemoved(onSiteModelChange);
            siteModel.unApplicationStarted(onSiteModelChange);
            siteModel.unApplicationUnavailable(onSiteModelChange);
            siteModel.unApplicationUninstalled(onSiteModelChange);
            siteModel.unSiteModelUpdated(onSiteModelChange);
        });
    } else {
        cleanups.push(() => reloadDebounced.cancel());
    }

    // Load the active descriptor when the inspected component's descriptor key changes
    let lastKey: string | null = null;

    const $derivedDescriptorInfo = computed(
        [$inspectedItem, $pageVersion, $contentContext],
        (item, _pageVersion, ctx): { componentType: string; descriptorKey: string; scopeKey: string } | null => {
            if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
                return {
                    componentType: item.getType().getShortName(),
                    descriptorKey: item.getDescriptorKey().toString(),
                    scopeKey: ctx ? getDescriptorScopeKey(ctx) : '',
                };
            }
            return null;
        },
    );

    const unsubItem = $derivedDescriptorInfo.subscribe((info) => {
        const newKey = info ? `${info.scopeKey}::${info.componentType}::${info.descriptorKey}` : null;

        if (newKey === lastKey) return;
        lastKey = newKey;
        const requestId = ++componentDescriptorRequestId;

        if (!info) {
            $componentConfigDescriptor.set(null);
            return;
        }

        void (async () => {
            try {
                const descriptor = await loadComponentDescriptor(info.componentType, info.descriptorKey).unwrapOr(
                    undefined,
                );
                if (requestId === componentDescriptorRequestId) {
                    $componentConfigDescriptor.set(descriptor ?? null);
                }
            } catch {
                if (requestId === componentDescriptorRequestId) {
                    $componentConfigDescriptor.set(null);
                }
            }
        })();
    });
    cleanups.push(unsubItem);
}

export function cleanupComponentInspection(): void {
    stopComponentInspectionService();
    activeScopeKey = null;
    activeContentId = null;
    loadedPartScopeKey = null;
    loadedLayoutScopeKey = null;

    $partDescriptorOptions.set([]);
    $partDescriptorIconUrls.set(new Map());
    $layoutDescriptorOptions.set([]);
    $componentConfigDescriptor.set(null);
}
