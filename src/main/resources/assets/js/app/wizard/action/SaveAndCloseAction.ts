import CloseAction = api.app.wizard.CloseAction;
import SaveAction = api.app.wizard.SaveAction;
import WizardPanel = api.app.wizard.WizardPanel;

export class SaveAndCloseAction
    extends api.ui.Action {

    constructor(wizardPanel: WizardPanel<any>) {
        super('SaveAndClose', 'mod+enter', true);

        this.onExecuted(() => {

            let deferred = wemQ.defer();

            let saveAction = new SaveAction(wizardPanel);
            saveAction.onAfterExecute(() => {
                new CloseAction(wizardPanel).execute();
                deferred.resolve(null);
            });
            saveAction.execute();

            return deferred.promise;
        });
    }
}
