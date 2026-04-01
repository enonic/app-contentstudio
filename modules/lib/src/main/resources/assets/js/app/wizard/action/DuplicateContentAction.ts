import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {openDuplicateDialog} from '../../../v6/features/store/dialogs/duplicateDialog.store';
import {$wizardPersistedContent} from '../../../v6/features/store/wizardSave.store';

export class DuplicateContentAction
    extends Action {

    constructor() {
        super(i18n('action.duplicate'));
        this.onExecuted(() => {
            const content = $wizardPersistedContent.get();
            if (!content) {
                return;
            }
            openDuplicateDialog([ContentSummaryAndCompareStatus.fromContentSummary(content)]);
        });
    }
}
