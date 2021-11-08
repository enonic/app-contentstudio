import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {Action} from 'lib-admin-ui/ui/Action';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from 'lib-admin-ui/ui/panel/SplitPanel';
import {SplitPanelSize} from 'lib-admin-ui/ui/panel/SplitPanelSize';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {DockedContextPanel} from './DockedContextPanel';
import {NonMobileContextPanelsManager} from './NonMobileContextPanelsManager';
import {ContextView} from './ContextView';
import {FloatingContextPanel} from './FloatingContextPanel';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {PageEditorData} from '../../wizard/page/LiveFormPanel';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContextSplitPanel
    extends SplitPanel {

    private data: PageEditorData;
    private mobileMode: boolean;
    private contextView: ContextView;
    private dockedContextPanel: DockedContextPanel;
    private floatingContextPanel: FloatingContextPanel;
    private actions: Action[];
    private contextPanelsManager: NonMobileContextPanelsManager;
    private dockedModeChangedListeners: { (isDocked: boolean): void }[];
    private leftPanel: Panel;
    private wizardFormPanel?: Panel;
    private foldButton: Button;

    constructor(splitPanelBuilder: ContextSplitPanelBuilder) {
        super(splitPanelBuilder);

        this.addClass('context-split-panel');
        this.setSecondPanelSize(SplitPanelSize.Percents(38));

        this.data = splitPanelBuilder.data;
        this.wizardFormPanel = splitPanelBuilder.wizardFormPanel;
        this.leftPanel = splitPanelBuilder.getFirstPanel();
        this.contextView = splitPanelBuilder.contextView;
        this.dockedContextPanel = splitPanelBuilder.getSecondPanel();
        this.actions = splitPanelBuilder.actions;
        this.dockedModeChangedListeners = [];

        this.dockedContextPanel.onAdded(this.renderAfterDockedPanelReady.bind(this));
        this.initPanels();

        this.foldButton = new Button(i18n('action.fold'));
        this.foldButton.addClass('hide-mobile-preview-button');
        this.insertChild(this.foldButton, 0);
    }

    private initPanels() {
        const nonMobileContextPanelsManagerBuilder = NonMobileContextPanelsManager.create();
        if (this.isPageEditorPresent()) {
            nonMobileContextPanelsManagerBuilder.setPageEditor(this.data.liveFormPanel);
            nonMobileContextPanelsManagerBuilder.setWizardPanel(this.wizardFormPanel);
            nonMobileContextPanelsManagerBuilder.setIsMobileMode(() => {
                return this.isMobileMode();
            });
        }
        nonMobileContextPanelsManagerBuilder.setSplitPanelWithContext(this);
        nonMobileContextPanelsManagerBuilder.setDefaultContextPanel(this.dockedContextPanel);
        this.floatingContextPanel = new FloatingContextPanel(this.contextView);
        nonMobileContextPanelsManagerBuilder.setFloatingContextPanel(this.floatingContextPanel);

        this.contextPanelsManager = nonMobileContextPanelsManagerBuilder.build();
    }

    private isInsideWizard(): boolean {
        return this.data != null;
    }

    private isPageEditorPresent(): boolean {
        return this.isInsideWizard() && this.data.liveFormPanel != null;
    }

    private renderAfterDockedPanelReady() {
        this.floatingContextPanel.insertAfterEl(this);

        if (this.contextPanelsManager.requiresCollapsedContextPanel()) {
            this.contextPanelsManager.hideDockedContextPanel();
        }

        this.subscribeContextPanelsOnEvents(this.contextPanelsManager);
    }

    private subscribeContextPanelsOnEvents(nonMobileContextPanelsManager: NonMobileContextPanelsManager) {
        const debouncedResponsiveHandler = (item: ResponsiveItem) => {
            nonMobileContextPanelsManager.handleResizeEvent();
            this.toggleMobileMode(item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        };
        ResponsiveManager.onAvailableSizeChanged(this.getParentElement(), debouncedResponsiveHandler);
        this.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChanged(this.getParentElement());
        });
    }

    private toggleMobileMode(value: boolean) {
        if (value !== this.mobileMode) {
            this.mobileMode = value;
            this.toggleClass('mobile-mode', value);
            this.notifyMobileModeChanged(value);
        }
    }

    onMobileModeChanged(listener: (isMobile: boolean) => void) {
        this.dockedModeChangedListeners.push(listener);
    }

    unMobileModeChanged(listener: (isMobile: boolean) => void) {
        this.dockedModeChangedListeners = this.dockedModeChangedListeners.filter(curr => curr !== listener);
    }

    private notifyMobileModeChanged(isMobile: boolean) {
        this.dockedModeChangedListeners.forEach(curr => curr(isMobile));
    }

    setContent(content: ContentSummaryAndCompareStatus) {
        this.contextView.setItem(content);
    }

    updateRenderableStatus(renderable: boolean) {
        this.contextView.updateRenderableStatus(renderable);
    }

    isMobileMode(): boolean {
        return this.mobileMode;
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContextSplitPanelBuilder {
        return new ContextSplitPanelBuilder(firstPanel, secondPanel);
    }

    onFoldClicked(action: () => void) {
        this.foldButton.onClicked(action);
    }
}

export class ContextSplitPanelBuilder
    extends SplitPanelBuilder {

    contextView: ContextView;

    actions: Action[];

    data: PageEditorData;

    wizardFormPanel: Panel;

    constructor(firstPanel: Panel, secondPanel: DockedContextPanel) {
        super(firstPanel, secondPanel);

        this.setAlignment(SplitPanelAlignment.VERTICAL);
        this.setSecondPanelMinSize(SplitPanelSize.Pixels(280));
        this.setAnimationDelay(600);
        this.setSecondPanelShouldSlideRight(true);
    }

    setContextView(value: ContextView): ContextSplitPanelBuilder {
        this.contextView = value;
        return this;
    }

    setActions(value: Action[]): ContextSplitPanelBuilder {
        this.actions = value;
        return this;
    }

    setData(value: PageEditorData): ContextSplitPanelBuilder {
        this.data = value;
        return this;
    }

    setWizardFormPanel(value: Panel): ContextSplitPanelBuilder {
        this.wizardFormPanel = value;
        return this;
    }

    getSecondPanel(): DockedContextPanel {
        return <DockedContextPanel>super.getSecondPanel();
    }

    build(): ContextSplitPanel {
        return new ContextSplitPanel(this);
    }
}
