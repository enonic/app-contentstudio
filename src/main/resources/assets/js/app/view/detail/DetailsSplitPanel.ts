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
import {MobileDetailsPanel} from './MobileDetailsSlidablePanel';
import {DetailsPanel} from './DetailsPanel';

export interface DetailsPanelOptions {
    noPreview?: boolean;
}

export class DetailsSplitPanel
    extends api.ui.panel.SplitPanel {

    private options: DetailsPanelOptions;
    private mobileMode: boolean;
    private mobilePanelSlideListeners: { (out: boolean): void }[];
    private detailsView: DetailsView;
    private dockedDetailsPanel: DockedDetailsPanel;
    private floatingDetailsPanel: FloatingDetailsPanel;
    private mobileContentItemStatisticsPanel: MobileContentItemStatisticsPanel;
    private actions: api.ui.Action[];
    private nonMobileDetailsManager: NonMobileDetailsPanelsManager;
    private dockedModeChangedListeners: { (isDocked: boolean): void }[];
    private leftPanel: api.ui.panel.Panel;
    private mobileDetailsPanel: MobileDetailsPanel;

    constructor(leftPanel: api.ui.panel.Panel, actions: api.ui.Action[], options?: DetailsPanelOptions) {
        const detailsView = new DetailsView();
        const dockedDetails = new DockedDetailsPanel(detailsView);

        const builder = new SplitPanelBuilder(leftPanel, dockedDetails)
            .setAlignment(api.ui.panel.SplitPanelAlignment.VERTICAL)
            .setSecondPanelSize(280, api.ui.panel.SplitPanelUnit.PIXEL)
            .setSecondPanelMinSize(280, api.ui.panel.SplitPanelUnit.PIXEL)
            .setAnimationDelay(600)
            .setSecondPanelShouldSlideRight(true);

        super(builder);
        this.addClass('details-split-panel');
        this.setSecondPanelSize(280, api.ui.panel.SplitPanelUnit.PIXEL);

        this.options = options || {};
        this.leftPanel = leftPanel;
        this.detailsView = detailsView;
        this.dockedDetailsPanel = dockedDetails;
        this.actions = actions;
        this.dockedModeChangedListeners = [];
        this.mobilePanelSlideListeners = [];

        this.dockedDetailsPanel.onAdded(this.renderAfterDockedPanelReady.bind(this));
    }

    private renderAfterDockedPanelReady() {
        const nonMobileDetailsManagerBuilder = NonMobileDetailsPanelsManager.create();
        this.initSplitPanelWithDockedDetails(nonMobileDetailsManagerBuilder);
        this.initFloatingDetailsPanel(nonMobileDetailsManagerBuilder);
        if (this.options.noPreview) {
            this.initMobileDetailsPanelOnly();
        } else {
            this.initMobileItemStatisticsPanel();
        }

        this.nonMobileDetailsManager = nonMobileDetailsManagerBuilder.build();
        if (this.nonMobileDetailsManager.requiresCollapsedDetailsPanel()) {
            this.nonMobileDetailsManager.hideDockedDetailsPanel();
        }

        this.nonMobileDetailsManager.ensureButtonHasCorrectState();
        this.detailsView.appendChild(this.nonMobileDetailsManager.getToggleButton());

        this.onShown(() => {
            if (!!this.nonMobileDetailsManager.getActivePanel().getActiveWidget()) {
                this.nonMobileDetailsManager.getActivePanel().getActiveWidget().slideIn();
            }
        });

        this.subscribeDetailsPanelsOnEvents(this.nonMobileDetailsManager);
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

    private initMobileDetailsPanelOnly() {
        this.mobileDetailsPanel = new MobileDetailsPanel(this.detailsView);
        this.mobileDetailsPanel.insertAfterEl(this);
        this.mobileDetailsPanel.slideOut(true);

        this.mobileDetailsPanel.onSlidedOut(() => this.notifyMobilePanelSlide(true));
        this.mobileDetailsPanel.onSlidedIn(() => this.notifyMobilePanelSlide(false));
    }

    private initMobileItemStatisticsPanel() {
        this.mobileContentItemStatisticsPanel = new MobileContentItemStatisticsPanel(this.actions, this.detailsView);
        this.mobileContentItemStatisticsPanel.insertAfterEl(this);
        this.mobileContentItemStatisticsPanel.slideAllOut(true);

        this.mobileContentItemStatisticsPanel.onSlideOut(() => this.notifyMobilePanelSlide(true));
        this.mobileContentItemStatisticsPanel.onSlideIn(() => this.notifyMobilePanelSlide(false));
    }

    private setActiveDetailsPanel(nonMobileDetailsPanelsManager: NonMobileDetailsPanelsManager) {
        if (this.isMobileMode()) {
            ActiveDetailsPanelManager.setActiveDetailsPanel(this.getMobileDetailsPanel());
        } else {
            ActiveDetailsPanelManager.setActiveDetailsPanel(nonMobileDetailsPanelsManager.getActivePanel());
        }
    }

    private getMobileDetailsPanel(): DetailsPanel {
        return this.options.noPreview ? this.mobileDetailsPanel : this.mobileContentItemStatisticsPanel.getDetailsPanel();
    }

    private getMobilePanelItem(): ContentSummaryAndCompareStatus {
        if (this.options.noPreview) {
            return this.mobileDetailsPanel.getItem();
        } else {
            const item = this.mobileContentItemStatisticsPanel.getItem();
            return item && item.getModel() || null;
        }
    }

    private slideMobilePanelOut(silent?: boolean) {
        if (this.options.noPreview) {
            this.mobileDetailsPanel.slideOut(silent);
        } else {
            this.mobileContentItemStatisticsPanel.slideAllOut(silent);
        }
    }

    private subscribeDetailsPanelsOnEvents(nonMobileDetailsPanelsManager: NonMobileDetailsPanelsManager) {

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            nonMobileDetailsPanelsManager.handleResizeEvent();
            if (this.mobileMode === undefined) {
                this.mobileMode = item.isInRangeOrSmaller(ResponsiveRanges._540_720);
            }

            if (item.isInRangeOrSmaller(ResponsiveRanges._540_720)) {
                nonMobileDetailsPanelsManager.hideActivePanel(true);
                ActiveDetailsPanelManager.setActiveDetailsPanel(this.getMobileDetailsPanel());
                if (ResponsiveRanges._720_960.isFitOrBigger(item.getOldRangeValue())) {
                    // transition through 720 from bigger side
                    this.mobileMode = true;
                    this.notifyMobileModeChanged(true);
                }
            } else {
                this.slideMobilePanelOut(true);
                nonMobileDetailsPanelsManager.setActivePanel();
                if (item.isInRangeOrBigger(ResponsiveRanges._720_960)) {
                    // transition through 720 from smaller side
                    this.mobileMode = false;
                    this.notifyMobileModeChanged(false);
                }
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
        if (!this.options.noPreview) {
            this.mobileContentItemStatisticsPanel.getPreviewPanel().setItem(previewItem, force);
        }
    }

    setContent(content: api.content.ContentSummaryAndCompareStatus) {
        if (!this.isMobileMode()) {
            this.detailsView.setItem(content);
        }
        if (this.options.noPreview) {
            this.mobileDetailsPanel.setItem(content);
        } else {
            const prevItem = this.getMobilePanelItem();
            const changed = !prevItem || prevItem.getId() !== content.getId();

            const item = ViewItem.fromContentSummaryAndCompareStatus(content);
            this.mobileContentItemStatisticsPanel.setItem(item);

            if (changed) {
                const previewPanel = this.mobileContentItemStatisticsPanel.getPreviewPanel();
                previewPanel.setBlank();
                previewPanel.showMask();

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
        if (this.options.noPreview) {
            this.mobileDetailsPanel.slideIn();
        } else {
            this.mobileContentItemStatisticsPanel.slideIn();
        }
    }

    hideMobilePanel() {
        if (this.options.noPreview) {
            this.mobileDetailsPanel.slideOut();
        } else {
            this.mobileContentItemStatisticsPanel.slideAllOut();
        }
    }

    isMobileMode(): boolean {
        return this.mobileMode;
    }
}
