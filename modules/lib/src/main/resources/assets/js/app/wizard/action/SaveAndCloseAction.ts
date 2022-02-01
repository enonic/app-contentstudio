import Q from 'q';
import {CloseAction} from 'lib-admin-ui/app/wizard/CloseAction';
import {SaveAction} from 'lib-admin-ui/app/wizard/SaveAction';
import {WizardPanel} from 'lib-admin-ui/app/wizard/WizardPanel';
import {Action} from 'lib-admin-ui/ui/Action';

export class SaveAndCloseAction
    extends Action {

    constructor(wizardPanel: WizardPanel<any>) {
        super('SaveAndClose', 'mod+enter', true);

        this.onExecuted(() => {

            let deferred = Q.defer();

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
