type CalculateVisibleActionCountParams = {
    actionButtonWidths: number[];
    overflowButtonWidths: number[];
    containerWidth: number;
    gapPx?: number;
    epsilonPx?: number;
};

type OverflowLayout<T> = {
    rowItems: T[];
    overflowItems: T[];
};

export const getOverflowLayout = <T extends { primaryRank?: number }>(
    items: readonly T[],
    visibleCount: number,
): OverflowLayout<T> => {
    const rowItems = items.slice(0, visibleCount);
    const rest = items.slice(visibleCount);
    const primary = rest.reduce<T | undefined>(
        (best, item) => (best == null || (item.primaryRank ?? 0) > (best.primaryRank ?? 0) ? item : best),
        undefined,
    );
    const overflowItems = primary ? [primary, ...rest.filter((item) => item !== primary)] : [];

    return { rowItems, overflowItems };
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
