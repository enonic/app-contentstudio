import {ContentTreeGrid} from '../ContentTreeGrid';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class CreateIssueAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.createTaskMore'));

        this.setEnabled(false);

        this.onExecuted(() => {
            const contents: ContentSummaryAndCompareStatus[] = grid.getSelectedDataList();
            new CreateIssuePromptEvent(contents).fire();
        });
    }
}
