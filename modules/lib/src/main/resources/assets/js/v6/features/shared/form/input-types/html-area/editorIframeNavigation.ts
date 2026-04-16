const DOCUMENT_FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    '[contenteditable="true"]',
    '[tabindex]',
].join(', ');

function getElementTabIndex(element: HTMLElement): number {
    if (typeof element.tabIndex === 'number') {
        return element.tabIndex;
    }

    const attr = element.getAttribute('tabindex');
    if (attr == null) {
        return 0;
    }

    const parsed = Number(attr);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function isDocumentTabStop(element: HTMLElement): boolean {
    if (element.getAttribute('aria-hidden') === 'true') {
        return false;
    }

    if (element.closest('[hidden], [aria-hidden="true"]') != null) {
        return false;
    }

    if ('disabled' in element && Boolean((element as HTMLButtonElement).disabled)) {
        return false;
    }

    return getElementTabIndex(element) >= 0;
}

export function dispatchSyntheticTabKey(target: HTMLElement, isBackward: boolean): boolean {
    const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: isBackward,
        bubbles: true,
        cancelable: true,
    });

    return !target.dispatchEvent(event);
}

export function focusAdjacentDocumentTabStop(anchor: HTMLElement, isBackward: boolean): boolean {
    const focusableElements = Array.from(
        anchor.ownerDocument.querySelectorAll<HTMLElement>(DOCUMENT_FOCUSABLE_SELECTOR),
    ).filter(isDocumentTabStop);

    const nextFocusable = isBackward
        ? [...focusableElements].reverse().find(candidate => (
            Boolean(anchor.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_PRECEDING)
        ))
        : focusableElements.find(candidate => (
            Boolean(anchor.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING)
        ));

    if (!nextFocusable) {
        return false;
    }

    nextFocusable.focus();
    return true;
}
