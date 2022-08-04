import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ProjectData} from '../data/ProjectData';
import * as Q from 'q';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {ProjectPermissionsDialogStepData} from '../data/ProjectPermissionsDialogStepData';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {LocaleViewer} from '../../../../../locale/LocaleViewer';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {Flag} from '../../../../../locale/Flag';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';

export class ProjectSummaryStep
    extends DialogStep {

    private dataContainer: DivEl;

    private data: ProjectData;

    private idContainer: ProjectParamContainer;

    private descriptionContainer: ProjectParamContainer;

    private parentProjectContainer: ProjectParamContainer;

    private languageContainer: ProjectLanguageParamContainer;

    private accessContainer: ProjectAccessParamContainer;

    private permissionsContainer: ProjectPermissionsParamContainer;

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

        this.idContainer = new ProjectParamContainer().updateTitle(i18n('dialog.project.wizard.summary.id.title'));
        this.dataContainer.appendChild(this.idContainer);

        this.descriptionContainer =
            new ProjectParamContainer().updateTitle(i18n('dialog.project.wizard.summary.description.title'));
        this.dataContainer.appendChild(this.descriptionContainer);

        this.parentProjectContainer =
            new ProjectParamContainer().updateTitle(i18n('dialog.project.wizard.summary.parent.title'));
        this.dataContainer.appendChild(this.parentProjectContainer);

        this.languageContainer = new ProjectLanguageParamContainer();
        this.languageContainer.updateTitle(i18n('dialog.project.wizard.summary.language.title'));
        this.dataContainer.appendChild(this.languageContainer);

        this.accessContainer = new ProjectAccessParamContainer(this.currentUser);
        this.accessContainer.updateTitle(i18n('dialog.project.wizard.summary.access.title'));
        this.dataContainer.appendChild(this.accessContainer);

        this.permissionsContainer = new ProjectPermissionsParamContainer(this.currentUser);
        this.permissionsContainer.updateTitle(i18n('dialog.project.wizard.summary.permissions.title'));
        this.dataContainer.appendChild(this.permissionsContainer);
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
    }

    private updateIdBlock(): void {
        this.idContainer.updateValue(`${this.data.displayName} (${this.data.name})`);
    }

    private updateDescriptionBlock(): void {
        if (this.data.description) {
            this.descriptionContainer.updateValue(this.data.description);
            this.descriptionContainer.show();
        } else {
            this.descriptionContainer.hide();
        }
    }

    private updateParentProjectBlock(): void {
        if (this.data.parent) {
            this.parentProjectContainer.updateValue(`${this.data.parent.getDisplayName()} (${this.data.parent.getName()})`);
            this.parentProjectContainer.show();
        } else {
            this.parentProjectContainer.hide();
        }
    }

    private updateLanguageBlock(): void {
        if (this.data.locale) {
            this.languageContainer.updateLocale(this.data.locale);
            this.languageContainer.show();
        } else {
            this.languageContainer.hide();
        }
    }

    private updateAccessContainer(): void {
        this.accessContainer.updateValue(i18n(`settings.items.wizard.readaccess.${this.data.access.getAccess()}`));
        this.accessContainer.setPrincipals(this.data.access.getPrincipals());
    }

    private updatePermissionsBlock(): void {
        if (!this.data.permissions?.isEmpty()) {
            this.permissionsContainer.setPermissions(this.data.permissions);
            this.permissionsContainer.show();
        } else {
            this.permissionsContainer.hide();
        }
    }

    getName(): string {
        return 'projectSummary';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.summary.description');
    }
}

class ProjectParamContainer
    extends DivEl {

    protected readonly paramBlock: Element;

    protected readonly valueBlock: Element;

    constructor() {
        super('project-param-container');

        this.paramBlock = new H6El('param');
        this.valueBlock = new H6El('value');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.paramBlock);
            this.appendChild(this.valueBlock);

            return rendered;
        });
    }

    updateTitle(title: string): ProjectParamContainer {
        this.paramBlock.setHtml(title);
        return this;
    }

    updateValue(value: string): ProjectParamContainer {
        this.valueBlock.setHtml(value);
        return this;
    }
}

class ProjectLanguageParamContainer
    extends ProjectParamContainer {

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('language-param-container');

            return rendered;
        });
    }

    updateLocale(locale: Locale): ProjectParamContainer {
        this.valueBlock.removeChildren();

        const viewer: LocaleViewer = new LocaleViewer();
        const flag: Flag = new Flag(locale.getLanguage());

        viewer.appendChild(flag);
        viewer.setObject(locale);
        this.valueBlock.appendChild(viewer);

        return this;
    }
}

class ProjectPrincipalsParamContainer
    extends ProjectParamContainer {

    protected readonly principalsContainer: DivEl;

    protected currentUser?: Principal;

    constructor(currentUser?: Principal) {
        super();

        this.principalsContainer = new DivEl('principals-container');
        this.currentUser = currentUser;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('principals-param-container');
            this.appendChild(this.principalsContainer);

            return rendered;
        });
    }

    protected addItems(name: string, principals: Principal[]): void {
        const wrapper: DivEl = new DivEl('wrapper');
        wrapper.appendChild(new DivEl('name').setHtml(name));

        const principalsBlock: DivEl = new DivEl('principals');

        principals?.forEach((principal: Principal) => {
            const viewer: PrincipalViewerCompact = new PrincipalViewerCompact();
            viewer.setObject(principal);
            viewer.setCurrentUser(this.currentUser);
            principalsBlock.appendChild(viewer);
        });

        wrapper.appendChild(principalsBlock);

        this.principalsContainer.appendChild(wrapper);
    }
}

class ProjectAccessParamContainer
    extends ProjectPrincipalsParamContainer {

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('access-param-container');

            return rendered;
        });
    }

    updateValue(value: string): ProjectParamContainer {
        this.valueBlock.show();
        return super.updateValue(value);
    }

    setPrincipals(principals: Principal[]): ProjectAccessParamContainer {
        this.principalsContainer.removeChildren();

        if (principals?.length > 0) {
            this.valueBlock.hide();
            this.addItems(i18n('settings.items.wizard.readaccess.custom'), principals);
        }

        return this;
    }
}

class ProjectPermissionsParamContainer
    extends ProjectPrincipalsParamContainer {

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('permissions-param-container');
            this.valueBlock.hide();

            return rendered;
        });
    }

    setPermissions(permissions: ProjectPermissionsDialogStepData): ProjectPermissionsParamContainer {
        this.principalsContainer.removeChildren();

        if (permissions.getContributors().length > 0) {
            const contributor: string = i18n('settings.projects.access.contributor');
            this.addItems(contributor, permissions.getContributors());
        }

        if (permissions.getAuthors().length > 0) {
            const author: string = i18n('settings.projects.access.author');
            this.addItems(author, permissions.getAuthors());
        }

        if (permissions.getEditors().length > 0) {
            const editor: string = i18n('settings.projects.access.editor');
            this.addItems(editor, permissions.getEditors());
        }

        if (permissions.getOwners().length > 0) {
            const owner: string = i18n('settings.projects.access.owner');
            this.addItems(owner, permissions.getOwners());
        }

        return this;
    }
}
