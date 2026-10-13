import type { Layout } from 'react-resizable-panels';

// Kept from the pre-flattened layout so saved layouts keep applying.
export const GRID_PANEL_ID = 'grid-region';

export type ResolveBrowsePanelLayoutOptions = {
    totalWidth: number;
    panelMinWidth: number;
};

export function resolveBrowsePanelLayout(
    previous: Layout,
    next: Layout,
    { totalWidth, panelMinWidth }: ResolveBrowsePanelLayoutOptions,
): Layout | undefined {
    const filterChanged = (previous.filter != null) !== (next.filter != null);
    const contextChanged = (previous.context != null) !== (next.context != null);
    if (filterChanged === contextChanged || totalWidth <= 0) return undefined;
    const previousGrid = previous[GRID_PANEL_ID];
    if (previousGrid == null || previous.preview == null || next[GRID_PANEL_ID] == null || next.preview == null) {
        return undefined;
    }
    if (previousGrid <= 0 || previous.preview <= 0) return undefined;

    const minPercent = (panelMinWidth / totalWidth) * 100;
    const withPanel = (layout: Layout, name: string, size: number | undefined): Layout =>
        size != null ? { ...layout, [name]: size } : layout;

    if (filterChanged) {
        const context = next.context;

        if (next.filter == null) {
            return withPanel(
                { [GRID_PANEL_ID]: previousGrid, preview: previous.preview + previous.filter },
                'context',
                context,
            );
        }

        const filter = next.filter;
        const preview = 100 - previousGrid - filter - (context ?? 0);
        if (preview < minPercent) return undefined;

        return withPanel({ filter, [GRID_PANEL_ID]: previousGrid, preview }, 'context', context);
    }

    const filter = next.filter;

    if (next.context == null) {
        return withPanel(
            { [GRID_PANEL_ID]: previousGrid + previous.context, preview: previous.preview },
            'filter',
            filter,
        );
    }

    const context = next.context;
    const grid = Math.max(minPercent, 100 - previous.preview - context - (filter ?? 0));
    const preview = 100 - grid - context - (filter ?? 0);
    if (preview < previous.preview && preview < minPercent) return undefined;

    return withPanel({ [GRID_PANEL_ID]: grid, preview, context }, 'filter', filter);
}
