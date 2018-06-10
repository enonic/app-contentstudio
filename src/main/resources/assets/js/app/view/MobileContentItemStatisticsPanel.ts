import '../../api.ts';
import {MobileDetailsPanel} from './detail/MobileDetailsSlidablePanel';
import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import {MobileDetailsPanelToggleButton} from './detail/button/MobileDetailsPanelToggleButton';
import {ContentTreeGridActions} from '../browse/action/ContentTreeGridActions';
import {DetailsView} from './detail/DetailsView';
import {MobilePreviewFoldButton} from './MobilePreviewFoldButton';
import ViewItem = api.app.view.ViewItem;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import StringHelper = api.util.StringHelper;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;

export class MobileContentItemStatisticsPanel extends api.app.view.ItemStatisticsPanel<api.content.ContentSummaryAndCompareStatus> {

    private itemHeader: api.dom.DivEl = new api.dom.DivEl('mobile-content-item-statistics-header');
    private headerLabel: api.dom.H6El = new api.dom.H6El('mobile-header-title');

    private previewPanel: ContentItemPreviewPanel;
    private detailsPanel: MobileDetailsPanel;
    private detailsToggleButton: MobileDetailsPanelToggleButton;

    private foldButton: MobilePreviewFoldButton;

    private slideOutListeners: { (): void }[] = [];

    constructor(browseActions: ContentTreeGridActions, detailsView: DetailsView) {
        super('mobile-content-item-statistics-panel');

        this.setDoOffset(false);

        this.createFoldButton(browseActions);

        this.initHeader();

        this.initPreviewPanel();

        this.initDetailsPanel(detailsView);

        this.initDetailsPanelToggleButton();

        this.initListeners();
    }

    private initListeners() {

        let reloadItemPublishStateChange = (contents: ContentSummaryAndCompareStatus[]) => {
            let thisContentId = this.getItem().getModel().getId();

            let contentSummary: ContentSummaryAndCompareStatus = contents.filter((content) => {
                return thisContentId === content.getId();
            })[0];

            if (contentSummary) {
                this.setItem(ViewItem.fromContentSummaryAndCompareStatus(contentSummary));
            }
        };

        let serverEvents = api.content.event.ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished(reloadItemPublishStateChange);
        serverEvents.onContentUnpublished(reloadItemPublishStateChange);

        this.onRendered(() => this.slideAllOut(true));

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.detailsPanel.isSlidedIn()) {
                this.slideAllOut();
            }
        });
    }

    private createFoldButton(browseActions: ContentTreeGridActions) {
        this.foldButton = new MobilePreviewFoldButton([
            browseActions.getUnpublishAction(),
            browseActions.getPublishAction(),
            browseActions.getMoveAction(),
            browseActions.getSortAction(),
            browseActions.getDeleteAction(),
            browseActions.getDuplicateAction(),
            browseActions.getEditAction(),
            browseActions.getShowNewDialogAction()
        ], this.itemHeader);
    }

    private initHeader() {

        const icon = new api.dom.IEl('icon-more_vert');
        const backButton = new api.dom.DivEl('mobile-details-panel-back-button');
        backButton.onClicked((event) => {
            this.foldButton.collapse();
            this.slideAllOut();
            event.stopPropagation();
        });
        this.itemHeader.appendChildren(this.headerLabel, icon, this.foldButton, backButton);

        this.appendChild(this.itemHeader);
    }

    private initDetailsPanel(detailsView: DetailsView) {
        this.detailsPanel = new MobileDetailsPanel(detailsView);
        this.appendChild(this.detailsPanel);
    }

    private initDetailsPanelToggleButton() {
        this.detailsToggleButton = new MobileDetailsPanelToggleButton(this.detailsPanel, () => {
            this.foldButton.collapse();
            this.calcAndSetDetailsPanelTopOffset();
        });
        this.itemHeader.appendChild(this.detailsToggleButton);
    }

    private initPreviewPanel() {
        this.previewPanel = new ContentItemPreviewPanel();
        this.previewPanel.setDoOffset(false);
        this.previewPanel.addClass('mobile');
        this.appendChild(this.previewPanel);
    }

    setItem(item: ViewItem<ContentSummaryAndCompareStatus>) {
        if (!this.getItem() || !this.getItem().equals(item)) {
            super.setItem(item);
            this.toggleClass('invalid', !item.getModel().getContentSummary().isValid());
            this.foldButton.collapse();
            this.detailsPanel.setItem(!!item ? item.getModel() : null);
            if (item) {
                this.setName(this.makeDisplayName(item));
            }
        }
    }

    private makeDisplayName(item: ViewItem<ContentSummaryAndCompareStatus>): string {
        let localName = item.getModel().getType().getLocalName() || '';
        return StringHelper.isEmpty(item.getDisplayName())
            ? api.content.ContentUnnamed.prettifyUnnamed(localName)
            : item.getDisplayName();
    }

    getDetailsPanel(): MobileDetailsPanel {
        return this.detailsPanel;
    }

    getPreviewPanel(): ContentItemPreviewPanel {
        return this.previewPanel;
    }

    private setName(name: string) {
        this.headerLabel.getHTMLElement().textContent = name;
    }

    slideAllOut(silent?: boolean) {
        this.slideOut(silent);
        this.detailsPanel.slideOut();
        this.detailsToggleButton.removeClass('expanded');
    }

    // hide
    slideOut(silent?: boolean) {
        this.getEl().setRightPx(-this.getEl().getWidthWithBorder());
        api.dom.Body.get().getHTMLElement().classList.remove('mobile-statistics-panel');
        if (!silent) {
            this.notifySlideOut();
        }
    }

    // show
    slideIn() {
        api.dom.Body.get().getHTMLElement().classList.add('mobile-statistics-panel');
        this.getEl().setRightPx(0);
    }

    onSlideOut(listener: () => void) {
        this.slideOutListeners.push(listener);
    }

    unSlideOut(listener: () => void) {
        this.slideOutListeners = this.slideOutListeners.filter(curr => curr !== listener);
    }

    notifySlideOut() {
        this.slideOutListeners.forEach(curr => curr());
    }

    private calcAndSetDetailsPanelTopOffset() {
        this.detailsPanel.getEl().setTopPx(this.itemHeader.getEl().getHeightWithMargin());
    }
}
