import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from 'lib-admin-ui/dom/Body';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Action} from 'lib-admin-ui/ui/Action';
import {MobileContextPanel} from './context/MobileContextPanel';
import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import {MobileContextPanelToggleButton} from './context/button/MobileContextPanelToggleButton';
import {ContextView} from './context/ContextView';
import {MobilePreviewFoldButton} from './MobilePreviewFoldButton';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {IEl} from 'lib-admin-ui/dom/IEl';
import {NamePrettyfier} from 'lib-admin-ui/NamePrettyfier';

export class MobileContentItemStatisticsPanel
    extends ItemStatisticsPanel {

    private itemHeader: DivEl = new DivEl('mobile-content-item-statistics-header');
    private headerLabel: H6El = new H6El('mobile-header-title');

    private previewPanel: ContentItemPreviewPanel;
    private contextPanel: MobileContextPanel;
    private contextPanelToggleButton: MobileContextPanelToggleButton;

    private foldButton: MobilePreviewFoldButton;

    private slideOutListeners: { (): void }[] = [];
    private slideInListeners: { (): void }[] = [];

    constructor(actions: Action[], contextView: ContextView) {
        super('mobile-content-item-statistics-panel');

        this.setDoOffset(false);

        this.initHeader(actions);

        this.initPreviewPanel();

        this.initContextPanel(contextView);

        this.initContextPanelToggleButton();

        this.initListeners();

        this.onRendered(() => {
            this.contextPanel.setOffsetTop(this.itemHeader.getEl().getHeightWithBorder());
        });
    }

    private initListeners() {

        let reloadItemPublishStateChange = (contents: ContentSummaryAndCompareStatus[]) => {
            if (!this.getItem()) {
                return;
            }
            const thisContentId: string = this.getItem().getId();

            const contentSummary: ContentSummaryAndCompareStatus = contents.find(content => thisContentId === content.getId());

            if (contentSummary) {
                this.setItem(contentSummary);
            }
        };

        let serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished(reloadItemPublishStateChange);
        serverEvents.onContentUnpublished(reloadItemPublishStateChange);

        this.onRendered(() => this.slideAllOut(true));

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.contextPanel.isSlidedIn()) {
                this.slideAllOut();
            }
        });
    }

    private initHeader(actions: Action[]) {
        const titleDiv = new DivEl();
        const icon = new IEl('icon-more_vert');
        const backButton = new DivEl('mobile-context-panel-back-button');
        backButton.onClicked((event) => {
            this.foldButton.collapse();
            this.slideAllOut();
            event.stopPropagation();
        });
        titleDiv.appendChildren(this.headerLabel, icon);
        this.foldButton = new MobilePreviewFoldButton(actions, titleDiv);
        this.itemHeader.appendChildren(titleDiv, this.foldButton, backButton);

        this.appendChild(this.itemHeader);
    }

    private initContextPanel(contextView: ContextView) {
        this.contextPanel = new MobileContextPanel(contextView);

        this.appendChild(this.contextPanel);
    }

    private initContextPanelToggleButton() {
        this.contextPanelToggleButton = new MobileContextPanelToggleButton(this.contextPanel, () => {
            this.foldButton.collapse();
            this.calcAndSetContextPanelTopOffset();
        });
        this.itemHeader.appendChild(this.contextPanelToggleButton);
    }

    private initPreviewPanel() {
        this.previewPanel = new ContentItemPreviewPanel();
        this.previewPanel.setDoOffset(false);
        this.previewPanel.addClass('mobile');
        this.appendChild(this.previewPanel);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (!this.getItem() || !this.getItem().equals(item)) {
            super.setItem(item);
            this.toggleClass('invalid', !item.getContentSummary().isValid());
            this.foldButton.collapse();
            this.contextPanel.setItem(item);
            if (item) {
                this.setName(this.makeDisplayName(item));
            }
        }
    }

    private makeDisplayName(item: ContentSummaryAndCompareStatus): string {
        let localName = item.getType().getLocalName() || '';
        return StringHelper.isEmpty(item.getDisplayName())
               ? NamePrettyfier.prettifyUnnamed(localName)
               : item.getDisplayName();
    }

    getContextPanel(): MobileContextPanel {
        return this.contextPanel;
    }

    getPreviewPanel(): ContentItemPreviewPanel {
        return this.previewPanel;
    }

    private setName(name: string) {
        this.headerLabel.getHTMLElement().textContent = name;
    }

    slideAllOut(silent?: boolean) {
        this.slideOut(silent);
        this.contextPanel.slideOut(silent);
    }

    // hide
    slideOut(silent?: boolean) {
        this.getEl().setRightPx(-this.getEl().getWidthWithBorder());
        Body.get().getHTMLElement().classList.remove('mobile-statistics-panel');
        if (!silent) {
            this.notifySlideOut();
        }
    }

    // show
    slideIn(silent?: boolean) {
        Body.get().getHTMLElement().classList.add('mobile-statistics-panel');
        this.getEl().setRightPx(0);
        if (!silent) {
            this.notifySlideIn();
        }
    }

    onSlideIn(listener: () => void) {
        this.slideInListeners.push(listener);
    }

    unSlideIn(listener: () => void) {
        this.slideInListeners = this.slideInListeners.filter(curr => curr !== listener);
    }

    notifySlideIn() {
        this.slideInListeners.forEach(curr => curr());
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

    private calcAndSetContextPanelTopOffset() {
        this.contextPanel.getEl().setTopPx(this.itemHeader.getEl().getHeightWithMargin());
    }
}
