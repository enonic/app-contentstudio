import { describe, expect, it } from 'vitest';
import { resolveWizardPanelLayout } from './resolveWizardPanelLayout';

const options = { totalWidth: 2000, formMinWidth: 360, liveMinWidth: 360, formCollapsed: false };

describe('resolveWizardPanelLayout', () => {
    it('should take the context width from the form and keep the live width when the context docks', () => {
        const layout = resolveWizardPanelLayout({ form: 50, live: 50 }, { form: 38, live: 36, context: 26 }, options);

        expect(layout).toEqual({ form: 24, live: 50, context: 26 });
    });

    it('should clamp the form to its minimum width and squeeze the live view for the rest', () => {
        const layout = resolveWizardPanelLayout({ form: 20, live: 80 }, { form: 38, live: 36, context: 26 }, options);

        expect(layout).toEqual({ form: 18, live: 56, context: 26 });
    });

    it('should leave the layout to the library when the live view was collapsed', () => {
        const layout = resolveWizardPanelLayout({ form: 100, live: 0 }, { form: 60, live: 0, context: 40 }, options);

        expect(layout).toBeUndefined();
    });

    it('should give the context width back to the form when the context undocks', () => {
        const layout = resolveWizardPanelLayout({ form: 24, live: 50, context: 26 }, { form: 50, live: 50 }, options);

        expect(layout).toEqual({ form: 50, live: 50 });
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
