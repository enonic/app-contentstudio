import {useEffect, useRef} from 'react';

/**
 * Focuses the combobox tree container once per component lifecycle.
 */
export function useVirtualizedTreeListAutoFocus(baseId: string): void {
    const hasFocusedRef = useRef(false);

    useEffect(() => {
        if (hasFocusedRef.current) {
            return;
        }

        hasFocusedRef.current = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const tree = document.getElementById(`${baseId}-tree`);
                const treeContainer = tree?.querySelector<HTMLElement>('[role="tree"]');
                treeContainer?.focus();
            });
        });
    }, [baseId]);
}
