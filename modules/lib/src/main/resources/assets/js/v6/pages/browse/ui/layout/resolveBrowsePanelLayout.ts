import type { Layout } from 'react-resizable-panels';

export const GRID_PANEL_ID = 'grid-region';

export type ResolveBrowsePanelLayoutOptions = {
    totalWidth: number;
    panelMinWidth: number;
    filterDefaultWidth: number;
    contextDefaultWidth: number;
};

type PanelToggle = {
    panel: string;
    donor: string;
    keep: string;
    defaultWidth: number;
};

// A panel that opens comes out of one neighbour only, the filter out of the
// preview and the context out of the grid, so the panel between them keeps its
// width. It opens at its last width, or at its default when that does not fit.
// A panel that closes gives its width back to the same neighbour.
export function resolveBrowsePanelLayout(
    previous: Layout,
    next: Layout,
    { totalWidth, panelMinWidth, filterDefaultWidth, contextDefaultWidth }: ResolveBrowsePanelLayoutOptions,
): Layout | undefined {
    const filterChanged = (previous.filter != null) !== (next.filter != null);
    const contextChanged = (previous.context != null) !== (next.context != null);
    if (filterChanged === contextChanged || totalWidth <= 0) return undefined;
    const previousGrid = previous[GRID_PANEL_ID];
    if (previousGrid == null || previous.preview == null || next[GRID_PANEL_ID] == null || next.preview == null) {
        return undefined;
    }
    if (previousGrid <= 0 || previous.preview <= 0) return undefined;

    const toPercent = (px: number): number => (px / totalWidth) * 100;
    const toggle: PanelToggle = filterChanged
        ? { panel: 'filter', donor: 'preview', keep: GRID_PANEL_ID, defaultWidth: filterDefaultWidth }
        : { panel: 'context', donor: GRID_PANEL_ID, keep: 'preview', defaultWidth: contextDefaultWidth };
    const { panel, donor, keep } = toggle;

    const opened = next[panel];
    if (opened == null) {
        const { [panel]: closed, ...rest } = previous;
        return { ...rest, [donor]: previous[donor] + closed };
    }

    const minSize = toPercent(panelMinWidth);
    const others = 100 - previous[donor] - previous[keep];
    for (const size of [opened, toPercent(toggle.defaultWidth)]) {
        const donorSize = Math.max(minSize, 100 - others - previous[keep] - size);
        const keepSize = 100 - others - donorSize - size;
        if (keepSize < previous[keep] && keepSize < minSize) continue;
        return { ...previous, [panel]: size, [donor]: donorSize, [keep]: keepSize };
    }

    return undefined;
}
