import {type SortContentDialog} from '../sort/dialog/SortContentDialog';
import {SaveSortedContentEvent} from '../SaveSortedContentEvent';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class SaveSortedContentAction
    extends Action {

    constructor(dialog: SortContentDialog) {
        super(i18n('action.save'));

        this.setEnabled(true).setClass('save-sort');

        this.onExecuted(() => {
            new SaveSortedContentEvent(dialog.getContent().getContentSummary()).fire();
        });
    }
}
