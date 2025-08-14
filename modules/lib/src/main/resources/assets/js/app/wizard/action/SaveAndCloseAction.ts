import Q from 'q';
import {CloseAction} from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import {SaveAction} from '@enonic/lib-admin-ui/app/wizard/SaveAction';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentWizardPanel} from '../ContentWizardPanel';

export class SaveAndCloseAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
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
