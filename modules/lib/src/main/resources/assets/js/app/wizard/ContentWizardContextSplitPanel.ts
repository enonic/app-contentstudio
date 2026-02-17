import {type Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {type ResponsiveRange} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRange';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {ContextSplitPanel, ContextSplitPanelBuilder} from '../view/context/ContextSplitPanel';
import {type LiveFormPanel} from './page/LiveFormPanel';
import {type DockedContextPanel} from '../view/context/DockedContextPanel';

export class ContentWizardContextSplitPanel
    extends ContextSplitPanel {

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
            return ResponsiveRanges._720_960;
        }

        if (this.isWizardPanelMaximized()) {
            return ResponsiveRanges._1200_1380;
        }

        return ResponsiveRanges._540_720;
    }

    private isPageEditorShown(): boolean {
        return this.liveFormPanel?.isShown();
    }

    private isWizardPanelMaximized(): boolean {
        return this.wizardFormPanel && !this.wizardFormPanel.hasClass('minimized');
    }

    getActiveWidthPxOfSecondPanel(): number {
        if (this.isPageEditorShown() && this.isWizardPanelMaximized() && this.isFloatingMode()) {
            return this.getEl().getWidthWithBorder() / 100 * 24;
        }

        return super.getActiveWidthPxOfSecondPanel();
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContentWizardContextSplitPanelBuilder {
        return new ContentWizardContextSplitPanelBuilder(firstPanel, secondPanel);
    }
}

export class ContentWizardContextSplitPanelBuilder
    extends ContextSplitPanelBuilder {

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
