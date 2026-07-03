import { computed, map } from 'nanostores';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';

export type ContextPanelMode = 'docked' | 'floating' | 'mobile';

type ContextLayoutMetrics = {
    // Width of the area the browse layout occupies.
    totalWidth: number;
    // Width the docked context panel occupies, or would occupy if it were open.
    contextWidth: number;
};

const $contextLayoutMetrics = map<ContextLayoutMetrics>({ totalWidth: 0, contextWidth: 0 });

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

// Legacy requiresCollapsedContextPanel.
export function shouldCollapseContextInitially(): boolean {
    const { totalWidth } = $contextLayoutMetrics.get();
    const belowInitialThreshold = LayoutTokens.contextPanel.initialCollapseThreshold.isFitOrSmaller(totalWidth);

    return belowInitialThreshold || $contextPanelMode.get() !== 'docked';
}
