import { type RefObject, useEffect, useState } from 'react';

type ContentRowFocus = {
    focusTarget?: Element;
    disabled: boolean;
};

export const useContentRowFocus = (anchorRef: RefObject<HTMLElement>): ContentRowFocus => {
    const [state, setState] = useState<ContentRowFocus>({ disabled: false });

    useEffect(() => {
        const anchor = anchorRef.current;
        if (!anchor) {
            return;
        }
        const root = anchor.getRootNode() as Document | ShadowRoot;
        let scrollFrame: number | undefined;
        let currentFocusTarget: Element | undefined;
        let hasHoverInteraction = false;
        let observedFocus: Element | null = null;
        let observedSortable: Element | null = null;
        const getSortable = (): Element | null => anchor.closest('[aria-roledescription="sortable"]');
        const isSorting = (sortable: Element | null = getSortable()): boolean =>
            sortable?.getAttribute('aria-pressed') === 'true';

        const getFocused = (): Element | null => {
            if (!anchor.ownerDocument.hasFocus()) return null;
            let focused = root.activeElement;
            while (focused?.shadowRoot?.activeElement) {
                focused = focused.shadowRoot.activeElement;
            }
            return focused;
        };
        // The browser retains input history even when a virtualized row has just mounted.
        let isKeyboardFocus = getFocused()?.matches(':focus-visible') ?? false;
        const observer = new MutationObserver(() => update(getFocused()));
        const update = (focused: Element | null): void => {
            const sortable = getSortable();
            const owner =
                anchor.closest('[role="treeitem"], [role="row"], [role="option"], [aria-roledescription="sortable"]') ??
                anchor.closest(
                    '[data-component="ContentListItem"], [data-component="SortContentListItem"], [data-component="SelectorSelectionItem"], button',
                ) ??
                anchor.closest(
                    '[data-component="ContentLabel"], [data-component="MediaSelectorItemView"], [data-component="VersionsListItem"]',
                );
            // A selection row can become sortable without remounting the icon or moving focus.
            if (focused !== observedFocus || sortable !== observedSortable) {
                observer.disconnect();
                if (focused) {
                    // Virtualized trees move aria-activedescendant while DOM focus stays on the container.
                    observer.observe(focused, {
                        attributes: true,
                        attributeFilter: ['aria-activedescendant', 'aria-pressed'],
                    });
                }
                if (sortable && sortable !== focused) {
                    observer.observe(sortable, { attributes: true, attributeFilter: ['aria-pressed'] });
                }
                observedFocus = focused;
                observedSortable = sortable;
            }
            const activeId = focused?.getAttribute('aria-activedescendant');
            const activeRow = activeId ? root.getElementById(activeId) : null;
            const sorting = isSorting(sortable);
            const disabled = sorting || scrollFrame !== undefined;
            let active: Element | undefined;
            if (activeRow?.contains(anchor)) {
                active = activeRow;
            } else if (
                owner &&
                (focused === owner || (focused && owner.contains(focused) && focused.contains(anchor)))
            ) {
                active = owner;
            }
            const focusTarget = disabled || !isKeyboardFocus ? undefined : active;
            currentFocusTarget = focusTarget;
            if (sorting) hasHoverInteraction = false;
            setState((previous) =>
                previous.focusTarget === focusTarget && previous.disabled === disabled
                    ? previous
                    : { focusTarget, disabled },
            );
        };
        const handleFocus = (): void => update(getFocused());
        const handleBlur = (event: FocusEvent): void => update(event.relatedTarget as Element | null);
        const handleWindowBlur = (): void => update(null);
        // The pointer can leave the anchor for the tooltip. Retain hover eligibility until
        // scrolling or sorting is known to close this instance.
        const handleMouseEnter = (): void => {
            hasHoverInteraction = true;
        };
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.isComposing || ['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) return;
            if (event.key === 'Escape' && isSorting()) return;
            isKeyboardFocus = event.key !== 'Escape';
            update(getFocused());
        };
        const handlePointer = (): void => {
            isKeyboardFocus = false;
            update(getFocused());
        };
        const handleScroll = (event: Event): void => {
            if (!currentFocusTarget && !hasHoverInteraction && scrollFrame === undefined) return;
            let ancestor: Node | null = anchor;
            while (ancestor && ancestor !== event.target) {
                ancestor = ancestor.parentNode ?? (ancestor instanceof ShadowRoot ? ancestor.host : null);
            }
            if (!ancestor) return;

            // Close both hover and focus tooltips. Keyboard reveal scrolling restarts the focus delay.
            hasHoverInteraction = false;
            if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame);
            scrollFrame = window.requestAnimationFrame(() => {
                scrollFrame = undefined;
                update(getFocused());
            });
            update(getFocused());
        };

        anchor.addEventListener('mouseenter', handleMouseEnter);
        root.addEventListener('focusin', handleFocus, true);
        root.addEventListener('focusout', handleBlur, true);
        anchor.ownerDocument.addEventListener('keydown', handleKeyDown, true);
        anchor.ownerDocument.addEventListener('pointerdown', handlePointer, true);
        anchor.ownerDocument.addEventListener('wheel', handlePointer, { capture: true, passive: true });
        if (root instanceof ShadowRoot) root.addEventListener('scroll', handleScroll, true);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('scroll', handleScroll, true);
        update(getFocused());
        return () => {
            observer.disconnect();
            if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame);
            anchor.removeEventListener('mouseenter', handleMouseEnter);
            root.removeEventListener('focusin', handleFocus, true);
            root.removeEventListener('focusout', handleBlur, true);
            anchor.ownerDocument.removeEventListener('keydown', handleKeyDown, true);
            anchor.ownerDocument.removeEventListener('pointerdown', handlePointer, true);
            anchor.ownerDocument.removeEventListener('wheel', handlePointer, true);
            if (root instanceof ShadowRoot) root.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [anchorRef]);

    return state;
};
