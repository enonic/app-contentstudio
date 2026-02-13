import {ProjectFormItem} from './ProjectFormItem';
import {type Project} from '../../../../data/project/Project';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export abstract class CopyFromParentFormItem
    extends ProjectFormItem {

    protected copyFromParentButton?: Button;

    protected parentProjects?: Project[];

    setParentProjects(projects: Project[]) {
        if (!ObjectHelper.arrayEquals(this.parentProjects, projects)) {
            this.removeCopyButton();
        }

        this.parentProjects = projects;

        if (projects.length > 0) {
            this.appendCopyButton();
        } else {
            this.removeCopyButton();
        }
    }

    private removeCopyButton() {
        if (this.copyFromParentButton) {
            this.removeChild(this.copyFromParentButton);
            this.copyFromParentButton = null;
        }
    }

    private appendCopyButton() {
        if (!this.copyFromParentButton) {
            this.copyFromParentButton = this.createCopyFromParentButton();
        }

        this.appendChild(this.copyFromParentButton);
        this.updateCopyButtonState();
    }

    private createCopyFromParentButton(): Button {
        const parentProjectName = this.parentProjects[0]?.getDisplayName() || '';
        const button: Button = new Button(i18n('settings.wizard.project.copy', parentProjectName)).setEnabled(false);
        button.addClass('copy-parent-button');

        button.onClicked(() => {
            if (!this.parentProjects) {
                return;
            }

            this.doCopyFromParent();
        });

        return button;
    }

    protected abstract doCopyFromParent(): void;

    abstract updateCopyButtonState(): void;

}
