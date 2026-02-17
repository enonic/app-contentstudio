import {ContentDuplicatePromptEvent} from '../../browse/ContentDuplicatePromptEvent';
import {type Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

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
