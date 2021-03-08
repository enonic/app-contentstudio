import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentDeletePromptEvent} from '../../browse/ContentDeletePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class DeleteContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.deleteMore'), 'mod+del', true);
        this.onExecuted(() => {
            new ContentDeletePromptEvent([new ContentSummaryAndCompareStatus().
                setContentSummary(wizardPanel.getPersistedItem()).
                setCompareStatus(wizardPanel.getCompareStatus()).
                setPublishStatus(wizardPanel.getPublishStatus())
            ]).fire();
        });
    }
}
