import Q from 'q';
import {
    ApplicationConfiguratorDialog,
    ApplicationConfiguratorDialogParams
} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfiguratorDialog';

export interface SiteConfiguratorDialogParams extends ApplicationConfiguratorDialogParams {
    isDirtyCallback?: () => boolean;
}

export class SiteConfiguratorDialog
    extends ApplicationConfiguratorDialog {

    private readonly isDirtyCallback?: () => boolean;

    constructor(params: SiteConfiguratorDialogParams) {
        super(params);

        this.isDirtyCallback = params.isDirtyCallback;
    }

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
        if (!window.CKEDITOR) {
            return;
        }

        const ckeInstances: Record<string, CKEDITOR.editor> = CKEDITOR.instances;
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

    isDirty(): boolean {
        return this.isDirtyCallback ? this.isDirtyCallback() : super.isDirty();
    }
}
