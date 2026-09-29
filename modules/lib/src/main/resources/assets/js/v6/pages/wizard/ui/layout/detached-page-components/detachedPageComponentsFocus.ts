import { PREVIEW_TOOLBAR_VERSION_HISTORY_FOCUS_SELECTOR } from '../../../../../widgets/preview-panel/ui/previewToolbarFocus';

export const DETACHED_PAGE_COMPONENTS_VIEW_NAME = 'DetachedPageComponentsView';
export const DETACHED_PAGE_COMPONENTS_PANEL_ID = 'detached-page-components-panel';
export const DETACHED_PAGE_COMPONENTS_TRIGGER_ID = 'detached-page-components-trigger';
export const CONTENT_FORM_TOGGLE_NAME = 'ToggleFormButton';

const CONTENT_FOCUS_TARGET_SELECTOR = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

type ListFocusTarget = 'tab-stop' | 'first' | 'last';

function getOpenViewFocusTarget(target: ListFocusTarget): HTMLElement | null {
    const panel = document.getElementById(DETACHED_PAGE_COMPONENTS_PANEL_ID);
    const content = panel?.querySelector<HTMLElement>('[data-resize-region="content"]');
    const treeItems = Array.from(content?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? []).filter(
        (element) => element.closest('[inert]') == null,
    );
    const treeItem =
        target === 'first'
            ? treeItems[0]
            : target === 'last'
              ? treeItems[treeItems.length - 1]
              : (treeItems.find((element) => element.tabIndex === 0) ?? treeItems[0]);
    const contentFocusTarget = Array.from(
        content?.querySelectorAll<HTMLElement>(CONTENT_FOCUS_TARGET_SELECTOR) ?? [],
    ).find((element) => element.closest('[inert]') == null);

    return (
        treeItem ??
        contentFocusTarget ??
        panel?.querySelector<HTMLElement>('[data-detached-page-components-close]') ??
        null
    );
}

function focusElement(element: HTMLElement | null): boolean {
    if (element == null) {
        return false;
    }

    element.focus();
    return true;
}

function focusVisibleElement(selector: string): boolean {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return focusElement(elements.find((element) => element.getClientRects().length > 0) ?? null);
}

export function isDetachedPageComponentsPanelOpen(): boolean {
    return document.getElementById(DETACHED_PAGE_COMPONENTS_PANEL_ID) != null;
}

export function focusDetachedPageComponentsTrigger(): boolean {
    const trigger = document.getElementById(DETACHED_PAGE_COMPONENTS_TRIGGER_ID);
    return focusElement(trigger instanceof HTMLElement ? trigger : null);
}

export function focusDetachedPageComponentsList(target: ListFocusTarget = 'tab-stop'): boolean {
    return focusElement(getOpenViewFocusTarget(target));
}

export function focusContentFormToggle(): boolean {
    return focusVisibleElement(`[data-component="${CONTENT_FORM_TOGGLE_NAME}"]`);
}

export function focusPreviewToolbarVersionHistory(): boolean {
    return focusVisibleElement(PREVIEW_TOOLBAR_VERSION_HISTORY_FOCUS_SELECTOR);
}
