import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {ResponsiveRange} from 'lib-admin-ui/ui/responsive/ResponsiveRange';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {ContextSplitPanel, ContextSplitPanelBuilder} from '../view/context/ContextSplitPanel';
import {PageEditorData} from './page/LiveFormPanel';
import {ContextView} from '../view/context/ContextView';
import {DockedContextPanel} from '../view/context/DockedContextPanel';
import {SplitPanelSize} from 'lib-admin-ui/ui/panel/SplitPanelSize';

export class ContentWizardContextSplitPanel
    extends ContextSplitPanel {

    private readonly data: PageEditorData;

    private readonly wizardFormPanel: Panel;

    constructor(splitPanelBuilder: ContentWizardContextSplitPanelBuilder) {
        super(splitPanelBuilder);

        this.addClass('content-wizard-context-split-panel');

        this.data = splitPanelBuilder.data;
        this.wizardFormPanel = splitPanelBuilder.wizardFormPanel;
    }

    protected getLeftPanelResponsiveRangeToSwitchToFloatingMode(): ResponsiveRange {
        if (!this.data || !this.data.liveFormPanel || this.isPageEditorShown()) {
            return ResponsiveRanges._720_960;
        }

        if (this.isWizardPanelMaximized()) {
            return ResponsiveRanges._1200_1380;
        }

        return ResponsiveRanges._540_720;
    }

    private isPageEditorShown(): boolean {
        return this.data?.liveFormPanel && this.data.liveFormPanel.isShown();
    }

    private isWizardPanelMaximized(): boolean {
        return this.wizardFormPanel && !this.wizardFormPanel.hasClass('minimized');
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContentWizardContextSplitPanelBuilder {
        return new ContentWizardContextSplitPanelBuilder(firstPanel, secondPanel);
    }
}

export class ContentWizardContextSplitPanelBuilder
    extends ContextSplitPanelBuilder {

    data: PageEditorData;

    wizardFormPanel: Panel;

    constructor(firstPanel: Panel, secondPanel: DockedContextPanel) {
        super(firstPanel, secondPanel);
    }

    setContextView(value: ContextView): ContentWizardContextSplitPanelBuilder {
        this.contextView = value;
        return this;
    }

    setData(value: PageEditorData): ContentWizardContextSplitPanelBuilder {
        this.data = value;
        return this;
    }

    setWizardFormPanel(value: Panel): ContentWizardContextSplitPanelBuilder {
        this.wizardFormPanel = value;
        return this;
    }

    setFirstPanelMinSize(size: SplitPanelSize): ContentWizardContextSplitPanelBuilder {
        return <ContentWizardContextSplitPanelBuilder>super.setFirstPanelMinSize(size);
    }

    setSecondPanelSize(size: SplitPanelSize): ContentWizardContextSplitPanelBuilder {
        return <ContentWizardContextSplitPanelBuilder>super.setSecondPanelSize(size);
    }

    build(): ContentWizardContextSplitPanel {
        return new ContentWizardContextSplitPanel(this);
    }
}
