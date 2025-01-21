import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ProjectData} from '../../data/ProjectData';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {SummaryNameContainer} from './SummaryNameContainer';
import {SummaryValueContainer} from './SummaryValueContainer';
import {LanguageValueContainer} from './LanguageValueContainer';
import {ApplicationsValueContainer} from './ApplicationsValueContainer';
import {AccessValueContainer} from './AccessValueContainer';
import {PermissionsValueContainer} from './PermissionsValueContainer';
import {ProjectsValueContainer} from './ProjectsValueContainer';
import {ProjectConfigContext} from '../../../../../data/project/ProjectConfigContext';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';

export class ProjectSummaryStep
    extends DialogStep {

    private dataContainer: DivEl;

    private data: ProjectData;

    private idContainer: SummaryValueContainer;

    private descriptionContainer: SummaryValueContainer;

    private parentProjectsContainer: ProjectsValueContainer;

    private languageContainer: LanguageValueContainer;

    private accessContainer: AccessValueContainer;

    private permissionsContainer: PermissionsValueContainer;

    private applicationsContainer: ApplicationsValueContainer;

    constructor() {
        super();
    }

    getHtmlEl(): Element {
        if (!this.dataContainer) {
            this.initElements();
        }

        return this.dataContainer;
    }

    private initElements(): void {
        this.dataContainer = new DivEl('project-summary-step');
    }

    isOptional(): boolean {
        return true;
    }

    hasData(): boolean {
        return !!this.data;
    }

    setData(data: ProjectData): void {
        this.data = data;
        this.updateDisplayedSummary();
    }

    private updateDisplayedSummary(): void {
        this.updateIdBlock();
        this.updateDescriptionBlock();
        this.updateParentProjectBlock();
        this.updateLanguageBlock();
        this.updateAccessContainer();
        this.updatePermissionsBlock();
        this.updateApplicationsBlock();
    }

    private updateIdBlock(): void {
        if (!this.idContainer) {
            this.createAndAddIdContainer();
        }

        this.idContainer.updateValue(`${this.data.displayName} (${this.data.name})`);
    }

    private createAndAddIdContainer(): void {
        const idNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(i18n('dialog.project.wizard.summary.id.title'));
        this.idContainer = new SummaryValueContainer('id-value-container');
        this.dataContainer.prependChild(this.idContainer);
        this.dataContainer.prependChild(idNameContainer);
    }

    private updateDescriptionBlock(): void {
        if (this.data.description) {
            if (!this.descriptionContainer) {
                this.createAndAddDescriptionBlock();
            }

            this.descriptionContainer.updateValue(this.data.description);
            this.setContainerVisible(this.descriptionContainer, true);
        } else {
            this.setContainerVisible(this.descriptionContainer, false);
        }
    }

    private setContainerVisible(container: SummaryValueContainer, show: boolean): void {
        if (show) {
            container?.getPreviousElement()?.show();
            container?.show();
        } else {
            container?.getPreviousElement()?.hide();
            container?.hide();
        }
    }

    private createAndAddDescriptionBlock(): void {
        const descriptionNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.description.title'));
        this.descriptionContainer = new SummaryValueContainer();
        descriptionNameContainer.insertAfterEl(this.idContainer);
        this.descriptionContainer.insertAfterEl(descriptionNameContainer);
    }

    private updateParentProjectBlock(): void {
        if (this.data.parents?.length) {
            if (!this.parentProjectsContainer) {
                this.createAndAddParentProjectContainer();
            }

            this.parentProjectsContainer.updateValue(this.data.parents);
            this.setContainerVisible(this.parentProjectsContainer, true);
        } else {
            this.setContainerVisible(this.parentProjectsContainer, false);
        }
    }

    private createAndAddParentProjectContainer(): void {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const parentNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            isMultiInheritance ? i18n('settings.field.project.parents') : i18n('settings.field.project.parent')
        );
        this.parentProjectsContainer = new ProjectsValueContainer();
        this.dataContainer.prependChild(this.parentProjectsContainer);
        this.dataContainer.prependChild(parentNameContainer);
    }

    private updateLanguageBlock(): void {
        if (this.data.locale) {
            if (!this.languageContainer) {
                this.createAndAddLanguageContainer();
            }

            this.languageContainer.updateValue(this.data.locale);
            this.setContainerVisible(this.languageContainer, true);
        } else {
            this.setContainerVisible(this.languageContainer, false);
        }
    }

    private createAndAddLanguageContainer(): void {
        const languageNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.language.title'));
        this.languageContainer = new LanguageValueContainer();
        const insertAfterEl: Element = this.descriptionContainer || this.idContainer;
        languageNameContainer.insertAfterEl(insertAfterEl);
        this.languageContainer.insertAfterEl(languageNameContainer);
    }

    private updateAccessContainer(): void {
        if (this.data.access) {
            if (!this.accessContainer) {
                this.createAndAddAccessContainer();
            }

            this.accessContainer.updateValue(i18n(`settings.items.wizard.readaccess.${this.data.access.getAccess()}`));
            this.accessContainer.setPrincipals(this.data.access.getPrincipals());
            this.setContainerVisible(this.accessContainer, true);
        } else {
            this.setContainerVisible(this.accessContainer, false);
        }
    }

    private createAndAddAccessContainer(): void {
        const accessNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.access.title'));
        this.accessContainer = new AccessValueContainer(AuthContext.get().getUser());
        const insertAfterEl: Element = this.languageContainer || this.descriptionContainer || this.idContainer;
        accessNameContainer.insertAfterEl(insertAfterEl);
        this.accessContainer.insertAfterEl(accessNameContainer);
    }

    private updatePermissionsBlock(): void {
        if (!this.data.permissions?.isEmpty()) {
            if (!this.permissionsContainer) {
                this.createAndAddPermissions();
            }

            this.permissionsContainer.updateValue(this.data.permissions);
            this.setContainerVisible(this.permissionsContainer, true);
        } else {
            this.setContainerVisible(this.permissionsContainer, false);
        }
    }

    private createAndAddPermissions(): void {
        const permissionsNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.permissions.title'));
        this.permissionsContainer = new PermissionsValueContainer(AuthContext.get().getUser());
        const insertAfterEl: Element = this.accessContainer || this.languageContainer ||
                                        this.descriptionContainer || this.idContainer;
        permissionsNameContainer.insertAfterEl(insertAfterEl);
        this.permissionsContainer.insertAfterEl(permissionsNameContainer);
    }

    private updateApplicationsBlock(): void {
        if (this.data.applications?.length > 0) {
            if (!this.applicationsContainer) {
                this.createAndAddApplicationsBlock();
            }

            this.applicationsContainer.updateValue(this.data.applications);
            this.setContainerVisible(this.applicationsContainer, true);
        } else {
            this.setContainerVisible(this.applicationsContainer, false);
        }
    }

    private createAndAddApplicationsBlock(): void {
        const applicationsNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.applications.title'));
        this.applicationsContainer = new ApplicationsValueContainer();
        const insertAfterEl: Element = this.permissionsContainer || this.accessContainer || this.languageContainer ||
                                       this.descriptionContainer || this.idContainer;
        applicationsNameContainer.insertAfterEl(insertAfterEl);
        this.applicationsContainer.insertAfterEl(applicationsNameContainer);
    }

    getName(): string {
        return 'projectSummary';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.summary.description');
    }
}
