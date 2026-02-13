import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';

export class PrincipalsContainer
    extends DivEl {

    protected currentUser?: Principal;

    constructor(currentUser?: Principal) {
        super('principals-container');

        this.currentUser = currentUser;
    }

    setItems(principals: Principal[]): void {
        this.removeChildren();

        principals?.forEach((principal: Principal) => {
            const viewer: PrincipalViewerCompact = new PrincipalViewerCompact();
            viewer.setObject(principal);
            viewer.setCurrentUser(this.currentUser);
            this.appendChild(viewer);
        });
    }
}
