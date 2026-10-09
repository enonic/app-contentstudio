import { computed } from 'nanostores';
import { DescriptorBasedComponent } from '../../../../app/page/region/DescriptorBasedComponent';
import type { SiteModel } from '../../../../app/site/SiteModel';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { loadComponentDescriptor } from '../api/componentInspection.api';
import {
    $areLayoutDescriptorsResolved,
    $arePartDescriptorsResolved,
    $componentConfigDescriptor,
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    $partIconUrls,
    $partDescriptorRefreshVersion,
} from './component-inspection.store';
import { $contentContext, $contentScopeKey, $inspectedItem, $pageVersion } from './page-editor/store';

let activeSiteModel: SiteModel | null | undefined;
let activeScopeKey: string | null = null;
let activeDescriptorScopeKey: string | null = null;
let listAbort: AbortController | null = null;
let descriptorRequestId = 0;
const retryNeeded = { part: false, layout: false };
const cleanups: (() => void)[] = [];

function descriptorScopeKey(): string | null {
    const ctx = $contentContext.get();
    // A site rename changes its path, but not the descriptors available to this content.
    return ctx
        ? JSON.stringify([ctx.contentId.toString(), ctx.contentTypeName.toString(), ctx.siteId?.toString() ?? null])
        : null;
}

function clearOptions(): void {
    $partDescriptorOptions.set([]);
    $partIconUrls.set(new Map());
    $layoutDescriptorOptions.set([]);
    $arePartDescriptorsResolved.set(false);
    $areLayoutDescriptorsResolved.set(false);
    retryNeeded.part = false;
    retryNeeded.layout = false;
    $componentConfigDescriptor.set(null);
}

function refreshDescriptors(force = false): void {
    const ctx = $contentContext.get();
    const scopeKey = $contentScopeKey.get();
    if (!ctx || !scopeKey || scopeKey !== activeScopeKey) return;
    const requestDescriptorScopeKey = activeDescriptorScopeKey;

    const loadParts = force || retryNeeded.part || !$arePartDescriptorsResolved.get();
    const loadLayouts = force || retryNeeded.layout || !$areLayoutDescriptorsResolved.get();
    if (!loadParts && !loadLayouts) return;
    if (listAbort && !force) return;

    listAbort?.abort();
    const controller = new AbortController();
    listAbort = controller;
    $isComponentInspectionLoading.set(true);

    void (async () => {
        try {
            const { loadComponentDescriptors } = await import('../api/componentInspection.api');
            if (controller.signal.aborted) return;

            const [parts, layouts] = await Promise.all([
                loadParts ? loadComponentDescriptors('part', ctx.contentId, controller.signal) : null,
                loadLayouts ? loadComponentDescriptors('layout', ctx.contentId, controller.signal) : null,
            ]);
            if (controller.signal.aborted || activeDescriptorScopeKey !== requestDescriptorScopeKey) return;

            if (parts?.isOk()) {
                const iconUrls = new Map($partIconUrls.get());
                for (const descriptor of parts.value) {
                    const key = descriptor.getKey().toString();
                    const iconUrl = descriptor.getIcon();
                    if (iconUrl) iconUrls.set(key, iconUrl);
                    else iconUrls.delete(key);
                }
                $partIconUrls.set(iconUrls);
                $partDescriptorOptions.set(parts.value);
                $arePartDescriptorsResolved.set(true);
                $partDescriptorRefreshVersion.set($partDescriptorRefreshVersion.get() + 1);
                retryNeeded.part = false;
            } else if (loadParts) {
                retryNeeded.part = true;
            }
            if (layouts?.isOk()) {
                $layoutDescriptorOptions.set(layouts.value);
                $areLayoutDescriptorsResolved.set(true);
                retryNeeded.layout = false;
            } else if (loadLayouts) {
                retryNeeded.layout = true;
            }
        } catch {
            // Keep the last successful options and retry the failed type on the next refresh.
            if (!controller.signal.aborted) {
                if (loadParts) retryNeeded.part = true;
                if (loadLayouts) retryNeeded.layout = true;
            }
        } finally {
            if (!controller.signal.aborted) {
                listAbort = null;
                $isComponentInspectionLoading.set(false);
            }
        }
    })();
}

