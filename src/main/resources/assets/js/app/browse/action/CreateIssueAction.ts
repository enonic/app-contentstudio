import {ContentTreeGrid} from '../ContentTreeGrid';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class CreateIssueAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.createIssueMore'));

        this.setEnabled(false);

        this.onExecuted(() => {
            const contents: ContentSummaryAndCompareStatus[] = grid.getSelectedDataList();
            new CreateIssuePromptEvent(contents).fire();
        });
    }
}
