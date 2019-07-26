import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RequestContentPublishPromptEvent} from '../RequestContentPublishPromptEvent';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class RequestPublishContentAction
    extends Action {

    private grid: ContentTreeGrid;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.requestPublish'));
        this.setEnabled(false);

        this.grid = grid;

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new RequestContentPublishPromptEvent(contents).fire();
    }
}
