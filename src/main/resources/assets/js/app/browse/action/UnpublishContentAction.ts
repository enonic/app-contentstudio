import {ContentUnpublishPromptEvent} from '../ContentUnpublishPromptEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class UnpublishContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.unpublishMore'));

        this.setEnabled(false);

        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentUnpublishPromptEvent(contents).fire();
        });
    }
}
