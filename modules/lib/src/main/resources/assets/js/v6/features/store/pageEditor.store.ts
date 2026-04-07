import {atom, computed, map} from 'nanostores';
import type {Page} from '../../../app/page/Page';
import type {ComponentPath} from '../../../app/page/region/ComponentPath';
import type {ComponentType} from '../../../app/page/region/ComponentType';
import type {ComponentTextUpdatedOrigin} from '../../../app/page/region/ComponentTextUpdatedOrigin';
import type {DescriptorKey} from '../../../app/page/DescriptorKey';
import type {PageTemplateKey} from '../../../app/page/PageTemplateKey';
import {PageEventsManager} from '../../../app/wizard/PageEventsManager';
import {PageState} from '../../../app/wizard/page/PageState';

//
// * State
//

type PageEditorLifecycle = {
    isPageLocked: boolean;
    isPageRenderable: boolean | undefined;
    isPageReady: boolean;
};

export const $pageEditorLifecycle = map<PageEditorLifecycle>({
    isPageLocked: false,
    isPageRenderable: undefined,
    isPageReady: false,
});

export const $page = atom<Page | null>(null);

export const $pageVersion = atom<number>(0);

export const $hasDefaultPageTemplate = atom<boolean>(false);

//
// * Computed
//

export const $hasControllerOrTemplate = computed(
    [$page, $pageVersion],
    (page): boolean => {
        return !!page && (page.hasController() || !!page.getTemplate() || page.isFragment());
    },
);

export const $isFragment = computed(
    [$page, $pageVersion],
    (page): boolean => page?.isFragment() ?? false,
);

export const $isInsertTabAvailable = computed(
    [$pageEditorLifecycle, $hasControllerOrTemplate, $hasDefaultPageTemplate],
    (lifecycle, hasControllerOrTemplate, hasDefaultTemplate): boolean => {
        if (!lifecycle.isPageReady || lifecycle.isPageLocked || !lifecycle.isPageRenderable) {
            return false;
        }
        return hasControllerOrTemplate || hasDefaultTemplate;
    },
);

//
// * Internal
//

function bumpPageVersion(): void {
    $pageVersion.set($pageVersion.get() + 1);
}

function syncPageFromState(): void {
    const currentPage = PageState.getState();
    if (currentPage !== $page.get()) {
        $page.set(currentPage);
    }
    bumpPageVersion();
}

//
// * Actions — store state
//

export function setHasDefaultPageTemplate(value: boolean): void {
    $hasDefaultPageTemplate.set(value);
}

//
// * Actions — command dispatch
//

export function requestSetPageTemplate(key: PageTemplateKey): void {
    PageEventsManager.get().notifyPageTemplateSetRequested(key);
}

export function requestSetPageController(controller: DescriptorKey): void {
    PageEventsManager.get().notifyPageControllerSetRequested(controller);
}

export function requestCustomizePage(): void {
    PageEventsManager.get().notifyCustomizePageRequested();
}

export function requestPageReset(): void {
    PageEventsManager.get().notifyPageResetRequested();
}

export function requestSetComponentDescriptor(path: ComponentPath, descriptorKey: DescriptorKey): void {
    PageEventsManager.get().notifyComponentDescriptorSetRequested(path, descriptorKey);
}

export function requestUpdateTextComponent(path: ComponentPath, text: string, origin?: ComponentTextUpdatedOrigin): void {
    PageEventsManager.get().notifyTextComponentUpdateRequested(path, text, origin);
}

export function requestSetFragmentComponent(path: ComponentPath, id: string): void {
    PageEventsManager.get().notifySetFragmentComponentRequested(path, id);
}

export function requestComponentAdd(path: ComponentPath, type: ComponentType): void {
    PageEventsManager.get().notifyComponentAddRequested(path, type);
}

export function requestComponentRemove(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentRemoveRequested(path);
}

export function requestComponentDuplicate(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentDuplicateRequested(path);
}

export function requestComponentMove(from: ComponentPath, to: ComponentPath): void {
    PageEventsManager.get().notifyComponentMoveRequested(from, to);
}

//
// * Bridge
//

type Unsubscribe = () => void;

const cleanups: Unsubscribe[] = [];

export type InitPageEditorBridgeOptions = {
    hasDefaultPageTemplate?: boolean;
};

export function initPageEditorBridge(options?: InitPageEditorBridgeOptions): void {
    cleanupPageEditorBridge();

    const mgr = PageEventsManager.get();
    const events = PageState.getEvents();

    // Lifecycle events from PageEventsManager

    const onLocked = () => $pageEditorLifecycle.setKey('isPageLocked', true);
    mgr.onPageLocked(onLocked);
    cleanups.push(() => mgr.unPageLocked(onLocked));

    const onUnlocked = () => $pageEditorLifecycle.setKey('isPageLocked', false);
    mgr.onPageUnlocked(onUnlocked);
    cleanups.push(() => mgr.unPageUnlocked(onUnlocked));

    const onRenderable = (val: boolean) => $pageEditorLifecycle.setKey('isPageRenderable', val);
    mgr.onRenderableChanged(onRenderable);
    cleanups.push(() => mgr.unRenderableChanged(onRenderable));

    const onReady = () => $pageEditorLifecycle.setKey('isPageReady', true);
    mgr.onLiveEditPageViewReady(onReady);
    cleanups.push(() => mgr.unLiveEditPageViewReady(onReady));

    const onBeforeLoad = () => $pageEditorLifecycle.setKey('isPageReady', false);
    mgr.onBeforeLoad(onBeforeLoad);
    cleanups.push(() => mgr.unBeforeLoad(onBeforeLoad));

    // Page model events from PageState.getEvents()

    const onPageUpdated = () => syncPageFromState();
    events.onPageUpdated(onPageUpdated);
    cleanups.push(() => events.unPageUpdated(onPageUpdated));

    const onPageReset = () => {
        $page.set(null);
        bumpPageVersion();
    };
    events.onPageReset(onPageReset);
    cleanups.push(() => events.unPageReset(onPageReset));

    const onComponentAdded = () => bumpPageVersion();
    events.onComponentAdded(onComponentAdded);
    cleanups.push(() => events.unComponentAdded(onComponentAdded));

    const onComponentRemoved = () => bumpPageVersion();
    events.onComponentRemoved(onComponentRemoved);
    cleanups.push(() => events.unComponentRemoved(onComponentRemoved));

    const onComponentUpdated = () => bumpPageVersion();
    events.onComponentUpdated(onComponentUpdated);
    cleanups.push(() => events.unComponentUpdated(onComponentUpdated));

    const onConfigUpdated = () => bumpPageVersion();
    events.onPageConfigUpdated(onConfigUpdated);
    cleanups.push(() => events.unPageConfigUpdated(onConfigUpdated));

    // Initial sync

    syncPageFromState();

    if (options?.hasDefaultPageTemplate != null) {
        $hasDefaultPageTemplate.set(options.hasDefaultPageTemplate);
    }
}

export function cleanupPageEditorBridge(): void {
    for (const fn of cleanups) {
        fn();
    }
    cleanups.length = 0;

    $pageEditorLifecycle.set({
        isPageLocked: false,
        isPageRenderable: undefined,
        isPageReady: false,
    });
    $page.set(null);
    $pageVersion.set(0);
    $hasDefaultPageTemplate.set(false);
}
