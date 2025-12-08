import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openDeleteDialog} from '../../../v6/features/store/dialogs/deleteDialog.store';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentWizardPanel} from '../ContentWizardPanel';

export class ArchiveContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.archive'), 'mod+del', true);
        this.onExecuted(() => {
            openDeleteDialog([new ContentSummaryAndCompareStatus().
                setContentSummary(wizardPanel.getPersistedItem()).
                setCompareStatus(wizardPanel.getCompareStatus()).
                setPublishStatus(wizardPanel.getPublishStatus())
            ]);
        });
    }
}
