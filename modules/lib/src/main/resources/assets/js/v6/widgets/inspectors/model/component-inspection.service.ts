import { computed } from 'nanostores';
import { DescriptorBasedComponent } from '../../../../app/page/region/DescriptorBasedComponent';
import type { SiteModel } from '../../../../app/site/SiteModel';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $areLayoutDescriptorsResolved,
    $arePartDescriptorsResolved,
    $componentConfigDescriptor,
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    $partDescriptorRefreshVersion,
    resetComponentInspection,
} from './component-inspection.store';
import { $contentContext, $contentScopeKey, $inspectedItem, $pageVersion } from './page-editor/store';
import { isSameInspectionOwner } from './page-editor/inspectionScope';
import { listenForSiteModelChanges } from './siteModelInspection';

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];
let activeSiteModel: SiteModel | null = null;
let detachSiteModel = (): void => {};
const failedTypes = new Set<'part' | 'layout'>();
const reloadDebounced = createDebounce(() => {
    void refreshDescriptors(true);
}, 300);

async function refreshDescriptors(force = false): Promise<void> {
    const ctx = $contentContext.get();
    const scopeKey = $contentScopeKey.get();
    if (!ctx || !scopeKey) {
        return;
    }

    const loadParts = force || failedTypes.has('part') || !$arePartDescriptorsResolved.get();
    const loadLayouts = force || failedTypes.has('layout') || !$areLayoutDescriptorsResolved.get();
    if (!loadParts && !loadLayouts) {
        return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    const { signal } = controller;
    $isComponentInspectionLoading.set(true);

    try {
        const { loadComponentDescriptors } = await import('../api/componentInspection.api');
        if (signal.aborted || $contentScopeKey.get() !== scopeKey) {
            return;
        }

        await Promise.all(
            (
                [
                    ['part', loadParts, $partDescriptorOptions, $arePartDescriptorsResolved],
                    ['layout', loadLayouts, $layoutDescriptorOptions, $areLayoutDescriptorsResolved],
                ] as const
            ).map(async ([type, shouldLoad, options, resolved]) => {
                if (!shouldLoad) {
                    return;
                }
                try {
                    const result = await loadComponentDescriptors(type, ctx.contentId, signal);
                    if (signal.aborted || $contentScopeKey.get() !== scopeKey) {
                        return;
                    }
                    if (result.isErr()) {
                        failedTypes.add(type);
                        return;
                    }
                    failedTypes.delete(type);
                    options.set(result.value);
                    resolved.set(true);
                    if (type === 'part') {
                        $partDescriptorRefreshVersion.set($partDescriptorRefreshVersion.get() + 1);
                    }
                } catch {
                    // Keep the last successful options; retry this type on the next refresh.
                    if (!signal.aborted && $contentScopeKey.get() === scopeKey) {
                        failedTypes.add(type);
                    }
                }
            }),
        );
    } catch {
        // Keep the last successful options if the API module cannot load.
        if (!signal.aborted && $contentScopeKey.get() === scopeKey) {
            if (loadParts) {
                failedTypes.add('part');
            }
            if (loadLayouts) {
                failedTypes.add('layout');
            }
        }
    } finally {
        if (abortController === controller) {
            abortController = null;
            $isComponentInspectionLoading.set(false);
        }
    }
}

export const start = (siteModel?: SiteModel | null): void => {
    const wasStarted = cleanups.length > 0;
    if (!wasStarted) {
        let previousContext: ReturnType<typeof $contentContext.get> = null;
        cleanups.push(
            $contentScopeKey.subscribe(() => {
                const context = $contentContext.get();
                const sameDescriptorOwner = isSameInspectionOwner(previousContext, context);
                previousContext = context;
                abortController?.abort();
                abortController = null;
                // A site rename changes the scope path, but its descriptors remain valid while refreshing.
                if (!sameDescriptorOwner) {
                    $partDescriptorOptions.set([]);
                    $layoutDescriptorOptions.set([]);
                }
                failedTypes.clear();
                $arePartDescriptorsResolved.set(false);
                $areLayoutDescriptorsResolved.set(false);
                $isComponentInspectionLoading.set(false);
                void refreshDescriptors();
            }),
        );

        // Load the active descriptor only when its key or scope changes.
        let lastKey: string | null = null;
        let requestId = 0;
        cleanups.push(
            computed([$inspectedItem, $pageVersion, $contentScopeKey], (item, _version, scopeKey) => {
                if (!(item instanceof DescriptorBasedComponent) || !item.hasDescriptor() || !scopeKey) {
                    return null;
                }
                return `${scopeKey}::${item.getType().getShortName()}::${item.getDescriptorKey().toString()}`;
            }).subscribe((key) => {
                if (key === lastKey) {
                    return;
                }
                lastKey = key;
                const currentRequest = ++requestId;
                if (!key) {
                    $componentConfigDescriptor.set(null);
                    return;
                }
                const component = $inspectedItem.get() as DescriptorBasedComponent;
                void (async () => {
                    try {
                        const { loadComponentDescriptor } = await import('../api/componentInspection.api');
                        const descriptor = await loadComponentDescriptor(
                            component.getType().getShortName(),
                            component.getDescriptorKey().toString(),
                        ).unwrapOr(undefined);
                        if (currentRequest === requestId) {
                            $componentConfigDescriptor.set(descriptor ?? null);
                        }
                    } catch {
                        if (currentRequest === requestId) {
                            $componentConfigDescriptor.set(null);
                        }
                    }
                })();
            }),
            () => {
                requestId++;
            },
        );
    }

    if ((siteModel ?? null) !== activeSiteModel) {
        detachSiteModel();
        activeSiteModel = siteModel ?? null;
        detachSiteModel = siteModel ? listenForSiteModelChanges(siteModel, reloadDebounced) : () => {};
        if (wasStarted) {
            void refreshDescriptors(true);
        }
    } else if (wasStarted && !abortController) {
        void refreshDescriptors();
    }
};

export const stop = (): void => {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    detachSiteModel();
    detachSiteModel = () => {};
    activeSiteModel = null;
    reloadDebounced.cancel();
    failedTypes.clear();

    abortController?.abort();
    abortController = null;

    resetComponentInspection();
};
