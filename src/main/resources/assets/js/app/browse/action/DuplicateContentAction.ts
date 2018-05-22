import '../../../api.ts';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDuplicatePromptEvent} from '../ContentDuplicatePromptEvent';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class DuplicateContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.duplicateMore'));
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: api.content.ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentDuplicatePromptEvent(contents)
                .setYesCallback(() => {
                    const deselected = grid.getSelectedDataList().map(content => content.getId());
                    grid.deselectNodes(deselected);
                }).fire();
        });
    }
}
