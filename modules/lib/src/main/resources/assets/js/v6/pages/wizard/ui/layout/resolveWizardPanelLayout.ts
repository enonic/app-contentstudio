import type { Layout } from 'react-resizable-panels';

export type ResolveWizardPanelLayoutOptions = {
    totalWidth: number;
    formMinWidth: number;
    liveMinWidth: number;
    formCollapsed: boolean;
};

export function resolveWizardPanelLayout(
    previous: Layout,
    next: Layout,
    { totalWidth, formMinWidth, liveMinWidth, formCollapsed }: ResolveWizardPanelLayoutOptions,
): Layout | undefined {
    const hadContext = previous.context != null;
    const hasContext = next.context != null;
    if (hadContext === hasContext || formCollapsed || totalWidth <= 0) return undefined;
    if (previous.form == null || previous.live == null || next.form == null || next.live == null) return undefined;
    if (previous.live <= 0) return undefined;

    const toPercent = (px: number): number => (px / totalWidth) * 100;
    const live = previous.live;

    if (!hasContext) {
        return { form: previous.form + previous.context, live };
    }

    const context = next.context;
    const form = Math.max(toPercent(formMinWidth), 100 - live - context);
    const squeezedLive = 100 - form - context;
    if (squeezedLive < live && squeezedLive < toPercent(liveMinWidth)) return undefined;

    return { form, live: squeezedLive, context };
}
