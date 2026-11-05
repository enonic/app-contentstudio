import type { ComponentPath } from '../../../../../app/page/region/ComponentPath';
import type { ComponentTextUpdatedOrigin } from '../../../../../app/page/region/ComponentTextUpdatedOrigin';
import { ComponentType } from '../../../../../app/page/region/ComponentType';
import { getIsMobile } from '@enonic/ui';
import type { DescriptorKey } from '../../../../../app/page/DescriptorKey';
import type { PageTemplateKey } from '../../../../../app/page/PageTemplateKey';
import { PageStateEvent } from '../../../../../page-editor/event/incoming/common/PageStateEvent';
import { PageEventsManager } from '../../../../../app/wizard/PageEventsManager';
import { PageState } from '../../../../../app/wizard/page/PageState';
import { PageNavigationEvent } from '../../../../../app/wizard/PageNavigationEvent';
import { PageNavigationEventData } from '../../../../../app/wizard/PageNavigationEventData';
import { PageNavigationEventType } from '../../../../../app/wizard/PageNavigationEventType';
import { PageNavigationMediator } from '../../../../../app/wizard/PageNavigationMediator';
import { $config } from '../../../../shared/config/config.store';
import { setDraftPage } from '../../../../pages/wizard/model/wizardContent.store';
import { getComponentInsertionPath } from './componentInsertion';
import type { PortalComponentType } from './drag';
import {
    $hasDefaultPageTemplate,
    $inspectedPath,
    $isPageModifyAllowed,
    $isInsertTabAvailable,
    $page,
    $pageEditorLifecycle,
    bumpSelectionEventNonce,
} from './store';

//
// * Actions — store state
//

export function setHasDefaultPageTemplate(value: boolean): void {
    $hasDefaultPageTemplate.set(value);
}

export function setPageModifyAllowed(value: boolean): void {
    $isPageModifyAllowed.set(value);
}

// ? Used by LiveFormPanel to sync renderable state that
// ? may have been set before the bridge was initialized.
export function syncInitialRenderable(isRenderable: boolean): void {
    if ($pageEditorLifecycle.get().isPageRenderable === undefined) {
        $pageEditorLifecycle.setKey('isPageRenderable', isRenderable);
    }
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

// ? $wizardDraftPage must be cleared before notifyPageReset fires —
// ? the save listener synchronously reads it via buildViewedContentFromStore,
// ? and the listener that syncs the draft from PageState runs too late.
export function executePageReset(): void {
    PageState.setState(null);
    setDraftPage(null);
    new PageStateEvent(null).fire();
    PageState.getEvents().notifyPageReset();
}

export function requestSetComponentDescriptor(path: ComponentPath, descriptorKey: DescriptorKey): void {
    PageEventsManager.get().notifyComponentDescriptorSetRequested(path, descriptorKey);
}

export function requestUpdateTextComponent(
    path: ComponentPath,
    text: string,
    origin?: ComponentTextUpdatedOrigin,
): void {
    PageEventsManager.get().notifyTextComponentUpdateRequested(path, text, origin);
}

export function requestSetFragmentComponent(path: ComponentPath, id: string, name?: string): void {
    PageEventsManager.get().notifySetFragmentComponentRequested(path, id, name);
}

export function requestComponentAdd(path: ComponentPath, type: ComponentType): void {
    PageEventsManager.get().notifyComponentAddRequested(path, type);
}

export function requestComponentInsert(type: PortalComponentType): ComponentPath | null {
    const page = $page.get();
    if (!$isInsertTabAvailable.get() || !page) {
        return null;
    }
    if ((type === 'text' && !$config.get().enableTextComponent) || (type === 'layout' && page.isFragment())) {
        return null;
    }

    const path = getComponentInsertionPath(page, $inspectedPath.get(), type);
    const componentType = ComponentType.byShortName(type);
    if (!path || !componentType) {
        return null;
    }

    requestComponentAdd(path, componentType);
    PageNavigationMediator.get().notify(
        new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)),
    );
    if (getIsMobile()) {
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(path)),
        );
    }
    return path;
}

export function requestComponentRemove(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentRemoveRequested(path);
}

export function requestComponentReset(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentResetRequested(path);
}

export function requestReloadComponent(path: ComponentPath, existing: boolean = true): void {
    PageEventsManager.get().notifyComponentReloadRequested(path, existing);
}

export function requestComponentDuplicate(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentDuplicateRequested(path);
}

export function requestComponentCreateFragment(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentCreateFragmentRequested(path);
}

export function requestComponentDetachFragment(path: ComponentPath): void {
    PageEventsManager.get().notifyComponentDetachFragmentRequested(path);
}

export function requestComponentMove(from: ComponentPath, to: ComponentPath): void {
    PageEventsManager.get().notifyComponentMoveRequested(from, to);
}

//
// * Actions — inspect
//

export function inspectItem(path: ComponentPath | null): void {
    $inspectedPath.set(path ? path.toString() : null);
    bumpSelectionEventNonce();
}

export function clearInspection(): void {
    $inspectedPath.set(null);
    bumpSelectionEventNonce();
}
