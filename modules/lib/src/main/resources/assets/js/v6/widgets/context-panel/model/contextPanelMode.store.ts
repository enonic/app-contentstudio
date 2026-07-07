import { computed, map } from 'nanostores';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';

export type ContextPanelMode = 'docked' | 'floating' | 'mobile';

type ContextLayoutMetrics = {
    // Width of the area the browse layout occupies (excludes the app sidebar).
    totalWidth: number;
    // Width the docked context panel occupies, or would occupy if it were open.
    contextWidth: number;
    // Full window width; the initial-collapse threshold is measured against it.
    windowWidth: number;
};

const $contextLayoutMetrics = map<ContextLayoutMetrics>({ totalWidth: 0, contextWidth: 0, windowWidth: 0 });

export function setContextLayoutMetrics(metrics: ContextLayoutMetrics): void {
    $contextLayoutMetrics.set(metrics);
}

// Replicates the legacy ContextSplitPanel mode decision.
export const $contextPanelMode = computed($contextLayoutMetrics, ({ totalWidth, contextWidth }): ContextPanelMode => {
    if (totalWidth <= 0) return 'docked';

    if (LayoutTokens.contextPanel.mobileThreshold.isFitOrSmaller(totalWidth)) return 'mobile';

    const leftPanelExpectedWidth = totalWidth - contextWidth;
    const isFloating = LayoutTokens.contextPanel.floatingThreshold.browse.isFitOrSmaller(leftPanelExpectedWidth);

    return isFloating ? 'floating' : 'docked';
});

export const $isContextLayoutMeasured = computed($contextLayoutMetrics, ({ totalWidth }) => totalWidth > 0);

// Legacy requiresCollapsedContextPanel: the threshold is measured against the full
// window width (legacy used Body width), not the sidebar-reduced layout area, so the
// 1920 boundary is not tripped by the ~60px sidebar.
export function shouldCollapseContextInitially(): boolean {
    const { windowWidth } = $contextLayoutMetrics.get();
    const belowInitialThreshold = LayoutTokens.contextPanel.initialCollapseThreshold.isFitOrSmaller(windowWidth);

    return belowInitialThreshold || $contextPanelMode.get() !== 'docked';
}
