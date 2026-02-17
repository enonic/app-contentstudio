import {type ContentWizardPanel} from '../ContentWizardPanel';
import {ContentDeletePromptEvent} from '../../browse/ContentDeletePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ArchiveContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.archiveMore'), 'mod+del', true);
        this.onExecuted(() => {
            new ContentDeletePromptEvent([new ContentSummaryAndCompareStatus().
                setContentSummary(wizardPanel.getPersistedItem()).
                setCompareStatus(wizardPanel.getCompareStatus()).
                setPublishStatus(wizardPanel.getPublishStatus())
            ]).fire();
        });
    }
}
