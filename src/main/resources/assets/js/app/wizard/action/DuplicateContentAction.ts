import '../../../api.ts';
import {ContentDuplicatePromptEvent} from '../../browse/ContentDuplicatePromptEvent';
import i18n = api.util.i18n;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class DuplicateContentAction extends api.ui.Action {

    constructor(wizardPanel: api.app.wizard.WizardPanel<api.content.Content>) {
        super(i18n('action.duplicateMore'));
        this.onExecuted(() => {
            const content = ContentSummaryAndCompareStatus.fromContentSummary(wizardPanel.getPersistedItem());
            new ContentDuplicatePromptEvent([content]).fire();
        });
    }
}
