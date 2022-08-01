import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DialogStep} from './DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ProjectData} from './ProjectData';
import * as Q from 'q';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {ProjectPermissionsData} from './ProjectPermissionsData';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';

export class ProjectSummaryStep
    extends DialogStep {

    private dataContainer: DivEl;

    private data: ProjectData;

    private idContainer: ProjectParamContainer;

    private descriptionContainer: ProjectParamContainer;

    private parentProjectContainer: ProjectParamContainer;

    private languageContainer: ProjectParamContainer;

    private accessContainer: ProjectAccessParamContainer;

    private permissionsContainer: ProjectPermissionsParamContainer;

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

        this.languageContainer =
            new ProjectParamContainer().updateTitle(i18n('dialog.project.wizard.summary.language.title'));
        this.dataContainer.appendChild(this.languageContainer);

        this.accessContainer = new ProjectAccessParamContainer();
        this.accessContainer.updateTitle(i18n('dialog.project.wizard.summary.access.title'));
        this.dataContainer.appendChild(this.accessContainer);

        this.permissionsContainer = new ProjectPermissionsParamContainer();
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
            this.languageContainer.updateValue(`${this.data.locale.getDisplayName()} (${this.data.locale.getProcessedTag()})`);
            this.languageContainer.show();
        } else {
            this.languageContainer.hide();
        }
    }

    private updateAccessContainer(): void {
        this.accessContainer.updateValue(i18n(`settings.items.wizard.readaccess.${this.data.access.getType()}`));
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

class ProjectAccessParamContainer extends ProjectParamContainer {

    protected readonly principalsBlock: DivEl;

    constructor() {
        super();

        this.principalsBlock = new DivEl('principals');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('access-param-container');
            this.appendChild(this.principalsBlock);

            return rendered;
        });
    }

    setPrincipals(principals: Principal[]): ProjectAccessParamContainer {
        this.principalsBlock.removeChildren();
        this.principalsBlock.setVisible(principals?.length > 0);

        principals?.forEach((principal: Principal) => {
            const viewer: PrincipalViewer = new PrincipalViewer();
            viewer.setObject(principal);
            this.principalsBlock.appendChild(viewer);
        });

        return this;
    }
}

class ProjectPermissionsParamContainer extends ProjectParamContainer {

    protected readonly principalsBlock: DivEl;

    constructor() {
        super();

        this.principalsBlock = new DivEl('principals-roles');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('permissions-param-container');
            this.valueBlock.hide();
            this.appendChild(this.principalsBlock);

            return rendered;
        });
    }

    setPermissions(permissions: ProjectPermissionsData): ProjectPermissionsParamContainer {
        this.principalsBlock.removeChildren();

        const contributor: string = i18n('settings.projects.access.contributor');

        permissions.getContributors().forEach((p: Principal) => {
            this.addEntry(p, contributor);
        });

        const author: string = i18n('settings.projects.access.author');

        permissions.getAuthors().forEach((p: Principal) => {
            this.addEntry(p, author);
        });

        const editor: string = i18n('settings.projects.access.editor');

        permissions.getEditors().forEach((p: Principal) => {
            this.addEntry(p, editor);
        });

        const owner: string = i18n('settings.projects.access.owner');

        permissions.getOwners().forEach((p: Principal) => {
            this.addEntry(p, owner);
        });

        return this;
    }

    private addEntry(principal: Principal, role: string): void {
        const wrapper: DivEl = new DivEl('wrapper');
        const viewer: PrincipalViewer = new PrincipalViewer();
        const roleBlock: SpanEl = new SpanEl('role');

        viewer.setObject(principal)
        roleBlock.setHtml(role);
        wrapper.appendChildren(viewer, roleBlock);

        this.principalsBlock.appendChild(wrapper);
    }
}
