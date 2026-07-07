import { atom, computed, map } from 'nanostores';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';
import { type ContextPanelMode } from '../../../widgets/context-panel/model/contextPanelMode.store';
import { $isContentFormExpanded } from './wizardContent.store';

// 'live' occurs only in the mobile range; desktop uses 'form' and 'split'.
export type WizardViewMode = 'form' | 'split' | 'live';

export const $wizardViewMode = atom<WizardViewMode>('form');

export function setWizardViewMode(mode: WizardViewMode): void {
    $wizardViewMode.set(mode);
}

type WizardLayoutMetrics = {
    totalWidth: number;
    contextWidth: number;
};

const $wizardLayoutMetrics = map<WizardLayoutMetrics>({ totalWidth: 0, contextWidth: 0 });

export function setWizardLayoutMetrics(metrics: WizardLayoutMetrics): void {
    $wizardLayoutMetrics.set(metrics);
}

export const $isWizardLayoutMeasured = computed($wizardLayoutMetrics, ({ totalWidth }) => totalWidth > 0);

export function shouldCollapseWizardContextInitially(): boolean {
    const { totalWidth } = $wizardLayoutMetrics.get();
    const belowInitialThreshold = LayoutTokens.contextPanel.initialCollapseThreshold.isFitOrSmaller(totalWidth);

    return belowInitialThreshold || $wizardContextPanelMode.get() !== 'docked';
}

// Replicates ContentWizardContextSplitPanel: the floating threshold depends on
// whether the editor is shown and whether the form is maximized.
export const $wizardContextPanelMode = computed(
    [$wizardLayoutMetrics, $wizardViewMode, $isContentFormExpanded],
    ({ totalWidth, contextWidth }, viewMode, formExpanded): ContextPanelMode => {
        if (totalWidth <= 0) return 'docked';

        if (LayoutTokens.contextPanel.mobileThreshold.isFitOrSmaller(totalWidth)) return 'mobile';

        const { wizardNoEditor, wizardMaximized, wizardNormal } = LayoutTokens.contextPanel.floatingThreshold;
        const range = viewMode === 'form' ? wizardNoEditor : formExpanded ? wizardMaximized : wizardNormal;

        return range.isFitOrSmaller(totalWidth - contextWidth) ? 'floating' : 'docked';
    },
);
