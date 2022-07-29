import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {MultiStepDialog} from './MultiStepDialog';
import {DialogStep} from './DialogStep';
import {ProjectParentDialogStep} from './ProjectParentDialogStep';
import {ProjectLocaleDialogStep} from './ProjectLocaleDialogStep';
import {ProjectIdDialogStep} from './ProjectIdDialogStep';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {Project} from '../data/project/Project';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';

export class ProjectWizardDialog
    extends MultiStepDialog {

    private preSelectedProject?: Project;

    private isNameToBeGeneratedFromParent: boolean;

    constructor(steps: DialogStep[], preselectedProject?: Project) {
        super({
            class: 'project-wizard-dialog grey-header',
            steps: steps
        });

        this.preSelectedProject = preselectedProject;
    }

    protected initListeners() {
        super.initListeners();

        this.steps.find((step: DialogStep) => step instanceof ProjectParentDialogStep)?.onDataChanged(
            () => this.isNameToBeGeneratedFromParent = true);
    }

    protected displayStep(step: ProjectDialogStep) {
        super.displayStep(step);

        if (this.isNameToBeGeneratedFromParent && this.isProjectIdStep()) {
            this.setProjectNameFromParent();
        } else if (this.preSelectedProject && this.isProjectParentStep()) {
            this.setPreSelectedProject();
        }
    }

    private isProjectIdStep(): boolean {
        return this.currentStep instanceof ProjectIdDialogStep;
    }

    private setProjectNameFromParent(): void {
        const parentProject: Project = this.getParentProject();
        const locale: Locale = this.getSelectedLocale();

        if (parentProject && locale) {
            const newName: string = `${parentProject.getName()}-${locale.getId().toLowerCase()}`;
            const description: string =
                parentProject.getDescription() ? `${parentProject.getDescription()} (${locale.getDisplayName()})` : '';
            (<ProjectIdDialogStep>this.currentStep).setDescription(description, true);
            (<ProjectIdDialogStep>this.currentStep).setDisplayName(newName, true);
            (<ProjectIdDialogStep>this.currentStep).setName(newName);
        }

        this.isNameToBeGeneratedFromParent = false;
    }

    private getParentProject(): Project {
        const step: ProjectParentDialogStep =
            <ProjectParentDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectParentDialogStep);

        return step?.getSelectedProject();
    }

    private getSelectedLocale(): Locale {
        const step: ProjectLocaleDialogStep =
            <ProjectLocaleDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectLocaleDialogStep);

        return step.getSelectedLocale();
    }

    private isProjectParentStep(): boolean {
        return this.currentStep instanceof ProjectParentDialogStep;
    }

    private setPreSelectedProject(): void {
        (<ProjectParentDialogStep>this.currentStep).setSelectedProject(this.preSelectedProject);

        this.preSelectedProject = null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.getHeaderContent());

            return rendered;
        });
    }

    private getHeaderContent(): NamesAndIconView {
        const namesAndIconView: NamesAndIconView = new NamesAndIconView(new NamesAndIconViewBuilder()
            .setSize(NamesAndIconViewSize.medium))
            .setMainName(i18n('dialog.project.wizard.title'))
            .setSubName(i18n('dialog.project.wizard.subtitle'))
            .setIconClass(ProjectIconUrlResolver.getDefaultProjectIcon());

        return namesAndIconView;
    }

}
