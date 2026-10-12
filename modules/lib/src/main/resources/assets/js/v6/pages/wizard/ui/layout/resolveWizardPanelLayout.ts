import type { Layout } from 'react-resizable-panels';

export type ResolveWizardPanelLayoutOptions = {
    totalWidth: number;
    formMinWidth: number;
    liveMinWidth: number;
    contextDefaultPercent: number;
    formCollapsed: boolean;
};

// A docking context comes out of the form at its last width, or at its default
// when that does not fit; the live view keeps its width. An undocking context
// gives its width back to the form.
export function resolveWizardPanelLayout(
    previous: Layout,
    next: Layout,
    { totalWidth, formMinWidth, liveMinWidth, contextDefaultPercent, formCollapsed }: ResolveWizardPanelLayoutOptions,
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

    for (const context of [next.context, contextDefaultPercent]) {
        const form = Math.max(toPercent(formMinWidth), 100 - live - context);
        const squeezedLive = 100 - form - context;
        if (squeezedLive < live && squeezedLive < toPercent(liveMinWidth)) continue;
        return { form, live: squeezedLive, context };
    }

    return undefined;
}
