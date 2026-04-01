import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openMoveDialog} from '../../../v6/features/store/dialogs/moveDialog.store';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {$wizardPersistedContent, $wizardCompareStatus, $wizardPublishStatus} from '../../../v6/features/store/wizardSave.store';

export class MoveContentAction
    extends Action {

    constructor() {
        super(i18n('action.move'), 'alt+m');
        this.onExecuted(() => {
            const content = $wizardPersistedContent.get();
            if (!content) {
                return;
            }
            openMoveDialog([new ContentSummaryAndCompareStatus()
                .setContentSummary(content)
                .setCompareStatus($wizardCompareStatus.get())
                .setPublishStatus($wizardPublishStatus.get())
            ]);
        });
    }
}
