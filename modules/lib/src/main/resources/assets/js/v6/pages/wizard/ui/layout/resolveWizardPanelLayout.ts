import type { Layout } from 'react-resizable-panels';

export type ResolveWizardPanelLayoutOptions = {
    totalWidth: number;
    formMinWidth: number;
    liveMinWidth: number;
    contextMinWidth: number;
    liveDefaultPercent: number;
    contextDefaultPercent: number;
    liveShown: boolean;
    formCollapsed: boolean;
};

// Lays out a new panel set at its defaults: a context that docks or a live view
// that opens or closes comes out of the form, a live view that stays open keeps
// its width, and a docked context takes the default width of the new mode.
export function resolveWizardPanelLayout(
    previous: Layout,
    next: Layout,
    {
        totalWidth,
        formMinWidth,
        liveMinWidth,
        contextMinWidth,
        liveDefaultPercent,
        contextDefaultPercent,
        liveShown,
        formCollapsed,
    }: ResolveWizardPanelLayoutOptions,
): Layout | undefined {
    if (formCollapsed || totalWidth <= 0) return undefined;
    if (previous.form == null || previous.live == null || next.form == null || next.live == null) return undefined;

    const hadContext = previous.context != null;
    const hasContext = next.context != null;
    const hadLive = previous.live > 0;
    const hasLive = liveShown;
    if (hadContext === hasContext && hadLive === hasLive) return undefined;

    const toPercent = (px: number): number => (px / totalWidth) * 100;
    const context = hasContext ? Math.max(contextDefaultPercent, toPercent(contextMinWidth)) : 0;
    const liveTarget = hasLive ? (hadLive ? previous.live : liveDefaultPercent) : 0;
    const form = Math.max(toPercent(formMinWidth), 100 - liveTarget - context);
    const live = 100 - form - context;
    if (hasLive && live < toPercent(liveMinWidth)) return undefined;

    const layout: Layout = { form, live };
    if (hasContext) layout.context = context;
    return layout;
}
