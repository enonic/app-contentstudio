import {ProjectFormItem} from './ProjectFormItem';
import {Project} from '../../../../data/project/Project';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';

export abstract class CopyFromParentFormItem extends ProjectFormItem {

    protected copyFromParentButton?: Button;

    protected parentProject?: Project;

    setParentProject(value: Project) {
        this.parentProject = value;

        if (value) {
            this.appendCopyButtons();
        } else {
            this.removeCopyButtons();
        }
    }

    private removeCopyButtons() {
        if (this.copyFromParentButton) {
            this.removeChild(this.copyFromParentButton);
        }
    }

    private appendCopyButtons() {
        if (!this.copyFromParentButton) {
            this.copyFromParentButton = this.createCopyFromParentButton();
        }

        this.appendChild(this.copyFromParentButton);
        this.updateCopyButtonState();
    }

    private createCopyFromParentButton(): Button {
        const button: Button = new Button(i18n('settings.wizard.project.copy')).setEnabled(false);
        button.addClass('copy-parent-button');

        button.onClicked(() => {
            if (!this.parentProject) {
                return;
            }

            this.doCopyFromParent();
        });

        return button;
    }

    protected abstract doCopyFromParent(): void;

    abstract updateCopyButtonState(): void;

}
