import type { Layout } from 'react-resizable-panels';

export type WizardPanelUndock = {
    docked: Layout;
    undocked: Layout;
};

export type ResolveWizardPanelLayoutOptions = {
    totalWidth: number;
    formMinWidth: number;
    liveMinWidth: number;
    formCollapsed: boolean;
    lastUndock?: WizardPanelUndock;
};

const LAYOUT_EPSILON = 0.1;

const isSameLayout = (a: Layout, b: Layout): boolean => {
    const keys = Object.keys(a);
    return (
        keys.length === Object.keys(b).length &&
        keys.every((key) => b[key] != null && Math.abs(a[key] - b[key]) < LAYOUT_EPSILON)
    );
};

export function resolveWizardPanelLayout(
    previous: Layout,
    next: Layout,
    { totalWidth, formMinWidth, liveMinWidth, formCollapsed, lastUndock }: ResolveWizardPanelLayoutOptions,
): Layout | undefined {
    const hadContext = previous.context != null;
    const hasContext = next.context != null;
    if (hadContext === hasContext || formCollapsed || totalWidth <= 0) return undefined;
    if (previous.form == null || previous.live == null || next.form == null || next.live == null) return undefined;
    if (previous.live <= 0) return undefined;

    const toPercent = (px: number): number => (px / totalWidth) * 100;
    const live = previous.live;

    if (!hasContext) {
        return { form: previous.form, live: live + previous.context };
    }

    const context = next.context;
    if (lastUndock != null && isSameLayout(previous, lastUndock.undocked)) {
        const restoredForm = lastUndock.docked.form;
        const restoredLive = 100 - restoredForm - context;
        if (restoredForm != null && restoredLive >= toPercent(liveMinWidth)) {
            return { form: restoredForm, live: restoredLive, context };
        }
    }

    const form = Math.max(toPercent(formMinWidth), 100 - live - context);
    const squeezedLive = 100 - form - context;
    if (squeezedLive < live && squeezedLive < toPercent(liveMinWidth)) return undefined;

    return { form, live: squeezedLive, context };
}