function unbind(): void {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
    listAbort?.abort();
    listAbort = null;
    ++descriptorRequestId;
    activeSiteModel = undefined;
    $isComponentInspectionLoading.set(false);
}

export function startComponentInspectionService(siteModel?: SiteModel | null): void {
    const nextSiteModel = siteModel ?? null;
    if (activeSiteModel !== undefined && activeSiteModel === nextSiteModel) {
        refreshDescriptors();
        return;
    }

    const previousScope = activeScopeKey;
    unbind();
    activeSiteModel = nextSiteModel;

    cleanups.push(
        $contentScopeKey.subscribe((scopeKey) => {
            if (scopeKey !== activeScopeKey) {
                const nextDescriptorScopeKey = descriptorScopeKey();
                const descriptorScopeChanged = nextDescriptorScopeKey !== activeDescriptorScopeKey;
                activeScopeKey = scopeKey;
                activeDescriptorScopeKey = nextDescriptorScopeKey;
                ++descriptorRequestId;
                if (descriptorScopeChanged) {
                    listAbort?.abort();
                    listAbort = null;
                    $isComponentInspectionLoading.set(false);
                    clearOptions();
                    refreshDescriptors();
                }
            }
        }),
    );

    const reloadDebounced = createDebounce(() => refreshDescriptors(true), 300);
    if (siteModel) {
        let applicationKeys = siteModel
            .getApplicationKeys()
            .map((key) => key.toString())
            .sort()
            .join(',');
        const onSiteModelChange = (): void => reloadDebounced();
        const onSiteModelUpdated = (): void => {
            const nextKeys = siteModel
                .getApplicationKeys()
                .map((key) => key.toString())
                .sort()
                .join(',');
            if (nextKeys === applicationKeys) return;
            applicationKeys = nextKeys;
            reloadDebounced();
        };
        siteModel.onApplicationAdded(onSiteModelChange);
        siteModel.onApplicationRemoved(onSiteModelChange);
        siteModel.onApplicationStarted(onSiteModelChange);
        siteModel.onApplicationUnavailable(onSiteModelChange);
        siteModel.onApplicationUninstalled(onSiteModelChange);
        siteModel.onSiteModelUpdated(onSiteModelUpdated);
        cleanups.push(() => {
            reloadDebounced.cancel();
            siteModel.unApplicationAdded(onSiteModelChange);
            siteModel.unApplicationRemoved(onSiteModelChange);
            siteModel.unApplicationStarted(onSiteModelChange);
            siteModel.unApplicationUnavailable(onSiteModelChange);
            siteModel.unApplicationUninstalled(onSiteModelChange);
            siteModel.unSiteModelUpdated(onSiteModelUpdated);
        });
    } else {
        cleanups.push(() => reloadDebounced.cancel());
    }

    let lastKey: string | null = null;
    const $descriptorInfo = computed([$inspectedItem, $pageVersion, $contentScopeKey], (item, _version, scopeKey) => {
        if (!scopeKey || !(item instanceof DescriptorBasedComponent) || !item.hasDescriptor()) return null;
        return {
            componentType: item.getType().getShortName(),
            descriptorKey: item.getDescriptorKey().toString(),
            scopeKey,
        };
    });
    cleanups.push(
        $descriptorInfo.subscribe((info) => {
            const key = info ? JSON.stringify([info.scopeKey, info.componentType, info.descriptorKey]) : null;
            if (key === lastKey) return;
            lastKey = key;
            const requestId = ++descriptorRequestId;
            if (!info) {
                $componentConfigDescriptor.set(null);
                return;
            }
            void (async () => {
                try {
                    const descriptor = await loadComponentDescriptor(info.componentType, info.descriptorKey).unwrapOr(
                        undefined,
                    );
                    if (requestId === descriptorRequestId) {
                        $componentConfigDescriptor.set(descriptor ?? null);
                    }
                } catch {
                    if (requestId === descriptorRequestId) {
                        $componentConfigDescriptor.set(null);
                    }
                }
            })();
        }),
    );

    // A replacement SiteModel may change either descriptor list, even if one previously failed.
    if (previousScope === activeScopeKey && previousScope !== null) {
        refreshDescriptors(true);
    }
}

export function stopComponentInspectionService(): void {
    unbind();
    activeScopeKey = null;
    activeDescriptorScopeKey = null;
    clearOptions();
    $partDescriptorRefreshVersion.set(0);
}
