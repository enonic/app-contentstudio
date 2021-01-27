import {SortContentDialog} from '../sort/dialog/SortContentDialog';
import {SaveSortedContentEvent} from '../SaveSortedContentEvent';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class SaveSortedContentAction
    extends Action {

    constructor(dialog: SortContentDialog) {
        super(i18n('action.save'));
        this.setEnabled(true);

        this.onExecuted(() => {
            new SaveSortedContentEvent(dialog.getContent().getContentSummary()).fire();
        });
    }
}
