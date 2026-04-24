import type {ComponentPath} from '../../../../app/page/region/ComponentPath';
import type {ComponentTextUpdatedOrigin} from '../../../../app/page/region/ComponentTextUpdatedOrigin';
import type {ComponentType} from '../../../../app/page/region/ComponentType';
import type {DescriptorKey} from '../../../../app/page/DescriptorKey';
import type {PageTemplateKey} from '../../../../app/page/PageTemplateKey';
import {PageStateEvent} from '../../../../page-editor/event/incoming/common/PageStateEvent';
import {PageEventsManager} from '../../../../app/wizard/PageEventsManager';
import {PageState} from '../../../../app/wizard/page/PageState';
import {$hasDefaultPageTemplate, $inspectedPath, $pageEditorLifecycle} from './store';

//
// * Actions — store state
//

export function setHasDefaultPageTemplate(value: boolean): void {
    $hasDefaultPageTemplate.set(value);
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

// ? Performs the page reset directly, bypassing the legacy
// ? confirmation dialog in PageState.onPageResetRequested.
export function executePageReset(): void {
    PageState.setState(null);
    new PageStateEvent(null).fire();
    PageState.getEvents().notifyPageReset();
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

export function requestComponentMove(from: ComponentPath, to: ComponentPath): void {
    PageEventsManager.get().notifyComponentMoveRequested(from, to);
}

//
// * Actions — inspect
//

export function inspectItem(path: ComponentPath | null): void {
    $inspectedPath.set(path ? path.toString() : null);
}

export function clearInspection(): void {
    $inspectedPath.set(null);
}
