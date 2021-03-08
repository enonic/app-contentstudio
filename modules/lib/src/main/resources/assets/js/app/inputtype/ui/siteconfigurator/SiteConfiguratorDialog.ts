import * as Q from 'q';
import {ApplicationConfiguratorDialog} from 'lib-admin-ui/form/inputtype/appconfig/ApplicationConfiguratorDialog';
export class SiteConfiguratorDialog
    extends ApplicationConfiguratorDialog {

    close() {
        this.destroyCkeInstancesInDialog();
        super.close();
        this.remove();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('site-configurator-dialog');

            return rendered;
        });
    }

    private destroyCkeInstancesInDialog() {
        const ckeInstances: { [id: string]: CKEDITOR.editor } = CKEDITOR.instances;
        const dialogElement: HTMLElement = this.getHTMLElement();

        for (let i in ckeInstances) {
            if (CKEDITOR.instances[i]) {
                const ckeInstance: CKEDITOR.editor = CKEDITOR.instances[i];

                if (dialogElement.contains(ckeInstance.container.$)) {
                    ckeInstance.focusManager.blur(true);
                    ckeInstance.destroy();
                }
            }
        }
    }
}
