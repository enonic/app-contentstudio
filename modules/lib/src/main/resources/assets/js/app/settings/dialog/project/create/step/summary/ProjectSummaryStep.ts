import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ProjectData} from '../../data/ProjectData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {SummaryNameContainer} from './SummaryNameContainer';
import {SummaryValueContainer} from './SummaryValueContainer';
import {LanguageValueContainer} from './LanguageValueContainer';
import {ApplicationsValueContainer} from './ApplicationsValueContainer';
import {AccessValueContainer} from './AccessValueContainer';
import {PermissionsValueContainer} from './PermissionsValueContainer';

export class ProjectSummaryStep
    extends DialogStep {

    private dataContainer: DivEl;

    private data: ProjectData;

    private idContainer: SummaryValueContainer;

    private descriptionContainer: SummaryValueContainer;

    private parentProjectContainer: SummaryValueContainer;

    private languageContainer: LanguageValueContainer;

    private accessContainer: AccessValueContainer;

    private permissionsContainer: PermissionsValueContainer;

    private applicationsContainer: ApplicationsValueContainer;

    private currentUser?: Principal;

    constructor() {
        super();

        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.currentUser = loginResult.getUser();
        }).catch(DefaultErrorHandler.handle);
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
        return true;
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
            this.descriptionContainer.show();
        } else {
            this.descriptionContainer?.getPreviousElement()?.hide();
            this.descriptionContainer?.hide();
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
        if (this.data.parent) {
            if (!this.parentProjectContainer) {
                this.createAndAddParentProjectContainer();
            }

            this.parentProjectContainer.updateValue(`${this.data.parent.getDisplayName()} (${this.data.parent.getName()})`);
            this.parentProjectContainer.show();
        } else {
            this.parentProjectContainer?.getPreviousElement()?.hide();
            this.parentProjectContainer?.hide();
        }
    }

    private createAndAddParentProjectContainer(): void {
        const parentNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.parent.title'));
        this.parentProjectContainer = new SummaryValueContainer();
        const insertAfterEl: Element = this.descriptionContainer || this.idContainer || this.dataContainer;
        parentNameContainer.insertAfterEl(insertAfterEl);
        this.parentProjectContainer.insertAfterEl(parentNameContainer);
    }

    private updateLanguageBlock(): void {
        if (this.data.locale) {
            if (!this.languageContainer) {
                this.createAndAddLanguageContainer();
            }

            this.languageContainer.updateValue(this.data.locale);
            this.languageContainer.show();
        } else {
            this.languageContainer?.getPreviousElement()?.hide();
            this.languageContainer?.hide();
        }
    }

    private createAndAddLanguageContainer(): void {
        const languageNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.language.title'));
        this.languageContainer = new LanguageValueContainer();
        const insertAfterEl: Element = this.parentProjectContainer || this.descriptionContainer || this.idContainer || this.dataContainer;
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
            this.accessContainer.show();
        } else {
            this.accessContainer?.getPreviousElement()?.hide();
            this.accessContainer?.hide();
        }
    }

    private createAndAddAccessContainer(): void {
        const accessNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.access.title'));
        this.accessContainer = new AccessValueContainer(this.currentUser);
        const insertAfterEl: Element = this.languageContainer || this.parentProjectContainer || this.descriptionContainer ||
                                       this.idContainer || this.dataContainer;
        accessNameContainer.insertAfterEl(insertAfterEl);
        this.accessContainer.insertAfterEl(accessNameContainer);
    }

    private updatePermissionsBlock(): void {
        if (!this.data.permissions?.isEmpty()) {
            if (!this.permissionsContainer) {
                this.createAndAddPermissions();
            }

            this.permissionsContainer.updateValue(this.data.permissions);
            this.permissionsContainer.show();
        } else {
            this.permissionsContainer?.hide();
        }
    }

    private createAndAddPermissions(): void {
        const permissionsNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.permissions.title'));
        this.permissionsContainer = new PermissionsValueContainer(this.currentUser);
        const insertAfterEl: Element = this.accessContainer || this.languageContainer || this.parentProjectContainer ||
                                       this.descriptionContainer || this.idContainer || this.dataContainer;
        permissionsNameContainer.insertAfterEl(insertAfterEl);
        this.permissionsContainer.insertAfterEl(permissionsNameContainer);
    }

    private updateApplicationsBlock(): void {
        if (this.data.applications?.length > 0) {
            if (!this.applicationsContainer) {
                this.createAndAddApplicationsBlock();
            }

            this.applicationsContainer.updateValue(this.data.applications);
            this.applicationsContainer.show();
        } else {
            this.applicationsContainer?.hide();
        }
    }

    private createAndAddApplicationsBlock(): void {
        const applicationsNameContainer: SummaryNameContainer = new SummaryNameContainer().updateName(
            i18n('dialog.project.wizard.summary.applications.title'));
        this.applicationsContainer = new ApplicationsValueContainer();
        const insertAfterEl: Element = this.permissionsContainer || this.accessContainer || this.languageContainer ||
                                       this.parentProjectContainer || this.descriptionContainer || this.idContainer || this.dataContainer;
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
