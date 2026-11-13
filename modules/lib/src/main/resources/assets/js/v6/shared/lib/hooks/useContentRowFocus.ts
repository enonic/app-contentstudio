import { type RefObject, useEffect, useState } from 'react';

type ContentRowFocus = {
    focusTarget?: Element;
    sorting: boolean;
};

export const useContentRowFocus = (anchorRef: RefObject<HTMLElement>): ContentRowFocus => {
    const [state, setState] = useState<ContentRowFocus>({ sorting: false });

    useEffect(() => {
        const anchor = anchorRef.current;
        if (!anchor) {
            return;
        }
        const root = anchor.getRootNode() as Document | ShadowRoot;
        const sortable = anchor.closest('[aria-roledescription="sortable"]');
        const owner =
            anchor.closest('[role="treeitem"], [role="row"], [role="option"], [aria-roledescription="sortable"]') ??
            anchor.closest(
                '[data-component="ContentListItem"], [data-component="SortContentListItem"], [data-component="SelectorSelectionItem"], button',
            ) ??
            anchor.closest(
                '[data-component="ContentLabel"], [data-component="MediaSelectorItemView"], [data-component="VersionsListItem"]',
            );
        if (!owner) {
            return;
        }

        const getFocused = (): Element | null => {
            let focused = root.activeElement;
            while (focused?.shadowRoot?.activeElement) {
                focused = focused.shadowRoot.activeElement;
            }
            return focused;
        };
        const update = (focused: Element | null): void => {
            const activeId = focused?.getAttribute('aria-activedescendant');
            const activeRow = activeId ? root.getElementById(activeId) : null;
            const sorting = sortable?.getAttribute('aria-pressed') === 'true';
            const active = activeRow?.contains(anchor) ? activeRow : owner.contains(focused) ? focused : undefined;
            const focusTarget = sorting ? undefined : (active ?? undefined);
            setState((previous) =>
                previous.focusTarget === focusTarget && previous.sorting === sorting
                    ? previous
                    : { focusTarget, sorting },
            );
        };
        // Virtualized trees keep DOM focus on the container and move aria-activedescendant.
        const observer = new MutationObserver(() => update(getFocused()));
        const observeFocus = (focused: Element | null): void => {
            observer.disconnect();
            if (focused) {
                observer.observe(focused, {
                    attributes: true,
                    attributeFilter: ['aria-activedescendant', 'aria-pressed'],
                });
            }
            if (sortable && sortable !== focused) {
                observer.observe(sortable, { attributes: true, attributeFilter: ['aria-pressed'] });
            }
            update(focused);
        };
        const handleFocus = (): void => observeFocus(getFocused());
        const handleBlur = (event: FocusEvent): void => observeFocus(event.relatedTarget as Element | null);
        const handleWindowBlur = (): void => observeFocus(null);

        root.addEventListener('focusin', handleFocus, true);
        root.addEventListener('focusout', handleBlur, true);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleFocus);
        observeFocus(getFocused());
        return () => {
            observer.disconnect();
            root.removeEventListener('focusin', handleFocus, true);
            root.removeEventListener('focusout', handleBlur, true);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [anchorRef]);

    return state;
};
