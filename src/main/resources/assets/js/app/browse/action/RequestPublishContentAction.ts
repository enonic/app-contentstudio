import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RequestContentPublishPromptEvent} from '../RequestContentPublishPromptEvent';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class RequestPublishContentAction
    extends Action {

    private grid: ContentTreeGrid;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.requestPublishMore'));
        this.setEnabled(false);

        this.grid = grid;

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new RequestContentPublishPromptEvent(contents).fire();
    }
}
