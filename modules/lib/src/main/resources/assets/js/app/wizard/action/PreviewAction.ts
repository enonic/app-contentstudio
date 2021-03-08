import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {Action} from 'lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';

export class PreviewAction
    extends Action {

    private writePermissions: boolean = false;

    private wizard: ContentWizardPanel;

    private helper: PreviewActionHelper;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.wizard = wizard;
        this.helper = new PreviewActionHelper();

        this.onExecuted(() => this.handleExecuted());
    }

    protected handleExecuted() {
        if (this.writePermissions && this.wizard.hasUnsavedChanges()) {
            this.wizard.setRequireValid(true);
            this.wizard.saveChanges().then(content => this.helper.openWindow(content)).catch(
                (reason: any) => DefaultErrorHandler.handle(reason)).done();
        } else {
            this.helper.openWindow(this.wizard.getPersistedItem());
        }
    }

    setWritePermissions(writePermissions: boolean) {
        this.writePermissions = writePermissions;
    }
}
