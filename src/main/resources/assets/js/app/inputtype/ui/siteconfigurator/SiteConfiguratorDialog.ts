import ApplicationConfiguratorDialog = api.form.inputtype.appconfig.ApplicationConfiguratorDialog;
import {HTMLAreaDialogHandler} from '../text/dialog/HTMLAreaDialogHandler';

export class SiteConfiguratorDialog
    extends ApplicationConfiguratorDialog {

    protected hasSubDialog(): boolean {
        return super.hasSubDialog() || !!HTMLAreaDialogHandler.getOpenDialog();
    }
}
