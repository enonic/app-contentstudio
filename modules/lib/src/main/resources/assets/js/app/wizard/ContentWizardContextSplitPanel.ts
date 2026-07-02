import { type Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { type ResponsiveRange } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRange';
import { LayoutTokens } from '../../v6/shared/ui/layout.tokens';
import { ContextSplitPanel, ContextSplitPanelBuilder } from '../view/context/ContextSplitPanel';
import { type LiveFormPanel } from './page/LiveFormPanel';
import { type DockedContextPanel } from '../view/context/DockedContextPanel';

export class ContentWizardContextSplitPanel extends ContextSplitPanel {
    private readonly liveFormPanel: LiveFormPanel;

    private readonly wizardFormPanel: Panel;

    constructor(splitPanelBuilder: ContentWizardContextSplitPanelBuilder) {
        super(splitPanelBuilder);

        this.addClass('content-wizard-context-split-panel');

        this.liveFormPanel = splitPanelBuilder.liveFormPanel;
        this.wizardFormPanel = splitPanelBuilder.wizardFormPanel;
    }

    protected getLeftPanelResponsiveRangeToSwitchToFloatingMode(): ResponsiveRange {
        if (!this.liveFormPanel || !this.isPageEditorShown()) {
            return LayoutTokens.contextPanel.floatingThreshold.wizardNoEditor;
        }

        if (this.isWizardPanelMaximized()) {
            return LayoutTokens.contextPanel.floatingThreshold.wizardMaximized;
        }

        return LayoutTokens.contextPanel.floatingThreshold.wizardNormal;
    }

    private isPageEditorShown(): boolean {
        return this.liveFormPanel?.isShown();
    }

    private isWizardPanelMaximized(): boolean {
        return this.wizardFormPanel && !this.wizardFormPanel.hasClass('minimized');
    }

    getActiveWidthPxOfSecondPanel(): number {
        if (this.isPageEditorShown() && this.isWizardPanelMaximized() && this.isFloatingMode()) {
            return (
                (this.getEl().getWidthWithBorder() / 100) *
                LayoutTokens.contextPanel.floatingWidthPercent.wizardWithEditor
            );
        }

        return super.getActiveWidthPxOfSecondPanel();
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContentWizardContextSplitPanelBuilder {
        return new ContentWizardContextSplitPanelBuilder(firstPanel, secondPanel);
    }
}

export class ContentWizardContextSplitPanelBuilder extends ContextSplitPanelBuilder {
    liveFormPanel: LiveFormPanel;

    wizardFormPanel: Panel;

    constructor(firstPanel: Panel, secondPanel: DockedContextPanel) {
        super(firstPanel, secondPanel);
    }

    setLiveFormPanel(value: LiveFormPanel): this {
        this.liveFormPanel = value;
        return this;
    }

    setWizardFormPanel(value: Panel): this {
        this.wizardFormPanel = value;
        return this;
    }

    build(): ContentWizardContextSplitPanel {
        return new ContentWizardContextSplitPanel(this);
    }
}
