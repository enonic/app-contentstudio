import { getIsMobile } from '@enonic/ui';
import { PageEventsManager } from '../../../../../app/wizard/PageEventsManager';
import type { LiveEditPageViewReadyEvent } from '../../../../../page-editor/event/LiveEditPageViewReadyEvent';
import type { PageNavigationEvent } from '../../../../../app/wizard/PageNavigationEvent';
import { PageNavigationEventType } from '../../../../../app/wizard/PageNavigationEventType';
import type { PageNavigationHandler } from '../../../../../app/wizard/PageNavigationHandler';
import { PageNavigationMediator } from '../../../../../app/wizard/PageNavigationMediator';
import { PageState } from '../../../../../app/wizard/page/PageState';
import { setPageComponentsViewCollapsed } from '../../../../shared/app-state/app.store';
import { $isContentFormExpanded, setContextOpen } from '../../../../shared/app-state/browsePanels.store';
import {
    $contentContext,
    $defaultPageTemplateName,
    $hasDefaultPageTemplate,
    $inspectedPath,
    $isPageLocked,
    $isPageModifyAllowed,
    $page,
    $pageEditorLifecycle,
    $pageVersion,
    $selectionEventNonce,
    bumpPageVersion,
    bumpSelectionEventNonce,
    syncPageFromState,
} from './store';
import type { InitPageEditorBridgeOptions } from './types';

//
// * Bridge
//

type Unsubscribe = () => void;

const cleanups: Unsubscribe[] = [];

export function initPageEditorBridge(options?: InitPageEditorBridgeOptions): void {
    // ? Only drop old subscriptions here — resetting lifecycle state would
    // ? blank isPageReady/isPageRenderable on a silent content save
    // ? (saveChangesWithoutValidation), leaving the Insert tab disabled.
    unsubscribePageEditorBridge();

    const mgr = PageEventsManager.get();
    const events = PageState.getEvents();

    // Lifecycle events from PageEventsManager

    // ? Page editor < 2.1 reports no `inlineEditing`; it only adds its own
    // ? lock when the frame has no live-edit markup. A lock echoed back while
    // ? the host itself did not lock is read as that fact. Under a host lock
    // ? the echo tells nothing, so the frame is reloaded once it is unlocked
    // ? by permissions to find out.
    let editorLocked = false;
    let inferredUnderLock = false;

    const onLocked = () => {
        editorLocked = true;
    };
    mgr.onPageLocked(onLocked);
    cleanups.push(() => mgr.unPageLocked(onLocked));

    const onUnlocked = () => {
        editorLocked = false;
    };
    mgr.onPageUnlocked(onUnlocked);
    cleanups.push(() => mgr.unPageUnlocked(onUnlocked));

    const onRenderable = (val: boolean) => $pageEditorLifecycle.setKey('isPageRenderable', val);
    mgr.onRenderableChanged(onRenderable);
    cleanups.push(() => mgr.unRenderableChanged(onRenderable));

    const onReady = (event: LiveEditPageViewReadyEvent) => {
        const reported = event.getInlineEditing();
        const hostLocked = $isPageLocked.get();
        inferredUnderLock = reported == null && editorLocked && hostLocked;
        const inlineEditing = reported ?? !(editorLocked && !hostLocked);
        $pageEditorLifecycle.set({ ...$pageEditorLifecycle.get(), inlineEditing, isPageReady: true });
    };
    mgr.onLiveEditPageViewReady(onReady);
    cleanups.push(() => mgr.unLiveEditPageViewReady(onReady));

    // Every frame load starts a new echo; `onLoaded` covers the toolbar
    // Refresh and in-frame reloads, which bypass `onBeforeLoad`.
    const resetEditorState = () => {
        editorLocked = false;
        inferredUnderLock = false;
    };

    const onBeforeLoad = () => {
        resetEditorState();
        $pageEditorLifecycle.set({ ...$pageEditorLifecycle.get(), inlineEditing: true, isPageReady: false });
    };
    mgr.onBeforeLoad(onBeforeLoad);
    cleanups.push(() => mgr.unBeforeLoad(onBeforeLoad));

    mgr.onLoaded(resetEditorState);
    cleanups.push(() => mgr.unLoaded(resetEditorState));

    cleanups.push(
        $isPageModifyAllowed.listen((allowed) => {
            if (!allowed || !inferredUnderLock) return;
            inferredUnderLock = false;
            mgr.notifyPageReloadRequested();
        }),
    );

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

    // Navigation events from PageNavigationMediator — iframe selections,
    // legacy PageComponentsView, and ComponentInspectedEvent all feed in here.
    const mediator = PageNavigationMediator.get();
    const navigationHandler: PageNavigationHandler = {
        handle(event: PageNavigationEvent): void {
            const type = event.getType();
            const isMobile = getIsMobile();

            if (type === PageNavigationEventType.INSPECT || type === PageNavigationEventType.SELECT) {
                const path = event.getData().getPath();
                $inspectedPath.set(path?.toString() ?? null);
                bumpSelectionEventNonce();
                if (type === PageNavigationEventType.INSPECT || !isMobile) {
                    if (type === PageNavigationEventType.INSPECT && isMobile && !$isContentFormExpanded.get()) {
                        setPageComponentsViewCollapsed(true);
                    }
                    setContextOpen(true);
                }
                return;
            }
            if (type === PageNavigationEventType.DESELECT) {
                $inspectedPath.set(null);
                bumpSelectionEventNonce();
            }
        },
    };
    mediator.addPageNavigationHandler(navigationHandler);
    cleanups.push(() => mediator.removePageNavigationItem(navigationHandler));

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

function unsubscribePageEditorBridge(): void {
    for (const fn of cleanups) {
        fn();
    }
    cleanups.length = 0;
}

export function cleanupPageEditorBridge(): void {
    unsubscribePageEditorBridge();

    $pageEditorLifecycle.set({
        inlineEditing: true,
        isPageRenderable: undefined,
        isPageReady: false,
    });
    $page.set(null);
    $pageVersion.set(0);
    $isPageModifyAllowed.set(true);
    $hasDefaultPageTemplate.set(false);
    $defaultPageTemplateName.set(null);
    $contentContext.set(null);
    $inspectedPath.set(null);
    $selectionEventNonce.set(0);
}
