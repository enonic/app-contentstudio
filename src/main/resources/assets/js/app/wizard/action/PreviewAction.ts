import '../../../api.ts';
import {BasePreviewAction} from '../../action/BasePreviewAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import i18n = api.util.i18n;

export class PreviewAction extends BasePreviewAction {

    private writePermissions: boolean = false;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.preview'));
        this.onExecuted(() => {
            if (this.writePermissions && wizard.hasUnsavedChanges()) {
                    wizard.setRequireValid(true);
                    wizard.saveChanges().then(content => this.openWindow(content)).catch(
                        (reason: any) => api.DefaultErrorHandler.handle(reason)).done();
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
