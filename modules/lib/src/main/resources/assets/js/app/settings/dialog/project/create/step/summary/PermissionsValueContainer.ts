import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {SummaryValueContainer} from './SummaryValueContainer';
import {type ProjectPermissionsDialogStepData} from '../../data/ProjectPermissionsDialogStepData';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PrincipalsContainer} from './PrincipalsContainer';

export class PermissionsValueContainer
    extends SummaryValueContainer {

    protected currentUser?: Principal;

    constructor(currentUser?: Principal) {
        super('permissions-container');

        this.currentUser = currentUser;
    }

    protected createItemContainer(): Element {
        return new DivEl('permissions');
    }

    updateValue(permissions: ProjectPermissionsDialogStepData): PermissionsValueContainer {
        this.itemContainer.removeChildren();

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

    private addItems(name: string, principals: Principal[]): void {
        const wrapper: DivEl = new DivEl('wrapper');
        wrapper.appendChild(new DivEl('name').setHtml(name));

        const principalsBlock: PrincipalsContainer = new PrincipalsContainer(this.currentUser);
        principalsBlock.setItems(principals);
        wrapper.appendChild(principalsBlock);

        this.itemContainer.appendChild(wrapper);
    }
}
