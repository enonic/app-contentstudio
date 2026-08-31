import { atom, computed, map } from 'nanostores';
import { LayoutTokens } from '../ui/layout.tokens';

export type ContextPanelMode = 'docked' | 'floating' | 'mobile';

type ContextLayoutMetrics = {
    // Width available to the browse layout, excluding the application sidebar.
    totalWidth: number;
    // Stable docked-panel minimum; live drag width must not change the mode.
    contextWidth: number;
    // Full viewport width used by the initial-collapse policy.
    windowWidth: number;
};

const $contextLayoutMetrics = map<ContextLayoutMetrics>({ totalWidth: 0, contextWidth: 0, windowWidth: 0 });

export const $isContextOpen = atom<boolean>(false);
export const $isMobilePreviewOpen = atom<boolean>(false);
export const $isContentFilterOpen = atom<boolean>(false);

let lastOpenedPanel: 'context' | 'filter' = 'context';

export const $contextPanelMode = computed($contextLayoutMetrics, ({ totalWidth, contextWidth }): ContextPanelMode => {
    if (totalWidth <= 0) {
        return 'docked';
    }
    if (LayoutTokens.contextPanel.mobileThreshold.isFitOrSmaller(totalWidth)) {
        return 'mobile';
    }

    const leftPanelExpectedWidth = totalWidth - contextWidth;
    const isFloating = LayoutTokens.contextPanel.floatingThreshold.browse.isFitOrSmaller(leftPanelExpectedWidth);

    return isFloating ? 'floating' : 'docked';
});

export const $isContextLayoutMeasured = computed($contextLayoutMetrics, ({ totalWidth }) => totalWidth > 0);

export function setContextLayoutMetrics(metrics: ContextLayoutMetrics): void {
    $contextLayoutMetrics.set(metrics);
    reconcileMobilePanels();
}

function isMobileMode(): boolean {
    return $contextPanelMode.get() === 'mobile';
}

function reconcileMobilePanels(): void {
    if (!isMobileMode() || !$isContextOpen.get() || !$isContentFilterOpen.get()) return;

    if (lastOpenedPanel === 'filter') {
        $isContextOpen.set(false);
    } else {
        $isContentFilterOpen.set(false);
    }
}

export function setContextOpen(open: boolean): void {
    if (open) {
        lastOpenedPanel = 'context';
        $isMobilePreviewOpen.set(false);

        if (isMobileMode()) {
            $isContentFilterOpen.set(false);
        }
    }
    $isContextOpen.set(open);
}

export function setMobilePreviewOpen(open: boolean): void {
    if (open) {
        $isContextOpen.set(false);
        $isContentFilterOpen.set(false);
    }

    $isMobilePreviewOpen.set(open);
}

export function setContentFilterOpen(open: boolean): void {
    if (open) {
        lastOpenedPanel = 'filter';

        if (isMobileMode()) {
            $isContextOpen.set(false);
            $isMobilePreviewOpen.set(false);
        }
    }

    $isContentFilterOpen.set(open);
}

export function shouldCollapseContextInitially(): boolean {
    const { windowWidth } = $contextLayoutMetrics.get();
    const belowInitialThreshold = LayoutTokens.contextPanel.initialCollapseThreshold.isFitOrSmaller(windowWidth);

    return belowInitialThreshold || $contextPanelMode.get() !== 'docked';
}
