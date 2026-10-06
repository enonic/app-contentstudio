type CalculateVisibleActionCountParams = {
    actionButtonWidths: number[];
    overflowButtonWidths: number[];
    containerWidth: number;
    gapPx?: number;
    epsilonPx?: number;
};

export const getOverflowActions = <T extends { id: string }>(
    actions: readonly T[],
    visibleActionCount: number,
    primaryOverflowActionId?: string,
): T[] => {
    const overflowActions = actions.slice(visibleActionCount);
    const primaryAction =
        visibleActionCount > 0 ? overflowActions.find(({ id }) => id === primaryOverflowActionId) : undefined;

    return primaryAction
        ? [primaryAction, ...overflowActions.filter((action) => action !== primaryAction)]
        : overflowActions;
};

export const calculateVisibleActionCount = ({
    actionButtonWidths,
    overflowButtonWidths,
    containerWidth,
    gapPx = 8,
    epsilonPx = 0.5,
}: CalculateVisibleActionCountParams): number => {
    for (let candidate = actionButtonWidths.length; candidate >= 0; candidate--) {
        const visibleButtonsWidth = actionButtonWidths.slice(0, candidate).reduce((sum, width) => sum + width, 0);
        const hasOverflowButton = candidate < actionButtonWidths.length;
        const overflowButtonWidth = hasOverflowButton ? (overflowButtonWidths[candidate] ?? 0) : 0;
        const renderedElementsCount = candidate + (hasOverflowButton ? 1 : 0);
        const requiredWidth =
            visibleButtonsWidth + overflowButtonWidth + Math.max(0, renderedElementsCount - 1) * gapPx;

        if (requiredWidth <= containerWidth + epsilonPx) {
            return candidate;
        }
    }

    return 0;
};
