import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openDeleteDialog} from '../../../v6/features/store/dialogs/deleteDialog.store';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {$wizardPersistedContent, $wizardCompareStatus, $wizardPublishStatus} from '../../../v6/features/store/wizardSave.store';

export class ArchiveContentAction
    extends Action {

    constructor() {
        super(i18n('action.delete'), 'mod+del', true);
        this.onExecuted(() => {
            const content = $wizardPersistedContent.get();
            if (!content) {
                return;
            }
            openDeleteDialog([new ContentSummaryAndCompareStatus().
                setContentSummary(content).
                setCompareStatus($wizardCompareStatus.get()).
                setPublishStatus($wizardPublishStatus.get())
            ]);
        });
    }
}
