import {ContentDuplicatePromptEvent} from '../../browse/ContentDuplicatePromptEvent';
import {Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {WizardPanel} from 'lib-admin-ui/app/wizard/WizardPanel';
import {Action} from 'lib-admin-ui/ui/Action';

export class DuplicateContentAction
    extends Action {

    constructor(wizardPanel: WizardPanel<Content>) {
        super(i18n('action.duplicateMore'));
        this.onExecuted(() => {
            const content = ContentSummaryAndCompareStatus.fromContentSummary(wizardPanel.getPersistedItem());
            new ContentDuplicatePromptEvent([content]).setOpenActionAfterDuplicate(true).fire();
        });
    }
}
