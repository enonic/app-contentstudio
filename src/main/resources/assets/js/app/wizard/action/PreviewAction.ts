import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {BasePreviewAction} from '../../action/BasePreviewAction';
import {ContentWizardPanel} from '../ContentWizardPanel';

export class PreviewAction extends BasePreviewAction {

    private writePermissions: boolean = false;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.preview'));
        this.onExecuted(() => {
            if (this.writePermissions && wizard.hasUnsavedChanges()) {
                    wizard.setRequireValid(true);
                    wizard.saveChanges().then(content => this.openWindow(content)).catch(
                        (reason: any) => DefaultErrorHandler.handle(reason)).done();
                } else {
                    this.openWindow(wizard.getPersistedItem());
                }
            }
        );
    }

    setWritePermissions(writePermissions: boolean) {
        this.writePermissions = writePermissions;
    }
}
