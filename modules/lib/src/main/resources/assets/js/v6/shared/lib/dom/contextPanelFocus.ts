import { getIsElementVisible } from './getIsElementVisible';

const FOCUS_TARGET_SELECTORS = {
    selector: '[data-component="WidgetsSelector"] input[role="combobox"]',
    toggle: '[data-context-panel-toggle]',
};

export function focusContextPanelTarget(target: keyof typeof FOCUS_TARGET_SELECTORS): boolean {
    const element = Array.from(document.querySelectorAll<HTMLElement>(FOCUS_TARGET_SELECTORS[target])).find(
        (element) =>
            getIsElementVisible(element) &&
            !element.closest('[inert], [aria-hidden="true"]') &&
            !element.matches(':disabled'),
    );

    element?.focus();
    return element != null && document.activeElement === element;
}
