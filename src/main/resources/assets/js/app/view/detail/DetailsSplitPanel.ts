import SplitPanelBuilder = api.ui.panel.SplitPanelBuilder;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;
import ViewItem = api.app.view.ViewItem;
import IsRenderableRequest = api.content.page.IsRenderableRequest;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import {DockedDetailsPanel} from './DockedDetailsPanel';
import {NonMobileDetailsPanelsManager, NonMobileDetailsPanelsManagerBuilder} from './NonMobileDetailsPanelsManager';
import {DetailsView} from './DetailsView';
import {FloatingDetailsPanel} from './FloatingDetailsPanel';
import {ActiveDetailsPanelManager} from './ActiveDetailsPanelManager';
import {MobileContentItemStatisticsPanel} from '../MobileContentItemStatisticsPanel';

export class DetailsSplitPanel
    extends api.ui.panel.SplitPanel {

    private mobilePanelSlideListeners: { (out: boolean): void }[];
    private detailsView: DetailsView;
    private dockedDetailsPanel: DockedDetailsPanel;
    private floatingDetailsPanel: FloatingDetailsPanel;
    private mobileContentItemStatisticsPanel: MobileContentItemStatisticsPanel;
    private actions: api.ui.Action[];
    private nonMobileDetailsManager: NonMobileDetailsPanelsManager;
    private dockedModeChangedListeners: { (isDocked: boolean): void }[];
    private leftPanel: api.ui.panel.Panel;

    constructor(leftPanel: api.ui.panel.Panel, actions: api.ui.Action[]) {
        const detailsView = new DetailsView();
        const dockedDetails = new DockedDetailsPanel(detailsView);

        const builder = new SplitPanelBuilder(leftPanel, dockedDetails)
            .setAlignment(api.ui.panel.SplitPanelAlignment.VERTICAL)
            .setSecondPanelSize(280, api.ui.panel.SplitPanelUnit.PIXEL)
            .setSecondPanelMinSize(280, api.ui.panel.SplitPanelUnit.PIXEL)
            .setAnimationDelay(600)
            .setSecondPanelShouldSlideRight(true);

        dockedDetails.onRendered(() => {
            console.log(`${new Date().toISOString()} DockedDetailsPanel.onRendered`);
        });

        leftPanel.onRendered(() => {
            console.log(`${new Date().toISOString()} ContentWizardPanel.onRendered`);
        });

        super(builder);
        this.addClass('details-split-panel');
        this.setSecondPanelSize(280, api.ui.panel.SplitPanelUnit.PIXEL);

        this.onRendered(() => {
            console.log(`${new Date().toISOString()} DetailsSplitPanel.onRendered`);
        });

        this.leftPanel = leftPanel;
        this.detailsView = detailsView;
        this.dockedDetailsPanel = dockedDetails;
        this.actions = actions;
        this.dockedModeChangedListeners = [];
        this.mobilePanelSlideListeners = [];
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            console.log(`${new Date().toISOString()} DetailsSplitPanel.doRender`);
            const nonMobileDetailsManagerBuilder = NonMobileDetailsPanelsManager.create();
            this.initSplitPanelWithDockedDetails(nonMobileDetailsManagerBuilder);
            this.initFloatingDetailsPanel(nonMobileDetailsManagerBuilder);
            this.initMobileItemStatisticsPanel();

            this.nonMobileDetailsManager = nonMobileDetailsManagerBuilder.build();
            if (this.nonMobileDetailsManager.requiresCollapsedDetailsPanel()) {
                this.nonMobileDetailsManager.hideDockedDetailsPanel();
            }

            this.nonMobileDetailsManager.ensureButtonHasCorrectState();
            this.detailsView.appendChild(this.nonMobileDetailsManager.getToggleButton());

            this.setActiveDetailsPanel(this.nonMobileDetailsManager);

            this.onShown(() => {
                if (!!this.nonMobileDetailsManager.getActivePanel().getActiveWidget()) {
                    this.nonMobileDetailsManager.getActivePanel().getActiveWidget().slideIn();
                }
            });

            this.subscribeDetailsPanelsOnEvents(this.nonMobileDetailsManager);

            return rendered;
        });
    }

    private initSplitPanelWithDockedDetails(nonMobileDetailsPanelsManagerBuilder: NonMobileDetailsPanelsManagerBuilder) {

        nonMobileDetailsPanelsManagerBuilder.setSplitPanelWithGridAndDetails(this);
        nonMobileDetailsPanelsManagerBuilder.setDefaultDetailsPanel(this.dockedDetailsPanel);
    }

    private initFloatingDetailsPanel(nonMobileDetailsPanelsManagerBuilder: NonMobileDetailsPanelsManagerBuilder) {
        this.floatingDetailsPanel = new FloatingDetailsPanel(this.detailsView);
        nonMobileDetailsPanelsManagerBuilder.setFloatingDetailsPanel(this.floatingDetailsPanel);
        this.floatingDetailsPanel.insertAfterEl(this);
    }

    private initMobileItemStatisticsPanel() {
        this.mobileContentItemStatisticsPanel = new MobileContentItemStatisticsPanel(this.actions, this.detailsView);
        this.mobileContentItemStatisticsPanel.insertAfterEl(this);
        this.mobileContentItemStatisticsPanel.slideAllOut(true);

        this.mobileContentItemStatisticsPanel.onSlideOut(() => this.notifyMobilePanelSlide(true));
        this.mobileContentItemStatisticsPanel.onSlideIn(() => this.notifyMobilePanelSlide(false));
    }

    private setActiveDetailsPanel(nonMobileDetailsPanelsManager: NonMobileDetailsPanelsManager) {
        if (this.mobileContentItemStatisticsPanel.isVisible()) {
            ActiveDetailsPanelManager.setActiveDetailsPanel(this.mobileContentItemStatisticsPanel.getDetailsPanel());
        } else {
            ActiveDetailsPanelManager.setActiveDetailsPanel(nonMobileDetailsPanelsManager.getActivePanel());
        }
    }

    private subscribeDetailsPanelsOnEvents(nonMobileDetailsPanelsManager: NonMobileDetailsPanelsManager) {

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            nonMobileDetailsPanelsManager.handleResizeEvent();

            if (ResponsiveRanges._720_960.isFitOrBigger(item.getOldRangeValue())) {
                if (item.isInRangeOrSmaller(ResponsiveRanges._540_720)) {
                    // transition through 720 from bigger side
                    this.notifyMobileModeChanged(true);
                    ActiveDetailsPanelManager.setActiveDetailsPanel(this.mobileContentItemStatisticsPanel.getDetailsPanel());
                    nonMobileDetailsPanelsManager.hideActivePanel(true);
                }
            } else if (item.isInRangeOrBigger(ResponsiveRanges._720_960)) {
                // transition through 720 from smaller side
                this.notifyMobileModeChanged(false);
                nonMobileDetailsPanelsManager.setActivePanel();
                this.mobileContentItemStatisticsPanel.slideAllOut(true);
            }
        });
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

    onMobilePanelSlide(listener: (out: boolean) => void) {
        this.mobilePanelSlideListeners.push(listener);
    }

    unMobilePanelSlide(listener: (out: boolean) => void) {
        this.mobilePanelSlideListeners = this.mobilePanelSlideListeners.filter(curr => curr !== listener);
    }

    private notifyMobilePanelSlide(out: boolean) {
        this.mobilePanelSlideListeners.forEach(curr => curr(out));
    }

    setMobilePreviewItem(previewItem: ViewItem<ContentSummaryAndCompareStatus>, force?: boolean) {
        this.mobileContentItemStatisticsPanel.getPreviewPanel().setItem(previewItem, force);
    }

    setContent(content: api.content.ContentSummaryAndCompareStatus) {
        if (!this.isMobileMode()) {
            this.detailsView.setItem(content);
        } else {
            const previewPanel = this.mobileContentItemStatisticsPanel.getPreviewPanel();
            const prevItem = previewPanel.getItem();
            const changed = !prevItem || !prevItem.getModel() || prevItem.getModel().getId() !== content.getId();

            if (changed) {
                previewPanel.setBlank();
                previewPanel.showMask();

                const item = ViewItem.fromContentSummaryAndCompareStatus(content);
                this.mobileContentItemStatisticsPanel.setItem(item);

                setTimeout(() => {
                    new IsRenderableRequest(content.getContentId()).sendAndParse().then((renderable: boolean) => {
                        item.setRenderable(renderable);
                        this.setMobilePreviewItem(item);
                    });
                }, 300);
            }
        }
    }

    showMobilePanel() {
        this.mobileContentItemStatisticsPanel.slideIn();
    }

    isMobileMode(): boolean {
        return this.mobileContentItemStatisticsPanel.isVisible();
    }
}
