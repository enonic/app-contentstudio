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

    const computedStyle = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (computedStyle?.display === 'none' || computedStyle?.visibility === 'hidden') {
        return false;
    }

    return element.tabIndex >= 0;
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

    const directionBit = isBackward ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING;
    const isAdjacentToAnchor = (candidate: HTMLElement): boolean => {
        const rel = anchor.compareDocumentPosition(candidate);
        return Boolean(rel & directionBit) && !(rel & Node.DOCUMENT_POSITION_CONTAINED_BY);
    };

    const nextFocusable = isBackward
        ? [...focusableElements].reverse().find(isAdjacentToAnchor)
        : focusableElements.find(isAdjacentToAnchor);

    if (!nextFocusable) {
        return false;
    }

    nextFocusable.focus();
    return true;
}
