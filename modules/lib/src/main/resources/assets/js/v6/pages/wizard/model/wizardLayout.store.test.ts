import { describe, expect, it } from 'vitest';
import { setContentFormExpanded } from './wizardContent.store';
import {
    $wizardContextPanelMode,
    $wizardViewMode,
    setWizardLayoutMetrics,
    setWizardViewMode,
} from './wizardLayout.store';

// Wizard thresholds: mobile <= 720 (total); floating when the left panel (total
// minus the nominal docked context width, 38% in form mode and 16% with the
// editor, at least 360px) is at or below 960 (form mode), 1380 (maximized
// editor), 720 (minimized editor).

describe('setWizardViewMode', () => {
    it('updates the mode', () => {
        setWizardViewMode('split');
        expect($wizardViewMode.get()).toBe('split');

        setWizardViewMode('live');
        expect($wizardViewMode.get()).toBe('live');
    });
});

describe('$wizardContextPanelMode', () => {
    it('is docked before the layout is measured', () => {
        setWizardLayoutMetrics({ totalWidth: 0 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('is mobile at or below the mobile threshold', () => {
        setWizardLayoutMetrics({ totalWidth: 700 });
        expect($wizardContextPanelMode.get()).toBe('mobile');
    });

    it('uses the no-editor threshold in form mode', () => {
        setWizardViewMode('form');
        setContentFormExpanded(true);

        setWizardLayoutMetrics({ totalWidth: 1540 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1560 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('uses the maximized threshold in split mode with an expanded form', () => {
        setWizardViewMode('split');
        setContentFormExpanded(true);

        setWizardLayoutMetrics({ totalWidth: 1740 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1760 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('uses the minimized threshold in split mode with a collapsed form', () => {
        setWizardViewMode('split');
        setContentFormExpanded(false);

        setWizardLayoutMetrics({ totalWidth: 1070 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1100 });
        expect($wizardContextPanelMode.get()).toBe('docked');

        setContentFormExpanded(true);
    });

    it('derives the docked width from the current view mode without a new measurement', () => {
        setWizardViewMode('form');
        setContentFormExpanded(true);
        setWizardLayoutMetrics({ totalWidth: 2000 });
        expect($wizardContextPanelMode.get()).toBe('docked');

        // With the form-mode width (38%) the left panel would be 1240 and floating.
        setWizardViewMode('split');
        expect($wizardContextPanelMode.get()).toBe('docked');

        setWizardLayoutMetrics({ totalWidth: 1700 });
        expect($wizardContextPanelMode.get()).toBe('floating');
    });
});
