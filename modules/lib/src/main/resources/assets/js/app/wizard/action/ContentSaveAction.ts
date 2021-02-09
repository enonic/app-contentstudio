import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {SaveAction} from 'lib-admin-ui/app/wizard/SaveAction';
import {ContentWizardPanel} from '../ContentWizardPanel';

export class ContentSaveAction
    extends SaveAction {

    private static CLASS_NAME_SAVED: string = 'saved';

    constructor(wizardPanel: ContentWizardPanel, label: string = i18n('action.save')) {
        super(wizardPanel, label);

        this.setEnabled(false);
    }

    isSavedStateEnabled(): boolean {
        return ContentSaveAction.CLASS_NAME_SAVED === this.getIconClass();
    }

    protected saveChanges(wizardPanel: ContentWizardPanel): Q.Promise<any> {
        this.setLabel(i18n('action.saving'));

        return wizardPanel.saveChanges().then(() => {
            this.setLabel(i18n('action.saved'));

            this.toggleIconClass(ContentSaveAction.CLASS_NAME_SAVED, true);

        }, (reason: any) => {
            this.setLabel(i18n('action.save'));
            this.setEnabled(true);

            this.toggleIconClass(ContentSaveAction.CLASS_NAME_SAVED, false);

            DefaultErrorHandler.handle(reason);
        });
    }
}
