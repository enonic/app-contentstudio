import {PageEventsManager} from '../../../../app/wizard/PageEventsManager';
import type {PageNavigationEvent} from '../../../../app/wizard/PageNavigationEvent';
import {PageNavigationEventType} from '../../../../app/wizard/PageNavigationEventType';
import {PageNavigationMediator} from '../../../../app/wizard/PageNavigationMediator';
import type {PageNavigationHandler} from '../../../../app/wizard/PageNavigationHandler';
import {PageState} from '../../../../app/wizard/page/PageState';
import {
    $contentContext,
    $defaultPageTemplateName,
    $hasDefaultPageTemplate,
    $inspectedPath,
    $page,
    $pageEditorLifecycle,
    $pageVersion,
    $selectedPath,
    bumpPageVersion,
    syncPageFromState,
} from './store';
import type {InitPageEditorBridgeOptions} from './types';

//
// * Bridge
//

type Unsubscribe = () => void;

const cleanups: Unsubscribe[] = [];

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

    // ! Split SELECT and INSPECT: SELECT is overlay/tree highlight only, INSPECT opens the
    // ! InspectPanel (via `$isInspecting` → tab auto-switch). Collapsing both into
    // ! `$inspectedPath` meant every iframe click auto-opened the panel, preventing
    // ! arrow-select in the components tree without forcing a tab switch (spec I7).

    const navigationHandler: PageNavigationHandler = {
        handle(event: PageNavigationEvent): void {
            const type = event.getType();
            if (type === PageNavigationEventType.DESELECT) {
                $selectedPath.set(null);
                $inspectedPath.set(null);
                return;
            }
            if (type === PageNavigationEventType.SELECT) {
                const path = event.getData().getPath();
                $selectedPath.set(path != null ? path.toString() : null);
                return;
            }
            if (type === PageNavigationEventType.INSPECT) {
                const path = event.getData().getPath();
                const str = path != null ? path.toString() : null;
                $inspectedPath.set(str);
                $selectedPath.set(str);
            }
        },
    };
    PageNavigationMediator.get().addPageNavigationHandler(navigationHandler);
    cleanups.push(() => PageNavigationMediator.get().removePageNavigationItem(navigationHandler));

    // Initial sync

    syncPageFromState();

    if (options?.hasDefaultPageTemplate != null) {
        $hasDefaultPageTemplate.set(options.hasDefaultPageTemplate);
    }

    if (options?.defaultPageTemplateName !== undefined) {
        $defaultPageTemplateName.set(options.defaultPageTemplateName ?? null);
    }

    if (options?.contentContext) {
        $contentContext.set(options.contentContext);
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
    $defaultPageTemplateName.set(null);
    $contentContext.set(null);
    $inspectedPath.set(null);
    $selectedPath.set(null);
}
