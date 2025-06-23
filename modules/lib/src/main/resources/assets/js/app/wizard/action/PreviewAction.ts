import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';

export class PreviewAction
    extends Action {

    private writePermissions: boolean = false;

    private wizard: ContentWizardPanel;

    private helper: PreviewActionHelper;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.preview.open'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.wizard = wizard;
        this.helper = new PreviewActionHelper();

        this.onExecuted(() => this.handleExecuted());
    }

    protected handleExecuted() {
        const widget = this.wizard.getLivePanel().getFrameContainer().getWidgetSelector().getSelectedWidget();
        if (this.writePermissions && this.wizard.hasUnsavedChanges()) {
            this.wizard.setRequireValid(true);
            this.wizard.saveChanges().then(content => this.helper.openWindow(content, widget)).catch(
                (reason) => DefaultErrorHandler.handle(reason)).done();
        } else {
            this.helper.openWindow(this.wizard.getPersistedItem(), widget);
        }
    }

    setWritePermissions(writePermissions: boolean) {
        this.writePermissions = writePermissions;
    }
}
