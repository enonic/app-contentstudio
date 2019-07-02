import Action = api.ui.Action;
import i18n = api.util.i18n;
import {ContentWizardPanel} from '../ContentWizardPanel';

export class RequestPublishAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.requestPublish'));

        this.wizard = wizard;

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        // execute
    }
}
