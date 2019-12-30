import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {UndoPendingDeleteContentRequest} from '../../resource/UndoPendingDeleteContentRequest';
import {Action} from 'lib-admin-ui/ui/Action';

export class UndoPendingDeleteAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.undoDelete'));

        this.setEnabled(true);
        this.setVisible(false);

        this.onExecuted(() => {
            new UndoPendingDeleteContentRequest([wizardPanel.getPersistedItem().getContentId()])
                .sendAndParse().then((result: number) => UndoPendingDeleteContentRequest.showResponse(result));
        });
    }
}
