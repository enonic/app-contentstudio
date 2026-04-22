export const getIsElementVisible = (element: HTMLElement | null): boolean => {
    if (!element) {
        return false;
    }

    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return styles.display !== 'none'
        && styles.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
        && element.getClientRects().length > 0;
};
