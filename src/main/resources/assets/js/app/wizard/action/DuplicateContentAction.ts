import {ContentDuplicatePromptEvent} from '../../browse/ContentDuplicatePromptEvent';
import {Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class DuplicateContentAction extends api.ui.Action {

    constructor(wizardPanel: api.app.wizard.WizardPanel<Content>) {
        super(i18n('action.duplicateMore'));
        this.onExecuted(() => {
            const content = ContentSummaryAndCompareStatus.fromContentSummary(wizardPanel.getPersistedItem());
            new ContentDuplicatePromptEvent([content]).setOpenActionAfterDuplicate(true).fire();
        });
    }
}
