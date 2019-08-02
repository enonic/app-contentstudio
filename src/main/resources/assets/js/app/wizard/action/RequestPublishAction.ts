import Action = api.ui.Action;
import i18n = api.util.i18n;
import {ContentWizardPanel} from '../ContentWizardPanel';
import {RequestContentPublishPromptEvent} from '../../browse/RequestContentPublishPromptEvent';

export class RequestPublishAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.requestPublishMore'));

        this.wizard = wizard;

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {
        new RequestContentPublishPromptEvent([this.wizard.getContent()]).fire();
    }
}
