import ApplicationConfiguratorDialog = api.form.inputtype.appconfig.ApplicationConfiguratorDialog;
import {HTMLAreaDialogHandler} from '../text/dialog/HTMLAreaDialogHandler';

export class SiteConfiguratorDialog
    extends ApplicationConfiguratorDialog {

    protected hasSubDialog(): boolean {
        return super.hasSubDialog() || !!HTMLAreaDialogHandler.getOpenDialog();
    }

    // didn't work
    // close() {
    //     for (var prop in CKEDITOR.instances) {
    //         CKEDITOR.instances[prop].removeAllListeners();
    //         CKEDITOR.instances[prop].destroy();
    //     }
    //     super.close();
    // }
}
