import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDuplicatePromptEvent} from '../ContentDuplicatePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class DuplicateContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.duplicateMore'));
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentDuplicatePromptEvent(contents)
                .setYesCallback(() => {
                    const deselected = grid.getSelectedDataList().map(content => content.getId());
                    grid.deselectNodes(deselected);
                }).fire();
        });
    }
}
