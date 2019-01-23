import ApplicationConfiguratorDialog = api.form.inputtype.appconfig.ApplicationConfiguratorDialog;
import {HTMLAreaDialogHandler} from '../text/dialog/HTMLAreaDialogHandler';

export class SiteConfiguratorDialog
    extends ApplicationConfiguratorDialog {

    protected hasSubDialog(): boolean {
        return super.hasSubDialog() || !!HTMLAreaDialogHandler.getOpenDialog();
    }

    close() {
        this.destroyCkeInstancesInDialog();
        super.close();
        this.remove();
    }

    private destroyCkeInstancesInDialog() {
        const ckeInstances: { [id: string]: CKEDITOR.editor } = CKEDITOR.instances;
        const dialogElement: HTMLElement = this.getHTMLElement();

        for (let i in ckeInstances) {
            const ckeInstance: CKEDITOR.editor = CKEDITOR.instances[i];

            if (dialogElement.contains(ckeInstance.container.$)) {
                ckeInstance.focusManager.blur(true);
                ckeInstance.destroy();
            }
        }
    }
}
