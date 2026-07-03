import { describe, expect, it } from 'vitest';
import { $isPreviewPanelVisible } from '../../../widgets/preview-panel/model/previewPanel.store';
import { setContentFormExpanded } from './wizardContent.store';
import {
    $wizardContextPanelMode,
    $wizardViewMode,
    setWizardLayoutMetrics,
    setWizardViewMode,
} from './wizardLayout.store';

// Wizard thresholds: mobile <= 720 (total); floating when left panel is at or
// below 960 (form mode), 1380 (maximized editor), 720 (minimized editor).

describe('setWizardViewMode', () => {
    it('updates the mode and derives preview visibility', () => {
        setWizardViewMode('split');
        expect($wizardViewMode.get()).toBe('split');
        expect($isPreviewPanelVisible.get()).toBe(true);

        setWizardViewMode('form');
        expect($isPreviewPanelVisible.get()).toBe(false);

        setWizardViewMode('live');
        expect($isPreviewPanelVisible.get()).toBe(true);
    });
});

describe('$wizardContextPanelMode', () => {
    it('is docked before the layout is measured', () => {
        setWizardLayoutMetrics({ totalWidth: 0, contextWidth: 0 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('is mobile at or below the mobile threshold', () => {
        setWizardLayoutMetrics({ totalWidth: 700, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('mobile');
    });

    it('uses the no-editor threshold in form mode', () => {
        setWizardViewMode('form');
        setContentFormExpanded(true);

        setWizardLayoutMetrics({ totalWidth: 1300, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1400, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('uses the maximized threshold in split mode with an expanded form', () => {
        setWizardViewMode('split');
        setContentFormExpanded(true);

        setWizardLayoutMetrics({ totalWidth: 1700, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1800, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('docked');
    });

    it('uses the minimized threshold in split mode with a collapsed form', () => {
        setWizardViewMode('split');
        setContentFormExpanded(false);

        setWizardLayoutMetrics({ totalWidth: 1070, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('floating');

        setWizardLayoutMetrics({ totalWidth: 1100, contextWidth: 360 });
        expect($wizardContextPanelMode.get()).toBe('docked');

        setContentFormExpanded(true);
    });
});
