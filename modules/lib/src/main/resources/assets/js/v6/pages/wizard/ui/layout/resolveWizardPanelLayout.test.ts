import { describe, expect, it } from 'vitest';
import { resolveWizardPanelLayout } from './resolveWizardPanelLayout';

const options = {
    totalWidth: 2000,
    formMinWidth: 360,
    liveMinWidth: 360,
    contextMinWidth: 360,
    liveDefaultPercent: 62,
    contextDefaultPercent: 16,
    liveShown: true,
    formCollapsed: false,
};
const liveHidden = { ...options, liveShown: false };

describe('resolveWizardPanelLayout', () => {
    describe('context', () => {
        it('should dock the context at its default width out of the form and keep the live width', () => {
            const layout = resolveWizardPanelLayout(
                { form: 50, live: 50 },
                { form: 38, live: 36, context: 26 },
                options,
            );

            expect(layout).toEqual({ form: 32, live: 50, context: 18 });
        });

        it('should clamp the form to its minimum width and squeeze the live view for the rest', () => {
            const layout = resolveWizardPanelLayout(
                { form: 20, live: 80 },
                { form: 38, live: 36, context: 26 },
                options,
            );

            expect(layout).toEqual({ form: 18, live: 64, context: 18 });
        });

        it('should dock the context at the mode default out of the form when the live view is hidden', () => {
            const layout = resolveWizardPanelLayout(
                { form: 100, live: 0 },
                { form: 38, live: 0, context: 62 },
                { ...liveHidden, contextDefaultPercent: 38 },
            );

            expect(layout).toEqual({ form: 62, live: 0, context: 38 });
        });

        it('should give the context width back to the form and keep the live width when the context undocks', () => {
            const layout = resolveWizardPanelLayout(
                { form: 24, live: 50, context: 26 },
                { form: 50, live: 50 },
                options,
            );

            expect(layout).toEqual({ form: 50, live: 50 });
        });

        it('should give the whole width to the form when the context undocks and the live view is hidden', () => {
            const layout = resolveWizardPanelLayout(
                { form: 62, live: 0, context: 38 },
                { form: 62, live: 38 },
                liveHidden,
            );

            expect(layout).toEqual({ form: 100, live: 0 });
        });
    });

    describe('live view', () => {
        it('should open the live view at its default width out of the form', () => {
            const layout = resolveWizardPanelLayout({ form: 100, live: 0 }, { form: 76, live: 24 }, options);

            expect(layout).toEqual({ form: 38, live: 62 });
        });

        it('should open the live view at its default width and reset the docked context to the mode default', () => {
            const layout = resolveWizardPanelLayout(
                { form: 62, live: 0, context: 38 },
                { form: 38, live: 24, context: 38 },
                options,
            );

            expect(layout).toEqual({ form: 20, live: 62, context: 18 });
        });

        it('should give the live width to the form when the live view closes', () => {
            const layout = resolveWizardPanelLayout({ form: 30, live: 70 }, { form: 30, live: 0 }, liveHidden);

            expect(layout).toEqual({ form: 100, live: 0 });
        });

        it('should widen the docked context to the mode default when the live view closes', () => {
            const layout = resolveWizardPanelLayout(
                { form: 20, live: 62, context: 18 },
                { form: 20, live: 0, context: 80 },
                { ...liveHidden, contextDefaultPercent: 38 },
            );

            expect(layout).toEqual({ form: 62, live: 0, context: 38 });
        });
    });

    it('should leave the layout to the library when the form is collapsed', () => {
        const layout = resolveWizardPanelLayout(
            { form: 3, live: 97 },
            { form: 3, live: 71, context: 26 },
            { ...options, formCollapsed: true },
        );

        expect(layout).toBeUndefined();
    });

    it('should leave the layout to the library when the live view cannot fit', () => {
        const layout = resolveWizardPanelLayout(
            { form: 20, live: 80 },
            { form: 38, live: 36, context: 26 },
            { ...options, totalWidth: 800 },
        );

        expect(layout).toBeUndefined();
    });

    it('should ignore layout changes that keep the same panels', () => {
        const layout = resolveWizardPanelLayout({ form: 40, live: 60 }, { form: 30, live: 70 }, options);

        expect(layout).toBeUndefined();
    });
});
