import {atom, computed} from 'nanostores';
import type {Descriptor} from '../../../app/page/Descriptor';
import {DescriptorBasedComponent} from '../../../app/page/region/DescriptorBasedComponent';
import type {SiteModel} from '../../../app/site/SiteModel';
import {createDebounce} from '../utils/timing/createDebounce';
import type {PageEditorContentContext} from './page-editor/types';
import {$contentContext, $inspectedItem, $pageVersion} from './page-editor/store';

//
// * State
//

export const $partDescriptorOptions = atom<Descriptor[]>([]);

export const $layoutDescriptorOptions = atom<Descriptor[]>([]);

export const $componentConfigDescriptor = atom<Descriptor | null>(null);

export const $isComponentInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedComponentDescriptorKey = computed(
    [$inspectedItem, $pageVersion],
    (item): string | null => {
        if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
            return item.getDescriptorKey().toString();
        }
        return null;
    },
);

//
// * Service
//

let abortController: AbortController | null = null;
const cleanups: (() => void)[] = [];

async function loadDescriptors(ctx: PageEditorContentContext): Promise<void> {
    $isComponentInspectionLoading.set(true);
    abortController?.abort();
    abortController = new AbortController();
    const {signal} = abortController;

    try {
        const {loadComponentDescriptors} = await import('../api/componentInspection');

        const [parts, layouts] = await Promise.all([
            loadComponentDescriptors('part', ctx.contentId),
            loadComponentDescriptors('layout', ctx.contentId),
        ]);

        if (!signal.aborted) {
            $partDescriptorOptions.set(parts);
            $layoutDescriptorOptions.set(layouts);
        }
    } catch {
        // Aborted or failed
    } finally {
        if (!signal.aborted) {
            $isComponentInspectionLoading.set(false);
        }
    }
}

export function initComponentInspectionService(siteModel?: SiteModel | null): void {
    cleanupComponentInspection();

    const unsubContext = $contentContext.subscribe((ctx) => {
        if (!ctx) return;
        void loadDescriptors(ctx);
    });
    cleanups.push(unsubContext);

    // Reload when applications change in the SiteConfigurator dialog before any server round-trip.
    const reloadDebounced = createDebounce(() => {
        const ctx = $contentContext.get();
        if (ctx) void loadDescriptors(ctx);
    }, 300);

    if (siteModel) {
        const onSiteModelChange = (): void => reloadDebounced();
        siteModel.onApplicationAdded(onSiteModelChange);
        siteModel.onApplicationRemoved(onSiteModelChange);
        siteModel.onSiteModelUpdated(onSiteModelChange);
        cleanups.push(() => {
            reloadDebounced.cancel();
            siteModel.unApplicationAdded(onSiteModelChange);
            siteModel.unApplicationRemoved(onSiteModelChange);
            siteModel.unSiteModelUpdated(onSiteModelChange);
        });
    } else {
        cleanups.push(() => reloadDebounced.cancel());
    }

    // Load the active descriptor when the inspected component's descriptor key changes
    let lastKey: string | null = null;

    const $derivedDescriptorInfo = computed(
        [$inspectedItem, $pageVersion],
        (item): {componentType: string; descriptorKey: string} | null => {
            if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
                return {
                    componentType: item.getType().getShortName(),
                    descriptorKey: item.getDescriptorKey().toString(),
                };
            }
            return null;
        },
    );

    const unsubItem = $derivedDescriptorInfo.subscribe((info) => {
        const newKey = info ? `${info.componentType}::${info.descriptorKey}` : null;

        if (newKey === lastKey) return;
        lastKey = newKey;

        if (!info) {
            $componentConfigDescriptor.set(null);
            return;
        }

        void (async () => {
            try {
                const {loadComponentDescriptor} = await import('../api/componentInspection');
                const descriptor = await loadComponentDescriptor(info.componentType, info.descriptorKey);
                $componentConfigDescriptor.set(descriptor ?? null);
            } catch {
                $componentConfigDescriptor.set(null);
            }
        })();
    });
    cleanups.push(unsubItem);
}

export function cleanupComponentInspection(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;

    abortController?.abort();
    abortController = null;

    $partDescriptorOptions.set([]);
    $layoutDescriptorOptions.set([]);
    $componentConfigDescriptor.set(null);
    $isComponentInspectionLoading.set(false);
}
