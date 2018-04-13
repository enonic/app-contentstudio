import '../../../api.ts';
import {OpenDuplicateDialogEvent} from '../../duplicate/OpenDuplicateDialogEvent';
import i18n = api.util.i18n;
import ManagedActionManager = api.managedaction.ManagedActionManager;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import ManagedActionState = api.managedaction.ManagedActionState;

export class DuplicateContentAction extends api.ui.Action {

    constructor(wizardPanel: api.app.wizard.WizardPanel<api.content.Content>) {
        super(i18n('action.duplicate'));
        this.onExecuted(() => {
            const contentToDuplicate = [wizardPanel.getPersistedItem()];
            new OpenDuplicateDialogEvent(contentToDuplicate).fire();
            const duplicationEndedHandler = (state: ManagedActionState, executor: ManagedActionExecutor) => {
                if (state === ManagedActionState.ENDED) {
                    // const summaryAndStatus = ContentSummaryAndCompareStatus.fromContentSummary(/* duplicated */);
                    // new EditContentEvent([summaryAndStatus]).fire();
                    ManagedActionManager.instance().unManagedActionStateChanged(duplicationEndedHandler);
                }
            };
            ManagedActionManager.instance().onManagedActionStateChanged(duplicationEndedHandler);
        });
    }
}
