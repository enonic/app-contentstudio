import {Action} from 'lib-admin-ui/ui/Action';
import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import {ContentItemViewToolbar} from './ContentItemViewToolbar';
import {EditAction} from './EditAction';
import {DeleteAction} from './DeleteAction';
import {CloseAction} from './CloseAction';
import {ContentItemStatisticsPanel} from './ContentItemStatisticsPanel';
import {Router} from '../Router';
import {ShowPreviewEvent} from '../browse/ShowPreviewEvent';
import {ShowDetailsEvent} from '../browse/ShowDetailsEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemViewPanel} from 'lib-admin-ui/app/view/ItemViewPanel';
import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {DeckPanel} from 'lib-admin-ui/ui/panel/DeckPanel';
import {ElementShownEvent} from 'lib-admin-ui/dom/ElementShownEvent';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';

export class ContentItemViewPanel
    extends ItemViewPanel<ContentSummaryAndCompareStatus> {

    private statisticsPanel: ItemStatisticsPanel<ContentSummaryAndCompareStatus>;

    private statisticsPanelIndex: number;

    private previewPanel: ContentItemPreviewPanel;

    private previewMode: boolean;

    private previewPanelIndex: number;

    private deckPanel: DeckPanel;

    private editAction: Action;

    private deleteAction: Action;

    private closeAction: Action;

    private actions: Action[];

    constructor() {
        super();

        this.deckPanel = new DeckPanel();

        this.editAction = new EditAction(this);
        this.deleteAction = new DeleteAction(this);
        this.closeAction = new CloseAction(this, true);

        this.actions = [this.editAction, this.deleteAction, this.closeAction];

        let toolbar = new ContentItemViewToolbar({
            editAction: this.editAction,
            deleteAction: this.deleteAction
        });

        this.setToolbar(toolbar);
        this.setPanel(this.deckPanel);

        this.statisticsPanel = new ContentItemStatisticsPanel();
        this.previewPanel = new ContentItemPreviewPanel();

        this.statisticsPanelIndex = this.deckPanel.addPanel(this.statisticsPanel);
        this.previewPanelIndex = this.deckPanel.addPanel(this.previewPanel);

        this.showPreview(false);

        ShowPreviewEvent.on((event) => {
            this.showPreview(true);
        });

        ShowDetailsEvent.on((event) => {
            this.showPreview(false);
        });

        this.onShown((event: ElementShownEvent) => {
            if (this.getItem()) {
                Router.get().setHash('view/' + this.getItem().getModel().getId());
            }
        });
    }

    setItem(item: ViewItem<ContentSummaryAndCompareStatus>) {
        super.setItem(item);
        this.statisticsPanel.setItem(item);
        this.previewPanel.setItem(item);
    }

    public showPreview(enabled: boolean) {
        this.previewMode = enabled;
        // refresh the view
        if (enabled) {
            this.deckPanel.showPanelByIndex(this.previewPanelIndex);
        } else {
            this.deckPanel.showPanelByIndex(this.statisticsPanelIndex);
        }
    }

    public getCloseAction(): Action {
        return this.closeAction;
    }

    getActions(): Action[] {
        return this.actions;
    }

}
