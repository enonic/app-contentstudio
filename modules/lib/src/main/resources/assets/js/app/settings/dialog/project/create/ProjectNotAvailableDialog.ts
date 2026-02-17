import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import type Q from 'q';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ProjectWizardDialog} from './ProjectWizardDialog';
import {ProjectSteps} from './ProjectSteps';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {ProjectContext} from '../../../../project/ProjectContext';

export class ProjectNotAvailableDialog
    extends ModalDialog {

    private textContainer: Element;

    private openProjectWizardAction: Action;

    constructor() {
        super({
            title: i18n('dialog.project.wizard.noProjects.title'),
            class: 'notification-dialog'
        });
    }

    protected initElements() {
        super.initElements();

        this.textContainer = this.createTextContainer();
        this.openProjectWizardAction = new Action(i18n('dialog.project.wizard.noProjects.action'));
    }

    private createTextContainer(): Element {
        const el: H6El = new H6El('project-not-available-step');
        el.setHtml(i18n('dialog.project.wizard.noProjects.text'));
        return el;
    }

    protected initListeners() {
        super.initListeners();

        this.openProjectWizardAction.onExecuted(() => {
            this.close();

            new ProjectWizardDialog({
                steps: ProjectSteps.create(),
                title: i18n('dialog.project.wizard.title')
            }).open();
        });
    }

    close() {
        super.close();
        this.setNoProjectsAvailable();
    }

    private setNoProjectsAvailable(): void {
        const body: Body = Body.get();
        const bodyClass: string = 'no-projects';

        if (body.hasClass(bodyClass)) {
            return;
        }

        body.addClass(bodyClass);
        const noProjectsBlock: Element = this.createNoProjectsBlock();

        ProjectContext.get().whenInitialized(() => {
            body.removeClass(bodyClass);
            body.removeChild(noProjectsBlock);
        });

        body.appendChild(noProjectsBlock);
    }

    private createNoProjectsBlock(): Element {
        const noProjectsBlock: DivEl = new DivEl('no-projects-text');
        const textBlock: DivEl = new DivEl().setHtml(i18n('notify.settings.project.notAvailable'));
        const wizardButton: Element = new ActionButton(this.openProjectWizardAction).addClass('open-create-project-dialog-action');
        noProjectsBlock.appendChild(textBlock);
        noProjectsBlock.appendChild(wizardButton);

        return noProjectsBlock;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToContentPanel(this.textContainer);
            this.addAction(this.openProjectWizardAction, true);
            return rendered;
        });
    }
}
