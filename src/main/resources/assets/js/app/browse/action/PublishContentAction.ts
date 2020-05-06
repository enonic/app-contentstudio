import {ContentPublishPromptEvent} from '../ContentPublishPromptEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class PublishContentAction extends Action {

    constructor(grid: ContentTreeGrid, includeChildItems: boolean = false, useShortcut: boolean = true) {
        super(i18n('action.publishMore'), useShortcut ? 'ctrl+alt+p' : null);
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentPublishPromptEvent({model: contents, includeChildItems}).fire();
        });
    }
}
